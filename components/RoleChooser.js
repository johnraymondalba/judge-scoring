import Icon from "./Icon";

export default function RoleChooser({ onChoose }) {
  return (
    <div className="group">
      <div className="group-header">Choose how you are joining</div>
      <div className="list">
        <button className="row" onClick={() => onChoose("judge")}>
          <span className="row-icon tint">
            <Icon name="gavel" size={17} />
          </span>
          <span className="row-main">
            <span className="row-label strong">I am a Judge</span>
            <span className="row-sublabel">
              Sign in with your name and the PIN the organizer gave you, then score each
              participant.
            </span>
          </span>
          <Icon name="chevronRight" size={18} className="chevron" />
        </button>

        <button className="row" onClick={() => onChoose("admin")}>
          <span className="row-icon green">
            <Icon name="clipboard" size={17} />
          </span>
          <span className="row-main">
            <span className="row-label strong">I am an Organizer</span>
            <span className="row-sublabel">
              Set up criteria, participants and judge PINs, and follow the live results.
            </span>
          </span>
          <Icon name="chevronRight" size={18} className="chevron" />
        </button>
      </div>
      <div className="group-footer">
        Everyone uses this same link. Scores are private to each judge until the event is
        scored.
      </div>
    </div>
  );
}
