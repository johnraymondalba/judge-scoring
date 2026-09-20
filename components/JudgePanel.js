import { useEffect, useMemo, useRef, useState } from "react";
import { scoreKey, weightedTotal } from "../lib/scoring";
import Icon from "./Icon";

function ScoreSentModal({ participant, countdown, onReturn }) {
  const returnRef = useRef(null);

  useEffect(() => {
    if (returnRef.current) returnRef.current.focus();

    function onKeyDown(e) {
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        onReturn();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onReturn]);

  if (!participant) return null;

  return (
    <div className="alert-scrim" onClick={onReturn}>
      <div
        className="alert"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="sent-title"
        aria-describedby="sent-message"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 320 }}
      >
        <div className="alert-body" style={{ padding: "24px 20px 18px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <span
              className="row-icon green"
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                boxShadow: "0 4px 12px rgba(28, 122, 62, 0.25)",
              }}
            >
              <Icon name="check" size={26} />
            </span>
          </div>
          <h2 id="sent-title" style={{ fontSize: "var(--f-title-3)", marginBottom: 6 }}>
            Scores Sent!
          </h2>
          <p
            id="sent-message"
            style={{ fontSize: "var(--f-subhead)", color: "var(--label-2)", lineHeight: 1.45 }}
          >
            Your scores for <strong>{participant.name}</strong>
            {participant.team ? ` (${participant.team})` : ""} have been successfully sent.
          </p>
          <div
            style={{
              marginTop: 14,
              padding: "6px 14px",
              borderRadius: "var(--r-pill)",
              background: "var(--fill-2)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: "var(--f-caption)",
              color: "var(--label-2)",
            }}
          >
          </div>
        </div>
        <div className="alert-actions">
          <button
            type="button"
            ref={returnRef}
            className="preferred"
            onClick={onReturn}
            style={{ fontWeight: 600 }}
          >
            Select Next Team ({countdown}s)
          </button>
        </div>
        <div
          style={{
            height: 5,
            width: "100%",
            background: "var(--fill-2)",
            overflow: "hidden",
          }}
          role="progressbar"
          aria-valuenow={countdown}
          aria-valuemin={0}
          aria-valuemax={15}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.max(0, (countdown / 15) * 100)}%`,
              background: "var(--tint)",
              transition: "width 1s linear",
            }}
          />
        </div>
      </div>
    </div>
  );
}

/** Scores start empty rather than at a midpoint: an untouched criterion must
 *  never be indistinguishable from a deliberate score. */
function blankDraft(criteria) {
  const draft = {};
  criteria.forEach((c) => {
    draft[c.id] = null;
  });
  return draft;
}

function isBlank(draft, criteria) {
  return criteria.every((c) => draft[c.id] === null || draft[c.id] === undefined);
}

// --- draft persistence -----------------------------------------------------
//
// A judge scores a pitch that cannot be replayed, on their own phone, while
// standing. A locked screen, a reclaimed tab or a mistap must not cost them a
// sheet, so drafts are written per judge and per participant on every change.

function draftStorageKey(judgeId, participantId) {
  return `judging_draft::${judgeId}::${participantId}`;
}

function readStoredDraft(key, criteria) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const draft = {};
    criteria.forEach((c) => {
      const value = parsed[c.id];
      draft[c.id] = typeof value === "number" && Number.isFinite(value) ? value : null;
    });
    return isBlank(draft, criteria) ? null : draft;
  } catch (e) {
    return null;
  }
}

function writeStoredDraft(key, draft) {
  try {
    window.localStorage.setItem(key, JSON.stringify(draft));
  } catch (e) {
    /* storage unavailable; the in-memory draft still works */
  }
}

function clearStoredDraft(key) {
  try {
    window.localStorage.removeItem(key);
  } catch (e) {
    /* ignore */
  }
}

// --- criterion row ---------------------------------------------------------

function CriterionRow({ criterion, value, open, onToggle, onChange }) {
  const has = value !== null && value !== undefined;
  const panelId = `crit-panel-${criterion.id}`;
  const labelId = `crit-label-${criterion.id}`;

  function clamp(n) {
    return Math.min(100, Math.max(0, n));
  }

  return (
    <div className={`row-expandable ${open ? "open" : ""}`}>
      <button
        type="button"
        className="row"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="row-main">
          <span className="row-label-line">
            <span className="row-label" id={labelId}>
              {criterion.name}
            </span>
            <span className="badge">{criterion.weight}%</span>
          </span>
          {!has && <span className="row-sublabel">Not scored yet</span>}
        </span>
        <span className="row-trail">
          <span className={`score-value ${has ? "" : "unset"}`}>{has ? value : "—"}</span>
          <Icon name={open ? "chevronDown" : "chevronRight"} size={18} className="chevron" />
        </span>
      </button>

      <div className="row-body" id={panelId} role="region" aria-labelledby={labelId}>
        <div>
          <div className="row-body-inner">
            {criterion.description && <p className="criterion-desc">{criterion.description}</p>}

            <div className="slider-row">
              <input
                type="range"
                className={`slider ${has ? "" : "unset"}`}
                min={0}
                max={100}
                step={1}
                value={has ? value : 50}
                aria-labelledby={labelId}
                aria-valuetext={has ? `${value} out of 100` : "not scored yet"}
                onChange={(e) => onChange(Number(e.target.value))}
              />
              <span className="stepper">
                <button
                  type="button"
                  aria-label={`Lower ${criterion.name} by one`}
                  disabled={has && value <= 0}
                  onClick={() => onChange(has ? clamp(value - 1) : 50)}
                >
                  <Icon name="minus" size={18} />
                </button>
                <span aria-hidden="true" />
                <button
                  type="button"
                  aria-label={`Raise ${criterion.name} by one`}
                  disabled={has && value >= 100}
                  onClick={() => onChange(has ? clamp(value + 1) : 50)}
                >
                  <Icon name="plus" size={18} />
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- panel -----------------------------------------------------------------

export default function JudgePanel({
  state,
  judge,
  onSubmitScore,
  participantId,
  onParticipantChange,
}) {
  const { participants, criteria, scores } = state;
  const [draftScores, setDraftScores] = useState(() => blankDraft(criteria));
  const [openCriterion, setOpenCriterion] = useState(null);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [submittedParticipant, setSubmittedParticipant] = useState(null);
  const [countdown, setCountdown] = useState(15);

  const existing = participantId ? scores[scoreKey(judge.judgeId, participantId)] : null;

  const scoredIds = useMemo(() => {
    const set = new Set();
    participants.forEach((p) => {
      if (scores[scoreKey(judge.judgeId, p.id)]) set.add(p.id);
    });
    return set;
  }, [participants, scores, judge.judgeId]);

  function handleReturn() {
    setSubmittedParticipant(null);
    setCountdown(15);
    onParticipantChange("");
  }

  useEffect(() => {
    if (!submittedParticipant) return undefined;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleReturn();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submittedParticipant]);

  useEffect(() => {
    if (!participantId) {
      setDraftScores(blankDraft(criteria));
      setStatus(null);
      setOpenCriterion(null);
      return;
    }

    const stored = readStoredDraft(draftStorageKey(judge.judgeId, participantId), criteria);
    if (stored) {
      setDraftScores(stored);
      setStatus({ kind: "info", text: "Restored the scores you had not sent yet." });
    } else {
      const saved = scores[scoreKey(judge.judgeId, participantId)];
      const filled = {};
      criteria.forEach((c) => {
        filled[c.id] = saved ? saved[c.id] ?? null : null;
      });
      setDraftScores(filled);
      setStatus(null);
    }
    // Open the first criterion that still needs a score, so the judge lands on
    // the thing to do rather than on a closed list.
    const target = criteria.find((c) => {
      const saved = scores[scoreKey(judge.judgeId, participantId)];
      const seed = stored || (saved ? saved : {});
      return seed[c.id] === null || seed[c.id] === undefined;
    });
    setOpenCriterion(target ? target.id : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantId]);

  useEffect(() => {
    if (!participantId) return;
    const key = draftStorageKey(judge.judgeId, participantId);
    if (isBlank(draftScores, criteria)) clearStoredDraft(key);
    else writeStoredDraft(key, draftScores);
  }, [draftScores, participantId, judge.judgeId, criteria]);

  const total = useMemo(() => weightedTotal(draftScores, criteria), [draftScores, criteria]);
  const missing = criteria.filter(
    (c) => draftScores[c.id] === null || draftScores[c.id] === undefined
  );
  const complete = missing.length === 0 && criteria.length > 0;

  const done = scoredIds.size;
  const totalCount = participants.length;
  const pct = totalCount ? Math.round((done / totalCount) * 100) : 0;

  if (participants.length === 0 || criteria.length === 0) {
    return (
      <div className="empty">
        <span className="empty-title">Not ready yet</span>
        The organizer is still setting up{" "}
        {participants.length === 0 ? "the participants" : "the judging criteria"}. This page
        updates on its own once they finish.
      </div>
    );
  }

  function nextUnscoredAfter(id) {
    const order = participants.map((p) => p.id);
    const start = order.indexOf(id);
    for (let step = 1; step <= order.length; step += 1) {
      const candidate = order[(start + step) % order.length];
      if (candidate !== id && !scoredIds.has(candidate)) return candidate;
    }
    return null;
  }

  function setScore(criterionId, value) {
    setDraftScores((s) => ({ ...s, [criterionId]: value }));
  }

  async function submit() {
    if (!complete || busy) return;
    setBusy(true);
    setStatus(null);
    try {
      await onSubmitScore(participantId, draftScores);
      clearStoredDraft(draftStorageKey(judge.judgeId, participantId));
      const target = participants.find((p) => p.id === participantId);
      setSubmittedParticipant(target || { name: "Participant" });
      setCountdown(15);
    } catch (err) {
      setStatus({ kind: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  // ---- participant list ----

  if (!participantId) {
    const allDone = done === totalCount && totalCount > 0;

    return (
      <>
        <div className="group">
          <div className="list">
            <div className="row">
              <span className="row-main">
                <span className="row-label strong">
                  {done} of {totalCount} scored
                </span>
                <span className="row-sublabel">
                  {allDone
                    ? "You have scored everyone. Thank you — you can put your phone away."
                    : "Your scores stay private to you until the organizer closes the event."}
                </span>
              </span>
              {allDone && (
                <span className="row-icon green">
                  <Icon name="check" size={16} />
                </span>
              )}
            </div>
            <div className="row">
              <div className="progress" style={{ width: "100%" }}>
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="group">
          <div className="group-header">Participants</div>
          <div className="list">
            {participants.map((p) => {
              const isScored = scoredIds.has(p.id);
              return (
                <button key={p.id} className="row" onClick={() => onParticipantChange(p.id)}>
                  <span className="row-main">
                    <span className="row-label strong">{p.name}</span>
                    {p.team && <span className="row-sublabel">{p.team}</span>}
                  </span>
                  <span className="row-trail">
                    <span className={`badge ${isScored ? "green" : ""}`}>
                      {isScored ? (
                        <>
                          <Icon name="check" size={12} /> Scored
                        </>
                      ) : (
                        "Not scored"
                      )}
                    </span>
                    <Icon name="chevronRight" size={18} className="chevron" />
                  </span>
                </button>
              );
            })}
          </div>
          <div className="group-footer">
            Tap a participant to score them. You can come back and change a score at any time
            before the organizer closes the event.
          </div>
        </div>

        <ScoreSentModal
          participant={submittedParticipant}
          countdown={countdown}
          onReturn={handleReturn}
        />
      </>
    );
  }

  // ---- scoring a participant ----

  return (
    <>
      {status && (
        <div className={`banner ${status.kind}`} role={status.kind === "error" ? "alert" : "status"}>
          <Icon name={status.kind === "error" ? "error" : "info"} size={18} />
          <span>{status.text}</span>
        </div>
      )}

      {existing && (
        <div className="banner info">
          <Icon name="info" size={18} />
          <span>
            You already sent a score for this participant. Saving again replaces it.
          </span>
        </div>
      )}

      <div className="group">
        <div className="group-header">Criteria</div>
        <div className="list spaced">
          {criteria.map((c) => (
            <CriterionRow
              key={c.id}
              criterion={c}
              value={draftScores[c.id]}
              open={openCriterion === c.id}
              onToggle={() => setOpenCriterion(openCriterion === c.id ? null : c.id)}
              onChange={(v) => setScore(c.id, v)}
            />
          ))}
        </div>
        <div className="group-footer">
          Tap a criterion to open it. Every criterion needs a score before you can send this
          sheet.
        </div>
      </div>

      <div className="group">
        <div className="list raised">
          <div className="row">
            <span className="row-main">
              <span className="row-label strong">Weighted total</span>
              <span className="row-sublabel">
                {complete ? "Out of 100" : `${missing.length} still to score`}
              </span>
            </span>
            <span className={`score-value ${complete ? "" : "unset"}`}>
              {total !== null ? total.toFixed(1) : "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="toolbar">
        <button className="btn filled block" onClick={submit} disabled={!complete || busy}>
          {busy ? "Sending…" : existing ? "Replace my score" : "Send my score"}
        </button>
        <p className="toolbar-note">
          {complete
            ? `${done} of ${totalCount} participants scored`
            : `${missing.length} of ${criteria.length} criteria still need a score`}
        </p>
      </div>

      <ScoreSentModal
        participant={submittedParticipant}
        countdown={countdown}
        onReturn={handleReturn}
      />
    </>
  );
}
