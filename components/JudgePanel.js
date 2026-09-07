import { useEffect, useMemo, useState } from "react";
import { scoreKey, weightedTotal } from "../lib/scoring";

export default function JudgePanel({ state, onSubmitScore }) {
  const { judges, participants, criteria, scores } = state;

  const [judgeId, setJudgeId] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [draftScores, setDraftScores] = useState({});
  const [saved, setSaved] = useState(false);

  const currentKey = judgeId && participantId ? scoreKey(judgeId, participantId) : null;
  const existing = currentKey ? scores[currentKey] : null;

  useEffect(() => {
    if (existing) {
      const clean = {};
      criteria.forEach((c) => {
        clean[c.id] = existing[c.id] ?? 50;
      });
      setDraftScores(clean);
    } else {
      const clean = {};
      criteria.forEach((c) => {
        clean[c.id] = 50;
      });
      setDraftScores(clean);
    }
    setSaved(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [judgeId, participantId]);

  const total = useMemo(() => weightedTotal(draftScores, criteria), [draftScores, criteria]);

  const scoredParticipantIds = useMemo(() => {
    if (!judgeId) return new Set();
    const set = new Set();
    participants.forEach((p) => {
      if (scores[scoreKey(judgeId, p.id)]) set.add(p.id);
    });
    return set;
  }, [judgeId, participants, scores]);

  if (judges.length === 0) {
    return (
      <div className="empty">
        No judges have been added yet. Ask the admin to add judges in the Admin tab first.
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className="empty">
        No participants have been added yet. Ask the admin to add participants in the Admin tab first.
      </div>
    );
  }

  async function submit() {
    await onSubmitScore(judgeId, participantId, draftScores);
    setSaved(true);
  }

  return (
    <div className="section">
      <div className="section-head">
        <h2>Score a participant</h2>
        <p className="hint">Pick your name and a participant, then set a score for each criterion.</p>
      </div>

      <div className="row" style={{ marginBottom: 18 }}>
        <div className="field">
          <label>You are judging as</label>
          <select value={judgeId} onChange={(e) => setJudgeId(e.target.value)}>
            <option value="">Select judge…</option>
            {judges.map((j) => (
              <option key={j.id} value={j.id}>
                {j.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Participant</label>
          <select value={participantId} onChange={(e) => setParticipantId(e.target.value)}>
            <option value="">Select participant…</option>
            {participants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.team ? ` — ${p.team}` : ""}
                {scoredParticipantIds.has(p.id) ? " ✓" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {judgeId && (
        <div className="helper-list">
          {participants.map((p) => (
            <span key={p.id} className={`chip ${scoredParticipantIds.has(p.id) ? "done" : ""}`}>
              {p.name} {scoredParticipantIds.has(p.id) ? "✓ scored" : "· pending"}
            </span>
          ))}
        </div>
      )}

      {judgeId && participantId && (
        <div style={{ marginTop: 20 }}>
          {criteria.map((c) => (
            <div className="criteria-card" key={c.id}>
              <div className="ch">
                <h3>{c.name}</h3>
                <span className="weight">{c.weight}%</span>
              </div>
              {c.description && <p>{c.description}</p>}
              <div className="score-slider-row">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={draftScores[c.id] ?? 50}
                  onChange={(e) =>
                    setDraftScores((s) => ({ ...s, [c.id]: Number(e.target.value) }))
                  }
                />
                <span className="score-num">{draftScores[c.id] ?? 50}</span>
              </div>
            </div>
          ))}

          <div className="total-preview">
            <span>Weighted total for this participant</span>
            <span className="num">{total !== null ? total.toFixed(2) : "—"} / 100</span>
          </div>

          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <button className="btn accent" onClick={submit}>
              {existing ? "Update score" : "Submit score"}
            </button>
            {saved && <span className="pill ok">saved</span>}
          </div>
        </div>
      )}
    </div>
  );
}
