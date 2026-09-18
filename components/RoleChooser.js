function GavelIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 21h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="m13.5 4.5 6 6M16.5 1.5l6 6M15 3l-6 6M21 9l-6 6M11.5 6.5 5 13a2.1 2.1 0 0 0 3 3l6.5-6.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="16" height="17" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M9 4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2H9V4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 12h8M8 16h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function RoleChooser({ eventName, onChoose }) {
  return (
    <div className="chooser">
      <div className="chooser-head">
        <h2>Welcome to {eventName}</h2>
        <p className="hint">Choose how you&apos;re joining today.</p>
      </div>

      <div className="chooser-grid">
        <button className="role-card" onClick={() => onChoose("judge")}>
          <span className="role-icon">
            <GavelIcon />
          </span>
          <span className="role-title">I&apos;m a Judge</span>
          <span className="role-sub">
            Sign in with your name and the PIN the organizer gave you, then score each participant.
          </span>
          <span className="role-go">Continue as judge →</span>
        </button>

        <button className="role-card" onClick={() => onChoose("admin")}>
          <span className="role-icon alt">
            <ClipboardIcon />
          </span>
          <span className="role-title">I&apos;m an Organizer</span>
          <span className="role-sub">
            Set up criteria, participants and judge PINs, and watch the live leaderboard.
          </span>
          <span className="role-go">Continue as organizer →</span>
        </button>
      </div>
    </div>
  );
}
