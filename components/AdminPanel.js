import { useState } from "react";
import { weightSum } from "../lib/scoring";

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function AdminPanel({ state, onPatch }) {
  return (
    <div>
      <EventNameSection state={state} onPatch={onPatch} />
      <CriteriaSection state={state} onPatch={onPatch} />
      <ParticipantsSection state={state} onPatch={onPatch} />
      <JudgesSection state={state} onPatch={onPatch} />
    </div>
  );
}

function EventNameSection({ state, onPatch }) {
  const [name, setName] = useState(state.eventName);
  return (
    <div className="section">
      <div className="section-head">
        <h2>Event name</h2>
        <p className="hint">Shown at the top of the scoresheet.</p>
      </div>
      <div className="row" style={{ maxWidth: 480 }}>
        <div className="field" style={{ flex: 3 }}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <button
          className="btn secondary"
          onClick={() => onPatch({ eventName: name })}
          disabled={name === state.eventName}
        >
          Save name
        </button>
      </div>
    </div>
  );
}

function CriteriaSection({ state, onPatch }) {
  const [rows, setRows] = useState(state.criteria);
  const dirty = JSON.stringify(rows) !== JSON.stringify(state.criteria);
  const total = weightSum(rows);

  function update(id, field, value) {
    setRows((r) => r.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  }

  function addRow() {
    setRows((r) => [
      ...r,
      { id: uid("c"), name: "New criterion", description: "", weight: 0 },
    ]);
  }

  function removeRow(id) {
    setRows((r) => r.filter((c) => c.id !== id));
  }

  function save() {
    onPatch({ criteria: rows });
  }

  return (
    <div className="section">
      <div className="section-head">
        <h2>Judging criteria</h2>
        <p className="hint">Name, description and weight for each criterion.</p>
        <span className={`pill ${total === 100 ? "ok" : "warn"}`}>
          weights total {total}%{total !== 100 ? " — should be 100%" : ""}
        </span>
      </div>

      {rows.map((c) => (
        <div className="criteria-card" key={c.id}>
          <div className="ch">
            <input
              type="text"
              value={c.name}
              onChange={(e) => update(c.id, "name", e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                fontFamily: "var(--font-display)",
                fontSize: "1.05rem",
                fontWeight: 600,
                color: "var(--blue-900)",
                padding: 0,
                flex: 1,
              }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="number"
                value={c.weight}
                onChange={(e) => update(c.id, "weight", Number(e.target.value))}
                style={{
                  width: 60,
                  border: "1px solid var(--rule-strong)",
                  borderRadius: 3,
                  padding: "4px 6px",
                  fontWeight: 600,
                  textAlign: "right",
                }}
              />
              <span className="weight">%</span>
              <button className="btn-icon" onClick={() => removeRow(c.id)} title="Remove">
                Remove
              </button>
            </div>
          </div>
          <textarea
            value={c.description}
            onChange={(e) => update(c.id, "description", e.target.value)}
            placeholder="What should judges look for?"
            style={{
              width: "100%",
              border: "1px solid var(--rule)",
              borderRadius: 3,
              padding: 8,
              fontSize: "0.88rem",
              color: "var(--ink)",
            }}
          />
        </div>
      ))}

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button className="btn secondary" onClick={addRow}>
          + Add criterion
        </button>
        <button className="btn" onClick={save} disabled={!dirty}>
          Save criteria
        </button>
      </div>
    </div>
  );
}

function ParticipantsSection({ state, onPatch }) {
  const [rows, setRows] = useState(state.participants);
  const [draft, setDraft] = useState({ name: "", team: "" });
  const dirty = JSON.stringify(rows) !== JSON.stringify(state.participants);

  function add() {
    if (!draft.name.trim()) return;
    setRows((r) => [...r, { id: uid("p"), name: draft.name.trim(), team: draft.team.trim() }]);
    setDraft({ name: "", team: "" });
  }

  function update(id, field, value) {
    setRows((r) => r.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }

  function remove(id) {
    setRows((r) => r.filter((p) => p.id !== id));
  }

  return (
    <div className="section">
      <div className="section-head">
        <h2>Participants</h2>
        <p className="hint">Teams or individuals being judged.</p>
      </div>

      <div className="table-scroll">
        <table className="ledger" style={{ marginBottom: 14 }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Team / project</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} style={{ color: "var(--ink-soft)" }}>
                No participants yet.
              </td>
            </tr>
          )}
          {rows.map((p) => (
            <tr key={p.id}>
              <td>
                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => update(p.id, "name", e.target.value)}
                  style={{ border: "none", background: "transparent", width: "100%" }}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={p.team}
                  onChange={(e) => update(p.id, "team", e.target.value)}
                  style={{ border: "none", background: "transparent", width: "100%" }}
                />
              </td>
              <td>
                <button className="btn-icon" onClick={() => remove(p.id)}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>

      <div className="row" style={{ maxWidth: 560 }}>
        <div className="field">
          <label>Name</label>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="e.g. Team Kanin"
          />
        </div>
        <div className="field">
          <label>Team / project (optional)</label>
          <input
            type="text"
            value={draft.team}
            onChange={(e) => setDraft((d) => ({ ...d, team: e.target.value }))}
            placeholder="e.g. Smart rice storage"
          />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn secondary" onClick={add}>
          + Add participant
        </button>
        <button className="btn" onClick={() => onPatch({ participants: rows })} disabled={!dirty}>
          Save participants
        </button>
      </div>
    </div>
  );
}

function JudgesSection({ state, onPatch }) {
  const [rows, setRows] = useState(state.judges);
  const [draft, setDraft] = useState("");
  const dirty = JSON.stringify(rows) !== JSON.stringify(state.judges);

  function add() {
    if (!draft.trim()) return;
    setRows((r) => [...r, { id: uid("j"), name: draft.trim() }]);
    setDraft("");
  }

  function update(id, value) {
    setRows((r) => r.map((j) => (j.id === id ? { ...j, name: value } : j)));
  }

  function remove(id) {
    setRows((r) => r.filter((j) => j.id !== id));
  }

  return (
    <div className="section">
      <div className="section-head">
        <h2>Judges</h2>
        <p className="hint">Each judge picks their own name in the Judge tab before scoring.</p>
      </div>

      <div className="table-scroll">
        <table className="ledger" style={{ marginBottom: 14 }}>
        <thead>
          <tr>
            <th>Judge name</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={2} style={{ color: "var(--ink-soft)" }}>
                No judges yet.
              </td>
            </tr>
          )}
          {rows.map((j) => (
            <tr key={j.id}>
              <td>
                <input
                  type="text"
                  value={j.name}
                  onChange={(e) => update(j.id, e.target.value)}
                  style={{ border: "none", background: "transparent", width: "100%" }}
                />
              </td>
              <td>
                <button className="btn-icon" onClick={() => remove(j.id)}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>

      <div className="row" style={{ maxWidth: 400 }}>
        <div className="field" style={{ flex: 2 }}>
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. Judge Reyes"
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn secondary" onClick={add}>
          + Add judge
        </button>
        <button className="btn" onClick={() => onPatch({ judges: rows })} disabled={!dirty}>
          Save judges
        </button>
      </div>
    </div>
  );
}
