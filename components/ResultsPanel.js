import { Fragment, useMemo, useState } from "react";
import { buildLeaderboard, weightedTotal } from "../lib/scoring";

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

export default function ResultsPanel({ state }) {
  const { judges, participants, criteria, scores } = state;
  const leaderboard = useMemo(() => buildLeaderboard(state), [state]);
  const [expanded, setExpanded] = useState(null);

  function downloadCsv() {
    const csv = toCsv(state, leaderboard);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.eventName.replace(/\s+/g, "_")}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (participants.length === 0) {
    return <div className="empty">Add participants and judges to see results here.</div>;
  }

  return (
    <div className="section">
      <div className="section-head">
        <h2>Live results</h2>
        <p className="hint">
          Weighted average across all judges who have scored so far. Updates automatically as
          judges submit.
        </p>
        <button className="btn secondary" onClick={downloadCsv}>
          Export CSV
        </button>
      </div>

      <table className="ledger">
        <thead>
          <tr>
            <th style={{ width: 36 }}>#</th>
            <th>Participant</th>
            {judges.map((j) => (
              <th key={j.id} className="num">
                {j.name}
              </th>
            ))}
            <th className="num">Average</th>
            <th className="num">Coverage</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((row, i) => (
            <Fragment key={row.participant.id}>
              <tr
                className={i === 0 && row.average !== null ? "rank-1" : ""}
                onClick={() =>
                  setExpanded(expanded === row.participant.id ? null : row.participant.id)
                }
                style={{ cursor: "pointer" }}
              >
                <td className="rank-badge">{row.average !== null ? i + 1 : "—"}</td>
                <td>
                  <strong>{row.participant.name}</strong>
                  {row.participant.team && (
                    <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
                      {row.participant.team}
                    </div>
                  )}
                </td>
                {judges.map((j) => (
                  <td key={j.id} className="num">
                    {row.perJudge[j.id] === null ? "—" : row.perJudge[j.id].toFixed(2)}
                  </td>
                ))}
                <td className="num total">
                  {row.average === null ? "—" : row.average.toFixed(2)}
                </td>
                <td className="num">
                  {row.judgesScored}/{judges.length}
                </td>
              </tr>
              {expanded === row.participant.id && (
                <tr>
                  <td></td>
                  <td colSpan={judges.length + 3}>
                    <BreakdownTable
                      participant={row.participant}
                      judges={judges}
                      criteria={criteria}
                      scores={scores}
                    />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BreakdownTable({ participant, judges, criteria, scores }) {
  return (
    <table className="ledger" style={{ margin: "8px 0" }}>
      <thead>
        <tr>
          <th>Criterion</th>
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
            <td>{c.name}</td>
            <td className="num">{c.weight}%</td>
            {judges.map((j) => {
              const entry = scores[`${j.id}::${participant.id}`];
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
          <td>
            <strong>Weighted total</strong>
          </td>
          <td className="num">100%</td>
          {judges.map((j) => {
            const entry = scores[`${j.id}::${participant.id}`];
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
  );
}
