import { readSession, usingDefaultAdminPassword, usingDefaultSecret } from "../../../lib/auth";

export default function handler(req, res) {
  const session = readSession(req);
  if (!session) return res.status(200).json({ session: null });

  return res.status(200).json({
    session: {
      role: session.role,
      judgeId: session.judgeId || null,
      judgeName: session.judgeName || null,
    },
    // Only organizers are told about weak configuration, and only the fact of
    // it — never the values themselves.
    warnings:
      session.role === "admin"
        ? {
            defaultAdminPassword: usingDefaultAdminPassword(),
            defaultSessionSecret: usingDefaultSecret(),
          }
        : undefined,
  });
}
