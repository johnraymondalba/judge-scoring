import { useEffect, useMemo, useRef, useState } from "react";
import { scoreKey, weightedTotal } from "../lib/scoring";

/** Scores start empty rather than at a midpoint: an untouched criterion must
 *  never be indistinguishable from a deliberate score. */
function blankDraft(criteria) {
  const draft = {};
  criteria.forEach((c) => {
    draft[c.id] = null;
  });
  return draft;
}

function CriterionRow({ criterion, value, onChange }) {
  const has = value !== null && value !== undefined && value !== "";
  const labelId = `crit-${criterion.id}`;

  return (
    <div className={`criteria-card ${has ? "" : "unscored"}`}>
      <div className="ch">
        <h3 id={labelId}>{criterion.name}</h3>
        <span className="weight">{criterion.weight}%</span>
      </div>
      {criterion.description && <p>{criterion.description}</p>}

      <div className="score-slider-row">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={has ? value : 50}
          aria-labelledby={labelId}
          aria-valuetext={has ? `${value} out of 100` : "not scored yet"}
          className={has ? "" : "untouched"}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <input
          type="number"
          className="score-num-input"
          min={0}
          max={100}
          value={has ? value : ""}
          placeholder="—"
          aria-label={`${criterion.name} score out of 100`}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") return onChange(null);
            const n = Number(raw);
            if (Number.isNaN(n)) return undefined;
            return onChange(Math.min(100, Math.max(0, n)));
          }}
        />
      </div>
      {!has && <div className="needs-score">Not scored yet</div>}
    </div>
  );
}

export default function JudgePanel({ state, judge, onSubmitScore }) {
  const { participants, criteria, scores } = state;

  const [participantId, setParticipantId] = useState("");
  const [draftScores, setDraftScores] = useState(() => blankDraft(criteria));
  const [status, setStatus] = useState(null); // { kind: "ok" | "error", text }
  const [busy, setBusy] = useState(false);
  const formRef = useRef(null);

  const currentKey = participantId ? scoreKey(judge.judgeId, participantId) : null;
  const existing = currentKey ? scores[currentKey] : null;

  const scoredIds = useMemo(() => {
    const set = new Set();
    participants.forEach((p) => {
      if (scores[scoreKey(judge.judgeId, p.id)]) set.add(p.id);
    });
    return set;
  }, [participants, scores, judge.judgeId]);

  // Load the saved score when switching participants, otherwise start blank.
  useEffect(() => {
    if (!participantId) {
      setDraftScores(blankDraft(criteria));
      return;
    }
    const saved = scores[scoreKey(judge.judgeId, participantId)];
    if (saved) {
      const filled = {};
      criteria.forEach((c) => {
        filled[c.id] = saved[c.id] ?? null;
      });
      setDraftScores(filled);
    } else {
      setDraftScores(blankDraft(criteria));
    }
    setStatus(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantId]);

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
        The organizer has not finished setting up{" "}
        {participants.length === 0 ? "the participants" : "the judging criteria"} yet. This page
        updates automatically once they do.
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

  async function submit() {
    if (!complete || busy) return;
    setBusy(true);
    setStatus(null);
    try {
      await onSubmitScore(participantId, draftScores);
      const next = nextUnscoredAfter(participantId);
      if (next) {
        setParticipantId(next);
        setStatus({ kind: "ok", text: "Score saved. Moved on to the next participant." });
        if (formRef.current) {
          formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      } else {
        setStatus({ kind: "ok", text: "Score saved. That was everyone — you are all done." });
      }
    } catch (err) {
      setStatus({ kind: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="section" ref={formRef}>
      <div className="section-head">
        <h2>Score a participant</h2>
        <p className="hint">
          Signed in as <strong>{judge.judgeName}</strong>. Give every criterion a score from 0 to
          100 — drag the slider or type the number.
        </p>
      </div>

      <div className="progress-block">
        <div className="progress-label">
          <span>
            {done} of {totalCount} participants scored
          </span>
          <span className="progress-pct">{pct}%</span>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-valuenow={done}
          aria-valuemin={0}
          aria-valuemax={totalCount}
          aria-label="Scoring progress"
        >
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="field" style={{ marginBottom: 14 }}>
        <label htmlFor="participant-pick">Participant</label>
        <select
          id="participant-pick"
          value={participantId}
          onChange={(e) => setParticipantId(e.target.value)}
        >
          <option value="">Select participant…</option>
          {participants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.team ? ` — ${p.team}` : ""}
              {scoredIds.has(p.id) ? " ✓ scored" : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="helper-list">
        {participants.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`chip ${scoredIds.has(p.id) ? "done" : ""} ${
              p.id === participantId ? "current" : ""
            }`}
            onClick={() => setParticipantId(p.id)}
          >
            {p.name} {scoredIds.has(p.id) ? "✓" : "· pending"}
          </button>
        ))}
      </div>

      {!participantId && (
        <div className="empty" style={{ marginTop: 18 }}>
          Pick a participant above to start scoring.
        </div>
      )}

      {participantId && (
        <div style={{ marginTop: 20 }}>
          {existing && (
            <div className="banner info">
              You already scored this participant. Changing anything below and saving will replace
              your earlier score.
            </div>
          )}

          {criteria.map((c) => (
            <CriterionRow
              key={c.id}
              criterion={c}
              value={draftScores[c.id]}
              onChange={(v) => setDraftScores((s) => ({ ...s, [c.id]: v }))}
            />
          ))}

          <div className="total-preview">
            <span>
              {complete ? "Weighted total for this participant" : "Weighted total (incomplete)"}
            </span>
            <span className="num">{total !== null ? total.toFixed(2) : "—"} / 100</span>
          </div>

          <div className="submit-row">
            <button className="btn accent" onClick={submit} disabled={!complete || busy}>
              {busy ? "Saving…" : existing ? "Update score" : "Submit score"}
            </button>
            {!complete && (
              <span className="pill warn">
                {missing.length} of {criteria.length} criteria still unscored
              </span>
            )}
            {status && (
              <span className={`pill ${status.kind === "ok" ? "ok" : "danger"}`} role="status">
                {status.text}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
