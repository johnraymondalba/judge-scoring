import { getState, setState } from "../../lib/db";

export default async function handler(req, res) {
  try {
    const state = await getState();

    if (req.method === "POST") {
      const { judgeId, participantId, scores } = req.body || {};
      if (!judgeId || !participantId || typeof scores !== "object") {
        return res.status(400).json({ error: "judgeId, participantId and scores are required" });
      }
      const key = `${judgeId}::${participantId}`;
      const next = { ...state, scores: { ...state.scores } };
      next.scores[key] = { ...scores, submittedAt: new Date().toISOString() };
      await setState(next);
      return res.status(200).json({ ok: true, scores: next.scores });
    }

    if (req.method === "DELETE") {
      const { judgeId, participantId } = req.body || {};
      const key = `${judgeId}::${participantId}`;
      const next = { ...state, scores: { ...state.scores } };
      delete next.scores[key];
      await setState(next);
      return res.status(200).json({ ok: true, scores: next.scores });
    }

    res.setHeader("Allow", ["POST", "DELETE"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", detail: String(err) });
  }
}
