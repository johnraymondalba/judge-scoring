// lib/auth.js
//
// Session + credential helpers.
//
// Judges log in with their name (picked from the roster) plus a numeric PIN
// that the organizer sets for them in the Admin tab. PINs are stored only as
// a salted scrypt hash, so the raw PIN never exists in the database and is
// never sent to the browser.
//
// A successful login sets an httpOnly, signed cookie. The score API reads the
// judge's identity out of that cookie instead of trusting whatever the browser
// puts in the request body — that is what stops one judge from submitting
// scores under another judge's name.
//
// Two environment variables matter in production:
//   SESSION_SECRET  — HMAC key for the session cookie
//   ADMIN_PASSWORD  — the organizer password
// Both have insecure development fallbacks, and the app shows a warning
// banner to organizers while those fallbacks are in use.

import crypto from "crypto";

const COOKIE_NAME = "js_session";
const MAX_AGE_SECONDS = 12 * 60 * 60; // one long event day

const DEV_SECRET = "dev-only-insecure-session-secret";
const DEV_ADMIN_PASSWORD = "admin123";

function secret() {
  return process.env.SESSION_SECRET || DEV_SECRET;
}

export function usingDefaultSecret() {
  return !process.env.SESSION_SECRET;
}

export function usingDefaultAdminPassword() {
  return !process.env.ADMIN_PASSWORD;
}

function adminPassword() {
  return process.env.ADMIN_PASSWORD || DEV_ADMIN_PASSWORD;
}

/** Constant-time string compare that tolerates differing lengths. */
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  // Hash both sides first so the comparison length never leaks the secret's length.
  const hashA = crypto.createHash("sha256").update(bufA).digest();
  const hashB = crypto.createHash("sha256").update(bufB).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export function checkAdminPassword(input) {
  if (typeof input !== "string" || input.length === 0) return false;
  return safeEqual(input, adminPassword());
}

// --- PIN hashing -----------------------------------------------------------

export function hashPin(pin) {
  const pinSalt = crypto.randomBytes(16).toString("hex");
  const pinHash = crypto.scryptSync(String(pin), pinSalt, 64).toString("hex");
  return { pinSalt, pinHash };
}

export function verifyPin(pin, judge) {
  if (!judge || !judge.pinHash || !judge.pinSalt) return false;
  if (typeof pin !== "string" || pin.length === 0) return false;
  let candidate;
  try {
    candidate = crypto.scryptSync(pin, judge.pinSalt, 64);
  } catch (e) {
    return false;
  }
  const expected = Buffer.from(judge.pinHash, "hex");
  if (expected.length !== candidate.length) return false;
  return crypto.timingSafeEqual(candidate, expected);
}

export function isValidPinFormat(pin) {
  return typeof pin === "string" && /^\d{4,6}$/.test(pin);
}

// --- Session cookie --------------------------------------------------------

function sign(payloadB64) {
  return crypto.createHmac("sha256", secret()).update(payloadB64).digest("base64url");
}

export function sessionCookie(session) {
  const payload = { ...session, exp: Date.now() + MAX_AGE_SECONDS * 1000 };
  const b64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const token = `${b64}.${sign(b64)}`;
  const parts = [
    `${COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${MAX_AGE_SECONDS}`,
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

export function clearedSessionCookie() {
  const parts = [`${COOKIE_NAME}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

export function readSession(req) {
  const token = req.cookies ? req.cookies[COOKIE_NAME] : null;
  if (!token) return null;

  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;

  const b64 = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = sign(b64);
  if (signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  try {
    const payload = JSON.parse(Buffer.from(b64, "base64url").toString("utf-8"));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

export function requireRole(req, res, role) {
  const session = readSession(req);
  if (!session || session.role !== role) {
    res.status(401).json({ error: "Not signed in" });
    return null;
  }
  return session;
}
