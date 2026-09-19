import { useState } from "react";
import Icon from "./Icon";

export default function LoginForm({ role, judges, onSignedIn }) {
  const [judgeId, setJudgeId] = useState("");
  const [pin, setPin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isJudge = role === "judge";
  const eligible = judges.filter((j) => j.hasPin);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isJudge ? { role, judgeId, pin } : { role, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Sign-in failed.");
        // Only the wrong field is cleared. Re-typing a name you already picked
        // is a punishment, and this happens while standing in a dark room.
        setPin("");
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

  const canSubmit = isJudge ? Boolean(judgeId) && pin.length >= 4 : Boolean(password);

  return (
    <form onSubmit={submit}>
      {error && (
        <div className="banner error" role="alert">
          <Icon name="error" size={18} />
          <span>{error}</span>
        </div>
      )}

      {isJudge ? (
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
          </div>

          <div className="group">
            <div className="group-header">PIN</div>
            <div className="list">
              <div className="field-stack">
                <label htmlFor="judge-pin" className="visually-hidden">
                  Your 4 to 6 digit PIN
                </label>
                <input
                  id="judge-pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  className="pin-field"
                  required
                />
              </div>
            </div>
            <div className="group-footer">
              The organizer issued this to you privately. If it does not work, ask them to
              reset it — they can issue a new one in seconds.
            </div>
          </div>
        </>
      ) : (
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
      )}

      <div className="toolbar">
        <button type="submit" className="btn filled block" disabled={busy || !canSubmit}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </div>
    </form>
  );
}
