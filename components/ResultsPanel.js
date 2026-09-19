import { useMemo } from "react";
import { buildLeaderboard, weightedTotal, scoreKey } from "../lib/scoring";
import Icon from "./Icon";

function toCsv(state, leaderboard) {
  const { judges, criteria } = state;
  const header = [
    "Rank",
    "Participant",
    "Team",
    ...judges.map((j) => `${j.name} (total/100)`),
    "Average",
    "Judges scored",
  ];
  const lines = [header];
  leaderboard.forEach((row, i) => {
    lines.push([
      i + 1,
      row.participant.name,
      row.participant.team || "",
      ...judges.map((j) => (row.perJudge[j.id] === null ? "" : row.perJudge[j.id])),
      row.average === null ? "" : row.average,
      `${row.judgesScored}/${judges.length}`,
    ]);
  });
  return lines
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? "");
          return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(",")
    )
    .join("\n");
}

function Breakdown({ participant, judges, criteria, scores }) {
  return (
    <div className="table-wrap">
      <table className="grid">
        <thead>
          <tr>
            <th className="sticky-col">Criterion</th>
            <th className="num">Weight</th>
            {judges.map((j) => (
              <th key={j.id} className="num">
                {j.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {criteria.map((c) => (
            <tr key={c.id}>
              <td className="sticky-col">{c.name}</td>
              <td className="num">{c.weight}%</td>
              {judges.map((j) => {
                const entry = scores[scoreKey(j.id, participant.id)];
                const raw = entry ? entry[c.id] : undefined;
                return (
                  <td key={j.id} className="num">
                    {raw === undefined ? "—" : raw}
                  </td>
                );
              })}
            </tr>
          ))}
          <tr>
            <td className="sticky-col">
              <strong>Weighted total</strong>
            </td>
            <td className="num">100%</td>
            {judges.map((j) => {
              const entry = scores[scoreKey(j.id, participant.id)];
              const total = entry ? weightedTotal(entry, criteria) : null;
              return (
                <td key={j.id} className="num">
                  <strong>{total === null ? "—" : total.toFixed(2)}</strong>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function ResultsPanel({ state, expanded, onExpandedChange }) {
  const { judges, participants, criteria, scores } = state;
  const leaderboard = useMemo(() => buildLeaderboard(state), [state]);

  const expectedScores = participants.length * judges.length;
  const actualScores = Object.keys(scores || {}).length;
  const complete = expectedScores > 0 && actualScores >= expectedScores;

  // An average shared by more than one participant is a tie, and a tie that is
  // silently ordered is how a wrong name gets read out on a stage.
  const tiedAverages = useMemo(() => {
    const seen = new Map();
    leaderboard.forEach((r) => {
      if (r.average === null) return;
      seen.set(r.average, (seen.get(r.average) || 0) + 1);
    });
    return new Set([...seen.entries()].filter(([, n]) => n > 1).map(([v]) => v));
  }, [leaderboard]);

  function downloadCsv() {
    const csv = toCsv(state, leaderboard);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.eventName.replace(/\s+/g, "_")}_results.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Safari can cancel a download whose object URL is revoked in the same
    // tick, and the CSV is the artifact the organizer needs after the event.
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  if (participants.length === 0 || judges.length === 0) {
    return (
      <div className="empty">
        <span className="empty-title">Nothing to show yet</span>
        Add participants and judges in Setup, and results will appear here as scores arrive.
      </div>
    );
  }

  const leader = complete && leaderboard.length > 0 ? leaderboard[0] : null;

  return (
    <>
      {!complete && (
        <div className="banner warn">
          <Icon name="warning" size={18} />
          <span>
            <strong>Provisional.</strong> {actualScores} of {expectedScores} scores are in.
            Rankings will move as the remaining judges submit — do not announce these yet.
          </span>
        </div>
      )}

      {complete && leader && leader.average !== null && (
        <div className="banner success">
          <Icon name="trophy" size={18} />
          <span>
            <strong>All {expectedScores} scores are in.</strong>{" "}
            {tiedAverages.has(leader.average)
              ? `There is a tie at the top on ${leader.average.toFixed(2)} — decide it before announcing.`
              : `${leader.participant.name} leads on ${leader.average.toFixed(2)}.`}
          </span>
        </div>
      )}

      <div className="group">
        <div className="group-header">Standings</div>
        <div className="list spaced">
          {leaderboard.map((row, i) => {
            const isOpen = expanded === row.participant.id;
            const panelId = `bd-${row.participant.id}`;
            const tied = row.average !== null && tiedAverages.has(row.average);
            return (
              <div key={row.participant.id} className={`row-expandable ${isOpen ? "open" : ""}`}>
                <button
                  type="button"
                  className="row"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => onExpandedChange(isOpen ? null : row.participant.id)}
                >
                  <span className={`rank ${complete && i === 0 && !tied ? "final" : ""}`}>
                    {row.average === null ? "—" : `${tied ? "=" : ""}${i + 1}`}
                  </span>
                  <span className="row-main">
                    <span className="row-label strong">{row.participant.name}</span>
                    <span className="row-sublabel">
                      {row.participant.team ? `${row.participant.team} · ` : ""}
                      scored by {row.judgesScored} of {judges.length} judges
                    </span>
                  </span>
                  <span className="row-trail">
                    <span className={`score-value ${row.average === null ? "unset" : ""}`}>
                      {row.average === null ? "—" : row.average.toFixed(1)}
                    </span>
                    <Icon
                      name={isOpen ? "chevronDown" : "chevronRight"}
                      size={18}
                      className="chevron"
                    />
                  </span>
                </button>

                <div className="row-body" id={panelId} role="region">
                  <div>
                    <div className="row-body-inner">
                      <Breakdown
                        participant={row.participant}
                        judges={judges}
                        criteria={criteria}
                        scores={scores}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="group-footer">
          Tap any participant to see every judge&apos;s score per criterion. Averages use only
          the judges who have scored so far.
        </div>
      </div>

      <div className="group">
        <div className="list">
          <button className="row" onClick={downloadCsv}>
            <span className="row-icon tint">
              <Icon name="download" size={16} />
            </span>
            <span className="row-main">
              <span className="row-label">Export results as CSV</span>
              <span className="row-sublabel">
                Every judge, every criterion, with the weighted totals
              </span>
            </span>
            <Icon name="chevronRight" size={18} className="chevron" />
          </button>
        </div>
      </div>
    </>
  );
}
