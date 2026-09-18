import { getState, putScore, removeScore } from "../../lib/db";
import { readSession } from "../../lib/auth";

export function scoreKeyFor(judgeId, participantId) {
  return `${judgeId}::${participantId}`;
}

export default async function handler(req, res) {
  try {
    const session = readSession(req);
    if (!session) return res.status(401).json({ error: "Sign in to submit scores." });

    if (req.method === "POST") {
      if (session.role !== "judge") {
        return res.status(403).json({ error: "Only judges can submit scores." });
      }

      const { participantId, scores } = req.body || {};
      if (!participantId || typeof scores !== "object" || scores === null) {
        return res.status(400).json({ error: "participantId and scores are required" });
      }

      const state = await getState();
      if (!state.participants.some((p) => p.id === participantId)) {
        return res.status(400).json({ error: "Unknown participant." });
      }

      // Every criterion must carry a real number. Rejecting partial submissions
      // here is what stops an untouched slider from quietly counting as a score.
      const clean = {};
      for (const criterion of state.criteria) {
        const raw = scores[criterion.id];
        const value = typeof raw === "number" ? raw : Number(raw);
        if (raw === null || raw === undefined || raw === "" || !Number.isFinite(value)) {
          return res.status(400).json({ error: `Missing a score for "${criterion.name}".` });
        }
        if (value < 0 || value > 100) {
          return res.status(400).json({ error: `"${criterion.name}" must be between 0 and 100.` });
        }
        clean[criterion.id] = Math.round(value * 100) / 100;
      }

      // The judge's identity comes from the signed session cookie, never from
      // the request body — a judge cannot submit on someone else's behalf.
      const key = scoreKeyFor(session.judgeId, participantId);
      const entry = { ...clean, submittedAt: new Date().toISOString() };
      await putScore(key, entry);

      return res.status(200).json({ ok: true, key, entry });
    }

    if (req.method === "DELETE") {
      const { participantId, judgeId } = req.body || {};
      if (!participantId) return res.status(400).json({ error: "participantId is required" });

      // Judges may only clear their own score; organizers may clear anyone's.
      const targetJudge = session.role === "admin" ? judgeId : session.judgeId;
      if (!targetJudge) return res.status(400).json({ error: "judgeId is required" });

      const key = scoreKeyFor(targetJudge, participantId);
      await removeScore(key);
      return res.status(200).json({ ok: true, key });
    }

    res.setHeader("Allow", ["POST", "DELETE"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
