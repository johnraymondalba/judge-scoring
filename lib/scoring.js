// lib/scoring.js
// Pure helper functions for turning raw per-criteria scores into
// weighted totals, shared by the judge form (live preview) and the
// results tally.

export function scoreKey(judgeId, participantId) {
  return `${judgeId}::${participantId}`;
}

// rawScores: { [criteriaId]: number 0-100 }
// criteria: [{id, weight}]
// returns weighted total out of 100 (rounded to 2 decimals)
export function weightedTotal(rawScores, criteria) {
  if (!rawScores) return null;
  let total = 0;
  let weightSeen = 0;
  for (const c of criteria) {
    const raw = rawScores[c.id];
    if (raw === undefined || raw === null || raw === "") continue;
    total += (Number(raw) * Number(c.weight)) / 100;
    weightSeen += Number(c.weight);
  }
  if (weightSeen === 0) return null;
  return Math.round(total * 100) / 100;
}

// Builds a full leaderboard from state.
// Returns [{ participant, perJudge: {judgeId: total|null}, average: number|null, judgesScored: number }]
export function buildLeaderboard(state) {
  const { participants, judges, criteria, scores } = state;
  const rows = participants.map((p) => {
    const perJudge = {};
    let sum = 0;
    let count = 0;
    for (const j of judges) {
      const entry = scores[scoreKey(j.id, p.id)];
      const total = entry ? weightedTotal(entry, criteria) : null;
      perJudge[j.id] = total;
      if (total !== null) {
        sum += total;
        count += 1;
      }
    }
    const average = count > 0 ? Math.round((sum / count) * 100) / 100 : null;
    return { participant: p, perJudge, average, judgesScored: count };
  });

  rows.sort((a, b) => {
    if (a.average === null && b.average === null) return 0;
    if (a.average === null) return 1;
    if (b.average === null) return -1;
    return b.average - a.average;
  });

  return rows;
}

export function weightSum(criteria) {
  return criteria.reduce((sum, c) => sum + Number(c.weight || 0), 0);
}
