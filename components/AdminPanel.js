import { useEffect, useRef, useState } from "react";
import { weightSum } from "../lib/scoring";
import ConfirmDialog from "./ConfirmDialog";

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function randomPin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

const serialize = (value) => JSON.stringify(value);

/**
 * Editable rows seeded from the server, which adopt server changes only while
 * the organizer has not edited them.
 *
 * Previously each section did `useState(state.criteria)`, which seeded once and
 * never resynced while the 6-second poll kept updating `state` underneath. A
 * second organizer's changes were then silently overwritten on save, and the
 * dirty flag read true because of the poll rather than because of any edit.
 */
function useServerSynced(serverValue) {
  const [rows, setRows] = useState(serverValue);
  const syncedRef = useRef(serverValue);

  useEffect(() => {
    if (serialize(serverValue) === serialize(syncedRef.current)) return;
    setRows((current) =>
      serialize(current) === serialize(syncedRef.current) ? serverValue : current
    );
    syncedRef.current = serverValue;
  }, [serverValue]);

  return [rows, setRows, serialize(rows) !== serialize(serverValue)];
}

/** Shared save handling so a rejected PATCH surfaces its message. */
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

const scoreCount = (scores) => Object.keys(scores || {}).length;
const scoresForParticipant = (scores, id) =>
  Object.keys(scores || {}).filter((k) => k.endsWith(`::${id}`)).length;
const scoresForJudge = (scores, id) =>
  Object.keys(scores || {}).filter((k) => k.startsWith(`${id}::`)).length;

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
  const [rows, setRows, dirty] = useServerSynced(state.criteria);
  const { save, error, busy } = useSave(onPatch);
  const [pendingRemove, setPendingRemove] = useState(null);

  const total = weightSum(rows);
  const weightsValid = total === 100;
  const submitted = scoreCount(state.scores);

  function update(id, field, value) {
    setRows((r) => r.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  }

  function addRow() {
    setRows((r) => [...r, { id: uid("c"), name: "New criterion", description: "", weight: 0 }]);
  }

  function confirmRemove() {
    setRows((r) => r.filter((c) => c.id !== pendingRemove.id));
    setPendingRemove(null);
  }

  return (
    <div className="section">
      <div className="section-head">
        <h2>Judging criteria</h2>
        <p className="hint">Name, description and weight for each criterion.</p>
        <span className={`pill ${weightsValid ? "ok" : "warn"}`}>
          weights total {total}%{weightsValid ? "" : " — must be 100% to save"}
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
            <div className="ch-actions">
              <input
                type="number"
                className="weight-input"
                value={c.weight}
                aria-label={`${c.name} weight in percent`}
                onChange={(e) => update(c.id, "weight", Number(e.target.value))}
              />
              <span className="weight">%</span>
              <button className="btn-icon danger" onClick={() => setPendingRemove(c)}>
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
        <button
          className="btn"
          onClick={() => save({ criteria: rows })}
          disabled={!dirty || busy || !weightsValid}
        >
          Save criteria
        </button>
      </div>
      {!weightsValid && dirty && (
        <div className="lock-error">
          Weights add up to {total}%, so every &ldquo;out of 100&rdquo; total in the app would be
          wrong. Adjust them to 100% to save.
        </div>
      )}
      {error && <div className="lock-error">{error}</div>}

      <ConfirmDialog
        open={Boolean(pendingRemove)}
        title={`Remove "${pendingRemove ? pendingRemove.name : ""}"?`}
        message={
          submitted > 0
            ? `${submitted} score${submitted === 1 ? " has" : "s have"} already been submitted. ` +
              `Saving without this criterion recalculates every one of them, which can change the ` +
              `ranking. This cannot be undone.`
            : "No scores have been submitted yet, so nothing else is affected."
        }
        confirmLabel="Remove criterion"
        cancelLabel="Keep it"
        tone="danger"
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemove(null)}
      />
    </div>
  );
}

function ParticipantsSection({ state, onPatch }) {
  const [rows, setRows, dirty] = useServerSynced(state.participants);
  const [draft, setDraft] = useState({ name: "", team: "" });
  const { save, error, busy } = useSave(onPatch);
  const [pendingRemove, setPendingRemove] = useState(null);

  function add() {
    if (!draft.name.trim()) return;
    setRows((r) => [...r, { id: uid("p"), name: draft.name.trim(), team: draft.team.trim() }]);
    setDraft({ name: "", team: "" });
  }

  function update(id, field, value) {
    setRows((r) => r.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }

  function confirmRemove() {
    setRows((r) => r.filter((p) => p.id !== pendingRemove.id));
    setPendingRemove(null);
  }

  const affected = pendingRemove ? scoresForParticipant(state.scores, pendingRemove.id) : 0;

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
                  <button className="btn-icon danger" onClick={() => setPendingRemove(p)}>
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

      <ConfirmDialog
        open={Boolean(pendingRemove)}
        title={`Remove "${pendingRemove ? pendingRemove.name : ""}"?`}
        message={
          affected > 0
            ? `${affected} judge${affected === 1 ? "" : "s"} already scored this participant. ` +
              `Saving without them discards those scores and removes them from the results. ` +
              `This cannot be undone.`
            : "No scores have been submitted for this participant yet."
        }
        confirmLabel="Remove participant"
        cancelLabel="Keep them"
        tone="danger"
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemove(null)}
      />
    </div>
  );
}

function JudgesSection({ state, onPatch }) {
  // Rows carry an optional `pin` (a new PIN to set) and `clearPin` flag. The
  // server hashes the PIN and never sends it back, so `hasPin` is all we can
  // display once it has been saved.
  const [rows, setRows, dirty] = useServerSynced(state.judges);
  const [draft, setDraft] = useState({ name: "", pin: randomPin() });
  const { save, error, busy } = useSave(onPatch);
  const [pendingRemove, setPendingRemove] = useState(null);

  function add() {
    if (!draft.name.trim() || !/^\d{4,6}$/.test(draft.pin)) return;
    setRows((r) => [...r, { id: uid("j"), name: draft.name.trim(), pin: draft.pin, hasPin: true }]);
    setDraft({ name: "", pin: randomPin() });
  }

  function update(id, patch) {
    setRows((r) => r.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }

  function confirmRemove() {
    setRows((r) => r.filter((j) => j.id !== pendingRemove.id));
    setPendingRemove(null);
  }

  async function onSave() {
    const ok = await save({ judges: rows });
    // Drop the plaintext PINs from the form once the server has them hashed.
    if (ok) setRows((r) => r.map(({ pin, clearPin, ...rest }) => ({ ...rest, hasPin: !clearPin })));
  }

  const addValid = draft.name.trim() && /^\d{4,6}$/.test(draft.pin);
  const affected = pendingRemove ? scoresForJudge(state.scores, pendingRemove.id) : 0;

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
                  <button className="btn-icon danger" onClick={() => setPendingRemove(j)}>
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

      <ConfirmDialog
        open={Boolean(pendingRemove)}
        title={`Remove ${pendingRemove ? pendingRemove.name : ""}?`}
        message={
          affected > 0
            ? `This judge has already scored ${affected} participant${affected === 1 ? "" : "s"}. ` +
              `Saving without them discards those scores and recalculates every average they ` +
              `contributed to. This cannot be undone.`
            : "This judge has not scored anyone yet, so no scores are affected."
        }
        confirmLabel="Remove judge"
        cancelLabel="Keep them"
        tone="danger"
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemove(null)}
      />
    </div>
  );
}
