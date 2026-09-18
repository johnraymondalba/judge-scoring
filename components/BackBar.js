function BackArrow() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The single back control for the whole app. It always sits in the same place
 * — directly under the masthead — so a judge on a phone learns one location
 * and never has to hunt for it as the screen changes. Each screen supplies its
 * own label so it is obvious what you are going back to.
 */
export default function BackBar({ label, onBack }) {
  if (!label) return null;

  return (
    <div className="back-bar">
      <button type="button" className="back-bar-btn" onClick={onBack}>
        <BackArrow />
        <span>{label}</span>
      </button>
    </div>
  );
}
