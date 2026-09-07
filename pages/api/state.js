import { getState, setState, usingFallbackStorage } from "../../lib/db";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const state = await getState();
      return res.status(200).json({ ...state, _fallback: usingFallbackStorage() });
    }

    if (req.method === "PATCH") {
      const state = await getState();
      const body = req.body || {};
      const next = { ...state };

      if (Array.isArray(body.criteria)) next.criteria = body.criteria;
      if (Array.isArray(body.participants)) next.participants = body.participants;
      if (Array.isArray(body.judges)) next.judges = body.judges;
      if (typeof body.eventName === "string") next.eventName = body.eventName;

      await setState(next);
      return res.status(200).json({ ...next, _fallback: usingFallbackStorage() });
    }

    res.setHeader("Allow", ["GET", "PATCH"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", detail: String(err) });
  }
}
