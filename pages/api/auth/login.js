import { getState } from "../../../lib/db";
import {
  checkAdminPassword,
  sessionCookie,
  verifyPin,
} from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const { role, judgeId, pin, password } = req.body || {};

    if (role === "admin") {
      if (!checkAdminPassword(password)) {
        return res.status(401).json({ error: "Incorrect organizer password." });
      }
      const session = { role: "admin" };
      res.setHeader("Set-Cookie", sessionCookie(req, session));
      return res.status(200).json(session);
    }

    if (role === "judge") {
      const state = await getState();
      const judge = (state.judges || []).find((j) => j.id === judgeId);

      // Same message whether the judge doesn't exist or the PIN is wrong, so
      // the form can't be used to probe which judges have been set up.
      if (!judge || !verifyPin(pin, judge)) {
        return res.status(401).json({ error: "That PIN doesn't match. Try again." });
      }

      const session = { role: "judge", judgeId: judge.id, judgeName: judge.name };
      res.setHeader("Set-Cookie", sessionCookie(req, session));
      return res.status(200).json(session);
    }

    return res.status(400).json({ error: "Unknown role" });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
