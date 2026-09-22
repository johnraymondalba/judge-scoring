import { getState, patchConfig, stripSecrets, usingFallbackStorage } from "../../lib/db";
import { hashPin, isValidPinFormat, readSession } from "../../lib/auth";

/**
 * Scores are organizer-only. A signed-in judge gets back just their own
 * entries (so their tab can show what they've already submitted), and a
 * signed-out visitor gets none at all — that is what keeps the live
 * leaderboard from leaking to judges mid-event.
 */
function visibleScores(allScores, session) {
  if (!session) return {};
  if (session.role === "admin") return allScores;
  if (session.role === "judge") {
    const mine = {};
    Object.keys(allScores || {}).forEach((key) => {
      if (key.startsWith(`${session.judgeId}::`)) mine[key] = allScores[key];
    });
    return mine;
  }
  return {};
}

/**
 * Judges arrive from the browser without their credentials (those are never
 * sent out), so merge each incoming row onto the stored one to preserve the
 * existing hash. A row may carry `pin` to set a new PIN, or `clearPin` to
 * revoke access entirely.
 */
function mergeJudges(incoming, existing) {
  const byId = new Map((existing || []).map((j) => [j.id, j]));

  return incoming.map((row) => {
    const prior = byId.get(row.id);
    const base = {
      id: row.id,
      name: typeof row.name === "string" ? row.name.trim() : "",
      assignedPin: prior ? prior.assignedPin : undefined,
      pinHash: prior ? prior.pinHash : undefined,
      pinSalt: prior ? prior.pinSalt : undefined,
    };

    if (row.clearPin) {
      delete base.assignedPin;
      delete base.pinHash;
      delete base.pinSalt;
      return base;
    }

    if (row.pin) {
      if (!isValidPinFormat(row.pin)) {
        const err = new Error(`PIN for ${base.name || "judge"} must be 4–6 digits.`);
        err.statusCode = 400;
        throw err;
      }
      const { pinHash, pinSalt } = hashPin(row.pin);
      return { ...base, assignedPin: row.pin, pinHash, pinSalt };
    }

    return base;
  });
}

export default async function handler(req, res) {
  try {
    const session = readSession(req);
    const isAdmin = Boolean(session && session.role === "admin");

    if (req.method === "GET") {
      const state = await getState();
      const publicState = stripSecrets(state, isAdmin);
      const presentedIds = new Set(state.presentedParticipantIds || []);
      return res.status(200).json({
        ...publicState,
        participants: isAdmin
          ? publicState.participants
          : session && session.role === "judge"
            ? publicState.participants.filter((p) => presentedIds.has(p.id))
            : [],
        scores: visibleScores(state.scores, session),
        _fallback: usingFallbackStorage(),
      });
    }

    if (req.method === "PATCH") {
      if (!isAdmin) {
        return res.status(401).json({ error: "Organizer sign-in required." });
      }

      const state = await getState();
      const body = req.body || {};
      const patch = {};

      if (Array.isArray(body.criteria)) patch.criteria = body.criteria;
      if (Array.isArray(body.participants)) {
        patch.participants = body.participants;

        // Removing a participant must also remove stale presentation state.
        const remainingIds = new Set(body.participants.map((p) => p.id));
        patch.presentedParticipantIds = (state.presentedParticipantIds || []).filter((id) =>
          remainingIds.has(id)
        );
        if (state.activeParticipantId && !remainingIds.has(state.activeParticipantId)) {
          patch.activeParticipantId = null;
        }
      }
      if (Array.isArray(body.judges)) patch.judges = mergeJudges(body.judges, state.judges);
      if (typeof body.eventName === "string") patch.eventName = body.eventName;

      if (Object.prototype.hasOwnProperty.call(body, "activeParticipantId")) {
        const activeId = body.activeParticipantId;
        if (activeId !== null && typeof activeId !== "string") {
          return res.status(400).json({ error: "Invalid presenting participant." });
        }

        const participants = patch.participants || state.participants;
        if (activeId && !participants.some((p) => p.id === activeId)) {
          return res.status(400).json({ error: "Unknown participant." });
        }

        patch.activeParticipantId = activeId;
        if (activeId) {
          patch.presentedParticipantIds = Array.from(
            new Set([...(patch.presentedParticipantIds || state.presentedParticipantIds || []), activeId])
          );
        }
      }

      const next = await patchConfig(patch);
      return res.status(200).json({
        ...stripSecrets(next, true),
        scores: visibleScores(next.scores, session),
        _fallback: usingFallbackStorage(),
      });
    }

    res.setHeader("Allow", ["GET", "PATCH"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    if (err.statusCode === 400) return res.status(400).json({ error: err.message });
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
