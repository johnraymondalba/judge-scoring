import { useState } from "react";
import { weightSum } from "../lib/scoring";

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function randomPin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/** Shared save handling so a rejected PATCH surfaces its message instead of
 *  failing silently. */
function useSave(onPatch) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(patch) {
    setBusy(true);
    setError("");
    try {
      await onPatch(patch);
      return true;
    } catch (err) {
      setError(err.message || "Could not save changes.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { save, error, busy };
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
  const { save, error, busy } = useSave(onPatch);

  return (
    <div className="section">
      <div className="section-head">
        <h2>Event name</h2>
        <p className="hint">Shown at the top of the scoresheet.</p>
      </div>
      <div className="row" style={{ maxWidth: 480 }}>
        <div className="field" style={{ flex: 3 }}>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <button
          className="btn secondary"
          onClick={() => save({ eventName: name })}
          disabled={name === state.eventName || busy}
        >
          Save name
        </button>
      </div>
      {error && <div className="lock-error">{error}</div>}
    </div>
  );
}

function CriteriaSection({ state, onPatch }) {
  const [rows, setRows] = useState(state.criteria);
  const { save, error, busy } = useSave(onPatch);
  const dirty = JSON.stringify(rows) !== JSON.stringify(state.criteria);
  const total = weightSum(rows);

  function update(id, field, value) {
    setRows((r) => r.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  }

  function addRow() {
    setRows((r) => [...r, { id: uid("c"), name: "New criterion", description: "", weight: 0 }]);
  }

  function removeRow(id) {
    setRows((r) => r.filter((c) => c.id !== id));
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
              className="inline-title-input"
              value={c.name}
              aria-label="Criterion name"
              onChange={(e) => update(c.id, "name", e.target.value)}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="number"
                className="weight-input"
                value={c.weight}
                aria-label={`${c.name} weight in percent`}
                onChange={(e) => update(c.id, "weight", Number(e.target.value))}
              />
              <span className="weight">%</span>
              <button className="btn-icon danger" onClick={() => removeRow(c.id)} title="Remove">
                Remove
              </button>
            </div>
          </div>
          <textarea
            className="criterion-desc"
            value={c.description}
            aria-label={`${c.name} description`}
            onChange={(e) => update(c.id, "description", e.target.value)}
            placeholder="What should judges look for?"
          />
        </div>
      ))}

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button className="btn secondary" onClick={addRow}>
          + Add criterion
        </button>
        <button className="btn" onClick={() => save({ criteria: rows })} disabled={!dirty || busy}>
          Save criteria
        </button>
      </div>
      {error && <div className="lock-error">{error}</div>}
    </div>
  );
}

function ParticipantsSection({ state, onPatch }) {
  const [rows, setRows] = useState(state.participants);
  const [draft, setDraft] = useState({ name: "", team: "" });
  const { save, error, busy } = useSave(onPatch);
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
              <th />
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
                    className="cell-input"
                    value={p.name}
                    aria-label="Participant name"
                    onChange={(e) => update(p.id, "name", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="cell-input"
                    value={p.team}
                    aria-label="Team or project"
                    onChange={(e) => update(p.id, "team", e.target.value)}
                  />
                </td>
                <td>
                  <button className="btn-icon danger" onClick={() => remove(p.id)}>
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
        <button
          className="btn"
          onClick={() => save({ participants: rows })}
          disabled={!dirty || busy}
        >
          Save participants
        </button>
      </div>
      {error && <div className="lock-error">{error}</div>}
    </div>
  );
}

function JudgesSection({ state, onPatch }) {
  // Rows carry an optional `pin` (a new PIN to set) and `clearPin` flag. The
  // server hashes the PIN and never sends it back, so `hasPin` is all we can
  // display once it has been saved.
  const [rows, setRows] = useState(state.judges);
  const [draft, setDraft] = useState({ name: "", pin: randomPin() });
  const { save, error, busy } = useSave(onPatch);
  const dirty = JSON.stringify(rows) !== JSON.stringify(state.judges);

  function add() {
    if (!draft.name.trim() || !/^\d{4,6}$/.test(draft.pin)) return;
    setRows((r) => [...r, { id: uid("j"), name: draft.name.trim(), pin: draft.pin, hasPin: true }]);
    setDraft({ name: "", pin: randomPin() });
  }

  function update(id, patch) {
    setRows((r) => r.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }

  function remove(id) {
    setRows((r) => r.filter((j) => j.id !== id));
  }

  async function onSave() {
    const ok = await save({ judges: rows });
    // Drop the plaintext PINs from the form once the server has them hashed.
    if (ok) setRows((r) => r.map(({ pin, clearPin, ...rest }) => ({ ...rest, hasPin: !clearPin })));
  }

  const addValid = draft.name.trim() && /^\d{4,6}$/.test(draft.pin);

  return (
    <div className="section">
      <div className="section-head">
        <h2>Judges &amp; sign-in PINs</h2>
        <p className="hint">
          Each judge signs in with their name and a 4–6 digit PIN. Give each judge their PIN
          privately — once saved it is stored encrypted and cannot be read back, only replaced.
        </p>
      </div>

      <div className="table-scroll">
        <table className="ledger" style={{ marginBottom: 14 }}>
          <thead>
            <tr>
              <th>Judge name</th>
              <th>Sign-in PIN</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} style={{ color: "var(--ink-soft)" }}>
                  No judges yet.
                </td>
              </tr>
            )}
            {rows.map((j) => (
              <tr key={j.id}>
                <td>
                  <input
                    type="text"
                    className="cell-input"
                    value={j.name}
                    aria-label="Judge name"
                    onChange={(e) => update(j.id, { name: e.target.value })}
                  />
                </td>
                <td>
                  <div className="pin-cell">
                    {j.pin ? (
                      <>
                        <input
                          type="text"
                          className="pin-input small"
                          value={j.pin}
                          inputMode="numeric"
                          maxLength={6}
                          aria-label={`New PIN for ${j.name}`}
                          onChange={(e) =>
                            update(j.id, { pin: e.target.value.replace(/\D/g, "") })
                          }
                        />
                        <button
                          className="btn-icon"
                          onClick={() => update(j.id, { pin: undefined })}
                          title="Cancel PIN change"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <span className={`pill ${j.hasPin && !j.clearPin ? "ok" : "warn"}`}>
                          {j.clearPin ? "will be revoked" : j.hasPin ? "PIN set" : "no PIN yet"}
                        </span>
                        <button
                          className="btn-icon"
                          onClick={() => update(j.id, { pin: randomPin(), clearPin: false })}
                        >
                          {j.hasPin ? "Reset PIN" : "Set PIN"}
                        </button>
                        {j.hasPin && !j.clearPin && (
                          <button
                            className="btn-icon danger"
                            onClick={() => update(j.id, { clearPin: true })}
                            title="Revoke this judge's access"
                          >
                            Revoke
                          </button>
                        )}
                        {j.clearPin && (
                          <button
                            className="btn-icon"
                            onClick={() => update(j.id, { clearPin: false })}
                          >
                            Undo
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
                <td>
                  <button className="btn-icon danger" onClick={() => remove(j.id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="row" style={{ maxWidth: 520 }}>
        <div className="field" style={{ flex: 2 }}>
          <label>Judge name</label>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="e.g. Judge Reyes"
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
        </div>
        <div className="field">
          <label>PIN</label>
          <input
            type="text"
            className="pin-input small"
            inputMode="numeric"
            maxLength={6}
            value={draft.pin}
            onChange={(e) => setDraft((d) => ({ ...d, pin: e.target.value.replace(/\D/g, "") }))}
            placeholder="4–6 digits"
          />
        </div>
        <button
          className="btn-icon"
          onClick={() => setDraft((d) => ({ ...d, pin: randomPin() }))}
          style={{ alignSelf: "flex-end", marginBottom: 2 }}
        >
          Generate
        </button>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn secondary" onClick={add} disabled={!addValid}>
          + Add judge
        </button>
        <button className="btn" onClick={onSave} disabled={!dirty || busy}>
          Save judges
        </button>
      </div>
      {dirty && rows.some((j) => j.pin) && (
        <div className="banner info" style={{ marginTop: 12 }}>
          Write down the PINs shown above before saving — they are hashed on save and cannot be
          displayed again.
        </div>
      )}
      {error && <div className="lock-error">{error}</div>}
    </div>
  );
}
