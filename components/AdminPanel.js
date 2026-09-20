import { useEffect, useRef, useState } from "react";
import { weightSum } from "../lib/scoring";
import ConfirmDialog from "./ConfirmDialog";
import Icon from "./Icon";

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function randomPin() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const serialize = (value) => JSON.stringify(value);

/**
 * Editable rows seeded from the server, which adopt server changes only while
 * the organizer has not edited them. Seeding once and never resyncing let a
 * save overwrite a concurrent organizer's work.
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

function SaveBar({ dirty, busy, disabled, onSave, error, label }) {
  if (!dirty && !error) return null;
  return (
    <>
      {error && (
        <div className="banner error" role="alert" style={{ marginTop: 12 }}>
          <Icon name="error" size={18} />
          <span>{error}</span>
        </div>
      )}
      {dirty && (
        <div style={{ marginTop: 12 }}>
          <button className="btn filled" onClick={onSave} disabled={busy || disabled}>
            {busy ? "Saving…" : label}
          </button>
        </div>
      )}
    </>
  );
}

function ExpandRow({ id, open, onToggle, title, subtitle, trail, children, clamp }) {
  const panelId = `panel-${id}`;
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
          <span className="row-label strong">{title}</span>
          {subtitle && (
            <span className={`row-sublabel ${clamp ? "clamp" : ""}`}>{subtitle}</span>
          )}
        </span>
        <span className="row-trail">
          {trail}
          <Icon name={open ? "chevronDown" : "chevronRight"} size={18} className="chevron" />
        </span>
      </button>
      <div className="row-body" id={panelId} role="region">
        <div>
          <div className="row-body-inner">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPanel({ state, onPatch }) {
  return (
    <>
      <EventNameSection state={state} onPatch={onPatch} />
      <CriteriaSection state={state} onPatch={onPatch} />
      <ParticipantsSection state={state} onPatch={onPatch} />
      <JudgesSection state={state} onPatch={onPatch} />
    </>
  );
}

function EventNameSection({ state, onPatch }) {
  const [name, setName] = useState(state.eventName);
  const { save, error, busy } = useSave(onPatch);
  const dirty = name !== state.eventName;

  return (
    <div className="group">
      <div className="group-header">Event</div>
      <div className="list">
        <div className="field-row">
          <label htmlFor="event-name">Name</label>
          <input
            id="event-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </div>
      <SaveBar
        dirty={dirty}
        busy={busy}
        error={error}
        onSave={() => save({ eventName: name })}
        label="Save event name"
      />
    </div>
  );
}

function CriteriaSection({ state, onPatch }) {
  const [rows, setRows, dirty] = useServerSynced(state.criteria);
  const { save, error, busy } = useSave(onPatch);
  const [pendingRemove, setPendingRemove] = useState(null);
  const [open, setOpen] = useState(null);

  const total = weightSum(rows);
  const weightsValid = total === 100;
  const submitted = scoreCount(state.scores);

  function update(id, field, value) {
    setRows((r) => r.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  }

  function addRow() {
    const row = { id: uid("c"), name: "New criterion", description: "", weight: 0 };
    setRows((r) => [...r, row]);
    setOpen(row.id);
  }

  return (
    <div className="group">
      <div className="group-header">Judging criteria</div>
      <div className="list">
        {rows.map((c) => (
          <ExpandRow
            key={c.id}
            id={c.id}
            open={open === c.id}
            onToggle={() => setOpen(open === c.id ? null : c.id)}
            title={c.name || "Untitled criterion"}
            subtitle={c.description || "No description yet"}
            clamp
            trail={<span className="badge">{c.weight}%</span>}
          >
            <div className="field-stack" style={{ padding: 0 }}>
              <label htmlFor={`cn-${c.id}`}>Name</label>
              <input
                id={`cn-${c.id}`}
                type="text"
                value={c.name}
                onChange={(e) => update(c.id, "name", e.target.value)}
              />
            </div>
            <div className="field-stack" style={{ padding: "12px 0 0" }}>
              <label htmlFor={`cw-${c.id}`}>Weight (percent of the total)</label>
              <input
                id={`cw-${c.id}`}
                type="number"
                min={0}
                max={100}
                value={c.weight}
                onChange={(e) => update(c.id, "weight", Number(e.target.value))}
              />
            </div>
            <div className="field-stack" style={{ padding: "12px 0 0" }}>
              <label htmlFor={`cd-${c.id}`}>What should judges look for?</label>
              <textarea
                id={`cd-${c.id}`}
                value={c.description}
                onChange={(e) => update(c.id, "description", e.target.value)}
              />
            </div>
            <div style={{ marginTop: 14 }}>
              <button className="btn destructive-plain" onClick={() => setPendingRemove(c)}>
                <Icon name="trash" size={17} /> Remove this criterion
              </button>
            </div>
          </ExpandRow>
        ))}

        <button className="row" onClick={addRow}>
          <span className="row-icon tint">
            <Icon name="plus" size={16} />
          </span>
          <span className="row-main">
            <span className="row-label" style={{ color: "var(--tint)" }}>
              Add a criterion
            </span>
          </span>
        </button>
      </div>

      <div className="group-footer">
        Weights currently total {total}%.{" "}
        {weightsValid
          ? "Every participant is scored out of 100."
          : "They must total exactly 100% — otherwise every total in the app would be labelled out of 100 without being out of 100."}
      </div>

      <SaveBar
        dirty={dirty}
        busy={busy}
        disabled={!weightsValid}
        error={error}
        onSave={() => save({ criteria: rows })}
        label="Save criteria"
      />

      <ConfirmDialog
        open={Boolean(pendingRemove)}
        title={`Remove "${pendingRemove ? pendingRemove.name : ""}"?`}
        message={
          submitted > 0
            ? `${submitted} score${submitted === 1 ? " has" : "s have"} already been submitted. Saving without this criterion recalculates all of them and can change the ranking. This cannot be undone.`
            : "No scores have been submitted yet, so nothing else is affected."
        }
        confirmLabel="Remove"
        cancelLabel="Keep it"
        tone="danger"
        onConfirm={() => {
          setRows((r) => r.filter((c) => c.id !== pendingRemove.id));
          setPendingRemove(null);
        }}
        onCancel={() => setPendingRemove(null)}
      />
    </div>
  );
}

function ParticipantsSection({ state, onPatch }) {
  const [rows, setRows, dirty] = useServerSynced(state.participants);
  const { save, error, busy } = useSave(onPatch);
  const [pendingRemove, setPendingRemove] = useState(null);
  const [open, setOpen] = useState(null);

  function update(id, field, value) {
    setRows((r) => r.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }

  function add() {
    const row = { id: uid("p"), name: "New participant", team: "" };
    setRows((r) => [...r, row]);
    setOpen(row.id);
  }

  const affected = pendingRemove ? scoresForParticipant(state.scores, pendingRemove.id) : 0;

  return (
    <div className="group">
      <div className="group-header">Participants</div>
      <div className="list">
        {rows.length === 0 && (
          <div className="row">
            <span className="row-main">
              <span className="row-sublabel">No participants yet.</span>
            </span>
          </div>
        )}
        {rows.map((p) => (
          <ExpandRow
            key={p.id}
            id={p.id}
            open={open === p.id}
            onToggle={() => setOpen(open === p.id ? null : p.id)}
            title={p.name || "Untitled"}
            subtitle={p.team || "No team or project name"}
          >
            <div className="field-stack" style={{ padding: 0 }}>
              <label htmlFor={`pn-${p.id}`}>Name</label>
              <input
                id={`pn-${p.id}`}
                type="text"
                value={p.name}
                onChange={(e) => update(p.id, "name", e.target.value)}
              />
            </div>
            <div className="field-stack" style={{ padding: "12px 0 0" }}>
              <label htmlFor={`pt-${p.id}`}>Team or project (optional)</label>
              <input
                id={`pt-${p.id}`}
                type="text"
                value={p.team}
                onChange={(e) => update(p.id, "team", e.target.value)}
              />
            </div>
            <div style={{ marginTop: 14 }}>
              <button className="btn destructive-plain" onClick={() => setPendingRemove(p)}>
                <Icon name="trash" size={17} /> Remove this participant
              </button>
            </div>
          </ExpandRow>
        ))}

        <button className="row" onClick={add}>
          <span className="row-icon tint">
            <Icon name="plus" size={16} />
          </span>
          <span className="row-main">
            <span className="row-label" style={{ color: "var(--tint)" }}>
              Add a participant
            </span>
          </span>
        </button>
      </div>

      <SaveBar
        dirty={dirty}
        busy={busy}
        error={error}
        onSave={() => save({ participants: rows })}
        label="Save participants"
      />

      <ConfirmDialog
        open={Boolean(pendingRemove)}
        title={`Remove "${pendingRemove ? pendingRemove.name : ""}"?`}
        message={
          affected > 0
            ? `${affected} judge${affected === 1 ? " has" : "s have"} already scored this participant. Saving without them discards those scores. This cannot be undone.`
            : "No scores have been submitted for this participant yet."
        }
        confirmLabel="Remove"
        cancelLabel="Keep them"
        tone="danger"
        onConfirm={() => {
          setRows((r) => r.filter((p) => p.id !== pendingRemove.id));
          setPendingRemove(null);
        }}
        onCancel={() => setPendingRemove(null)}
      />
    </div>
  );
}

function JudgesSection({ state, onPatch }) {
  const [rows, setRows, dirty] = useServerSynced(state.judges);
  const { save, error, busy } = useSave(onPatch);
  const [pendingRemove, setPendingRemove] = useState(null);
  const [open, setOpen] = useState(null);

  function update(id, patch) {
    setRows((r) => r.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }

  function add() {
    const row = { id: uid("j"), name: "New judge", pin: randomPin(), hasPin: true };
    setRows((r) => [...r, row]);
    setOpen(row.id);
  }

  async function onSave() {
    const ok = await save({ judges: rows });
    if (ok) setRows((r) => r.map(({ pin, clearPin, ...rest }) => ({ ...rest, hasPin: !clearPin })));
  }

  const affected = pendingRemove ? scoresForJudge(state.scores, pendingRemove.id) : 0;
  const showingPins = rows.some((j) => j.pin);

  return (
    <div className="group">
      <div className="group-header">Judges and sign-in PINs</div>
      <div className="list">
        {rows.length === 0 && (
          <div className="row">
            <span className="row-main">
              <span className="row-sublabel">No judges yet.</span>
            </span>
          </div>
        )}
        {rows.map((j) => (
          <ExpandRow
            key={j.id}
            id={j.id}
            open={open === j.id}
            onToggle={() => setOpen(open === j.id ? null : j.id)}
            title={j.name || "Untitled"}
            subtitle={
              j.pin
                ? "New PIN ready to save"
                : j.clearPin
                  ? "Access will be revoked on save"
                  : j.hasPin
                    ? "Can sign in"
                    : "Cannot sign in yet"
            }
            trail={
              <span
                className={`badge ${j.pin ? "tint" : j.clearPin ? "red" : j.hasPin ? "green" : "amber"}`}
              >
                {j.pin ? j.pin : j.clearPin ? "Revoking" : j.hasPin ? "PIN set" : "No PIN"}
              </span>
            }
          >
            <div className="field-stack" style={{ padding: 0 }}>
              <label htmlFor={`jn-${j.id}`}>Name</label>
              <input
                id={`jn-${j.id}`}
                type="text"
                value={j.name}
                onChange={(e) => update(j.id, { name: e.target.value })}
              />
            </div>

            {j.pin ? (
              <div className="field-stack" style={{ padding: "12px 0 0" }}>
                <label htmlFor={`jp-${j.id}`}>PIN to give this judge</label>
                <input
                  id={`jp-${j.id}`}
                  type="text"
                  className="pin-field"
                  inputMode="numeric"
                  maxLength={6}
                  value={j.pin}
                  onChange={(e) => update(j.id, { pin: e.target.value.replace(/\D/g, "") })}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button
                    className="btn tinted"
                    onClick={() => update(j.id, { pin: randomPin() })}
                  >
                    <Icon name="refresh" size={17} /> New number
                  </button>
                  <button className="btn plain" onClick={() => update(j.id, { pin: undefined })}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                <button
                  className="btn tinted"
                  onClick={() => update(j.id, { pin: randomPin(), clearPin: false })}
                >
                  <Icon name="lock" size={17} /> {j.hasPin ? "Reset PIN" : "Set a PIN"}
                </button>
                {j.hasPin && !j.clearPin && (
                  <button
                    className="btn destructive-plain"
                    onClick={() => update(j.id, { clearPin: true })}
                  >
                    Revoke access
                  </button>
                )}
                {j.clearPin && (
                  <button className="btn plain" onClick={() => update(j.id, { clearPin: false })}>
                    Undo revoke
                  </button>
                )}
              </div>
            )}

            <div style={{ marginTop: 14 }}>
              <button className="btn destructive-plain" onClick={() => setPendingRemove(j)}>
                <Icon name="trash" size={17} /> Remove this judge
              </button>
            </div>
          </ExpandRow>
        ))}

        <button className="row" onClick={add}>
          <span className="row-icon tint">
            <Icon name="plus" size={16} />
          </span>
          <span className="row-main">
            <span className="row-label" style={{ color: "var(--tint)" }}>
              Add a judge
            </span>
          </span>
        </button>
      </div>

      <div className="group-footer">
        Each judge signs in with their name and a 4–6 digit PIN. Give it to them privately —
        once saved it is stored encrypted and can only be replaced, never read back.
      </div>

      {dirty && showingPins && (
        <div className="banner warn" style={{ marginTop: 12 }}>
          <Icon name="warning" size={18} />
          <span>
            Write down the PINs shown above before saving. They are encrypted on save and cannot
            be displayed again.
          </span>
        </div>
      )}

      <SaveBar dirty={dirty} busy={busy} error={error} onSave={onSave} label="Save judges" />

      <ConfirmDialog
        open={Boolean(pendingRemove)}
        title={`Remove ${pendingRemove ? pendingRemove.name : ""}?`}
        message={
          affected > 0
            ? `This judge has already scored ${affected} participant${affected === 1 ? "" : "s"}. Saving without them discards those scores and recalculates every average they contributed to. This cannot be undone.`
            : "This judge has not scored anyone yet, so no scores are affected."
        }
        confirmLabel="Remove"
        cancelLabel="Keep them"
        tone="danger"
        onConfirm={() => {
          setRows((r) => r.filter((j) => j.id !== pendingRemove.id));
          setPendingRemove(null);
        }}
        onCancel={() => setPendingRemove(null)}
      />
    </div>
  );
}
