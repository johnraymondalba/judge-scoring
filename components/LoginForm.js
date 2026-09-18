import { useState } from "react";

function BackArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BackLink({ onBack }) {
  return (
    <div className="lock-top">
      <button className="back-link" onClick={onBack} type="button">
        <BackArrow /> Choose a different role
      </button>
    </div>
  );
}

export default function LoginForm({ role, judges, onBack, onSignedIn }) {
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
      <div className="lock-wrap">
        <div className="lock-card">
          <BackLink onBack={onBack} />
          <h2>No judges set up yet</h2>
          <p className="hint">
            The organizer needs to add you as a judge and give you a PIN before you can sign in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="lock-wrap">
      <div className="lock-card">
        <BackLink onBack={onBack} />
        <h2>{isJudge ? "Judge sign-in" : "Organizer sign-in"}</h2>
        <p className="hint">
          {isJudge
            ? "Pick your name, then enter the PIN the organizer gave you."
            : "Enter the organizer password to manage the event and view results."}
        </p>

        <form onSubmit={submit}>
          {isJudge ? (
            <>
              <div className="field">
                <label htmlFor="judge-name">Your name</label>
                <select
                  id="judge-name"
                  value={judgeId}
                  onChange={(e) => setJudgeId(e.target.value)}
                  required
                >
                  <option value="">Select your name…</option>
                  {eligible.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="judge-pin">PIN</label>
                <input
                  id="judge-pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="\d*"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="4–6 digits"
                  className="pin-input"
                  required
                />
              </div>
            </>
          ) : (
            <div className="field">
              <label htmlFor="admin-password">Password</label>
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
          )}

          {error && (
            <div className="lock-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn accent btn-full"
            disabled={busy || (isJudge ? !judgeId || pin.length < 4 : !password)}
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
