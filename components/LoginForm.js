import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

const PIN_MIN = 4;
const PIN_MAX = 6;

/**
 * The judge's on-screen PIN pad: a glass sheet with its own numeric keypad.
 * No system keyboard ever appears — every digit is a tap (or a physical
 * number key) handled here directly, so it works the same standing in a
 * dark auditorium as it does for a keyboard-only sign-in.
 */
function PinSheet({ judgeName, busy, error, onSubmit, onCancel }) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const sheetRef = useRef(null);
  const cancelRef = useRef(null);
  const openerRef = useRef(null);
  const busyRef = useRef(busy);
  const submittingRef = useRef(false);

  busyRef.current = busy;

  // Focus trap + restore, mirroring ConfirmDialog: set up once for the life
  // of the sheet, not on every keystroke.
  useEffect(() => {
    openerRef.current = document.activeElement;
    if (cancelRef.current) cancelRef.current.focus();

    function onKeyDown(e) {
      if (e.key === "Escape") {
        onCancel();
        return;
      }
      if (busyRef.current) return;
      if (/^[0-9]$/.test(e.key)) {
        setPin((p) => (p.length >= PIN_MAX ? p : p + e.key));
        return;
      }
      if (e.key === "Backspace") {
        setPin((p) => p.slice(0, -1));
        return;
      }
      if (e.key !== "Tab" || !sheetRef.current) return;
      const focusable = sheetRef.current.querySelectorAll("button:not(:disabled)");
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (openerRef.current && openerRef.current.focus) openerRef.current.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function attemptSubmit(value) {
    if (submittingRef.current || busyRef.current) return;
    if (value.length < PIN_MIN || value.length > PIN_MAX) return;
    submittingRef.current = true;
    Promise.resolve(onSubmit(value)).finally(() => {
      submittingRef.current = false;
    });
  }

  // A full six digits is always a finished PIN; anything shorter still needs
  // an explicit Done, since 4 and 5 are equally valid lengths.
  useEffect(() => {
    if (pin.length === PIN_MAX) attemptSubmit(pin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  // A rejected PIN shakes once and clears, rather than leaving wrong digits
  // sitting on screen for a re-read that only wastes the judge's time.
  useEffect(() => {
    if (!error) return undefined;
    setPin("");
    setShake(true);
    const t = setTimeout(() => setShake(false), 420);
    return () => clearTimeout(t);
  }, [error]);

  const canConfirm = pin.length >= PIN_MIN && pin.length <= PIN_MAX && !busy;

  function press(digit) {
    if (busy) return;
    setPin((p) => (p.length >= PIN_MAX ? p : p + digit));
  }

  return (
    <div className="sheet-scrim" onClick={onCancel}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pin-sheet-title"
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-header">
          <button type="button" ref={cancelRef} className="sheet-action" onClick={onCancel}>
            Cancel
          </button>
          <span className="sheet-title" id="pin-sheet-title">
            Enter PIN
          </span>
          <button
            type="button"
            className="sheet-action strong"
            disabled={!canConfirm}
            onClick={() => attemptSubmit(pin)}
          >
            Done
          </button>
        </div>
        <p className="sheet-subtitle">{judgeName}</p>

        <div className={`pin-dots ${shake ? "shake" : ""}`} aria-hidden="true">
          {Array.from({ length: PIN_MAX }).map((_, i) => (
            <span key={i} className={`pin-dot ${i < pin.length ? "filled" : ""}`} />
          ))}
        </div>
        <p className="visually-hidden" role="status">
          {busy ? "Checking your PIN…" : `${pin.length} of up to ${PIN_MAX} digits entered`}
        </p>

        {error && (
          <p className="sheet-error" role="alert">
            {error}
          </p>
        )}

        <div className="keypad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              type="button"
              className="keypad-key"
              disabled={busy}
              onClick={() => press(String(n))}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            className="keypad-key keypad-key--text"
            disabled={busy || pin.length === 0}
            onClick={() => setPin("")}
          >
            Clear
          </button>
          <button type="button" className="keypad-key" disabled={busy} onClick={() => press("0")}>
            0
          </button>
          <button
            type="button"
            className="keypad-key"
            aria-label="Delete last digit"
            disabled={busy || pin.length === 0}
            onClick={() => setPin((p) => p.slice(0, -1))}
          >
            <Icon name="backspace" size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginForm({ role, judges, onSignedIn }) {
  const [judgeId, setJudgeId] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pinError, setPinError] = useState("");
  const [busy, setBusy] = useState(false);

  const isJudge = role === "judge";
  const eligible = judges.filter((j) => j.hasPin);
  const chosenJudge = eligible.find((j) => j.id === judgeId);

  async function submitPin(pin) {
    setBusy(true);
    setPinError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, judgeId, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPinError(data.error || "That PIN was not recognized.");
        return;
      }
      onSignedIn(data);
    } catch (err) {
      setPinError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submitPassword(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Sign-in failed.");
        setPassword("");
        return;
      }
      onSignedIn(data);
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (isJudge && eligible.length === 0) {
    return (
      <div className="empty">
        <span className="empty-title">No judges set up yet</span>
        The organizer needs to add you as a judge and give you a PIN before you can sign in.
        This page updates on its own once they do.
      </div>
    );
  }

  if (isJudge) {
    return (
      <>
        <div className="group">
          <div className="group-header">Your name</div>
          <div className="list">
            <div className="field-row">
              <label htmlFor="judge-name">Judging as</label>
              <select
                id="judge-name"
                value={judgeId}
                onChange={(e) => setJudgeId(e.target.value)}
                required
              >
                <option value="">Select your name</option>
                {eligible.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="group-footer">
            You will enter your PIN on the next screen, using an on-screen keypad — no need to
            type it.
          </div>
        </div>

        {/* Hidden rather than just covered while the sheet is open: a solid
            filled button sitting behind glass bleeds through the blur as a
            stray color smear, and it would be a redundant, obscured target
            in the tab order besides. */}
        {!pinOpen && (
          <div className="toolbar">
            <button
              type="button"
              className="btn filled block"
              disabled={!judgeId}
              onClick={() => {
                setPinError("");
                setPinOpen(true);
              }}
            >
              Continue
            </button>
          </div>
        )}

        {pinOpen && chosenJudge && (
          <PinSheet
            judgeName={chosenJudge.name}
            busy={busy}
            error={pinError}
            onSubmit={submitPin}
            onCancel={() => {
              if (busy) return;
              setPinOpen(false);
              setPinError("");
            }}
          />
        )}
      </>
    );
  }

  return (
    <form onSubmit={submitPassword}>
      {error && (
        <div className="banner error" role="alert">
          <Icon name="error" size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="group">
        <div className="group-header">Organizer password</div>
        <div className="list">
          <div className="field-stack">
            <label htmlFor="admin-password" className="visually-hidden">
              Organizer password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoFocus
              required
            />
          </div>
        </div>
        <div className="group-footer">
          This unlocks event setup and the live results. Judges never see this screen.
        </div>
      </div>

      <div className="toolbar">
        <button type="submit" className="btn filled block" disabled={busy || !password}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </div>
    </form>
  );
}
