import { useEffect, useState } from "react";

const PASSWORD = "admin123";

function LockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" />
    </svg>
  );
}

export default function PasswordGate({ storageKey, title, hint, children }) {
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let stored = false;
    try {
      stored = sessionStorage.getItem(storageKey) === "1";
    } catch (e) {
      stored = false;
    }
    setUnlocked(stored);
    setReady(true);
  }, [storageKey]);

  function submit(e) {
    e.preventDefault();
    if (input === PASSWORD) {
      try {
        sessionStorage.setItem(storageKey, "1");
      } catch (e) {
        // ignore storage errors (e.g. private browsing)
      }
      setUnlocked(true);
      setError("");
      setInput("");
    } else {
      setError("Incorrect password. Try again.");
    }
  }

  function lock() {
    try {
      sessionStorage.removeItem(storageKey);
    } catch (e) {
      // ignore storage errors
    }
    setUnlocked(false);
    setInput("");
  }

  if (!ready) return null;

  if (!unlocked) {
    return (
      <div className="lock-wrap">
        <div className="lock-card">
          <div className="lock-icon">
            <LockIcon />
          </div>
          <h2>{title}</h2>
          <p className="hint">{hint}</p>
          <form onSubmit={submit}>
            <div className="field">
              <label>Password</label>
              <input
                type="password"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter password"
                autoFocus
              />
            </div>
            {error && <div className="lock-error">{error}</div>}
            <button type="submit" className="btn accent" style={{ width: "100%", justifyContent: "center" }}>
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="lock-bar">
        <button className="btn-icon" onClick={lock}>
          Lock this tab
        </button>
      </div>
      {children}
    </div>
  );
}
