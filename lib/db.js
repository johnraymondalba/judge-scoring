// lib/db.js
//
// Storage layer for the judging system.
//
// On Vercel, add a free Redis database from the Vercel Marketplace (Upstash
// Redis, "Add Integration → Storage → Redis"). Connecting it to your project
// automatically sets UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (or,
// for older Vercel KV projects, KV_REST_API_URL / KV_REST_API_TOKEN). When
// those are present, all judges and admins share one live database. A plain
// REDIS_URL (Vercel's own Redis store, or any redis:// server) works as well.
//
// If those env vars are NOT present (e.g. running `npm run dev` on your own
// laptop without Redis configured), everything falls back to a JSON file on
// disk at .data/db.json so the app still works for local testing. Data in
// that fallback file is NOT shared between different devices.
//
// Scores are deliberately kept in their OWN Redis hash rather than inside the
// config blob. Writing a score is then a single atomic HSET on one field, so
// two judges submitting at the same instant can no longer overwrite each
// other. (The previous version read the whole state, edited it in memory and
// wrote it back, which silently dropped one of any two concurrent scores.)
// The local-file fallback gets the same guarantee from an in-process write
// queue, which is sufficient because the dev server is a single process.

import fs from "fs";
import path from "path";

const DB_FILE = path.join(process.cwd(), ".data", "db.json");
const KV_CONFIG_KEY = "judging-state-v1";
const KV_SCORES_KEY = "judging-scores-v1";

const DEFAULT_CONFIG = {
  eventName: "Food Technology Innovation Challenge",
  criteria: [
    {
      id: "c1",
      name: "Problem/Solution Fit",
      description:
        "How well the proposed solution directly addresses the chosen Food Technology problem statement.",
      weight: 25,
    },
    {
      id: "c2",
      name: "Technical Feasibility & Innovation",
      description:
        "Can this idea actually be built? Realism of the conceptual framework, hardware/software choices, and technical logic.",
      weight: 30,
    },
    {
      id: "c3",
      name: "Market Viability & Impact",
      description:
        "Does the solution have a clear target user in the Philippines? Is there a sustainable business model or clear socio-economic benefit?",
      weight: 20,
    },
    {
      id: "c4",
      name: "Quality of Documentation",
      description:
        "The clarity, depth, and professionalism of the 5-page technical documentation.",
      weight: 10,
    },
    {
      id: "c5",
      name: "Pitch Delivery & Defense",
      description:
        "The team's ability to communicate their idea within 3 minutes and handle technical scrutiny during the 7-minute Q&A.",
      weight: 15,
    },
  ],
  participants: [],
  // A participant is added to this list the first time the organizer puts
  // them on stage. Judges never see participants outside this list. Keeping
  // the history is intentional: after the organizer moves on, a judge who
  // has not submitted yet must still be able to finish that score sheet.
  presentedParticipantIds: [],
  activeParticipantId: null,
  // judges: { id, name, pinHash, pinSalt } — the raw PIN is never stored.
  judges: [],
};

function hasRestKv() {
  return Boolean(
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) ||
      (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
  );
}

// Vercel's own "Redis" marketplace store (and any self-hosted Redis) hands the
// project a single redis:// connection string instead of Upstash REST keys.
function hasKv() {
  return hasRestKv() || Boolean(process.env.REDIS_URL);
}

/**
 * Wraps a node-redis TCP client in the small slice of the Upstash client API
 * this file uses, with the same automatic JSON (de)serialisation, so the rest
 * of the storage layer does not care which kind of Redis it is talking to.
 */
async function tcpRedis(url) {
  const { createClient } = await import("redis");
  const client = createClient({ url });
  client.on("error", (err) => console.error("Redis connection error", err));
  await client.connect();

  const encode = (value) => JSON.stringify(value);
  const decode = (raw) => {
    if (raw === null || raw === undefined) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return raw;
    }
  };

  return {
    get: async (key) => decode(await client.get(key)),
    set: (key, value) => client.set(key, encode(value)),
    hset: (key, fields) =>
      client.hSet(
        key,
        Object.fromEntries(Object.entries(fields).map(([field, value]) => [field, encode(value)]))
      ),
    hgetall: async (key) => {
      const raw = await client.hGetAll(key);
      const fields = Object.keys(raw || {});
      if (fields.length === 0) return null;
      return Object.fromEntries(fields.map((field) => [field, decode(raw[field])]));
    },
    hdel: (key, field) => client.hDel(key, field),
  };
}

// Cached as a promise so concurrent first requests share one connection.
let redisClient = null;
function getRedis() {
  if (!redisClient) {
    redisClient = hasRestKv()
      ? import("@upstash/redis").then(({ Redis }) => Redis.fromEnv())
      : tcpRedis(process.env.REDIS_URL);
    redisClient.catch(() => {
      redisClient = null;
    });
  }
  return redisClient;
}

// On Vercel the filesystem is read-only, so the file fallback cannot work
// there. Fail with a message the organizer can act on instead of a bare 500.
function assertFileStorageUsable() {
  if (process.env.VERCEL) {
    const err = new Error(
      "No database is connected. Add Upstash Redis in this Vercel project's Storage tab, then redeploy."
    );
    err.statusCode = 503;
    throw err;
  }
}

// --- local file fallback ---------------------------------------------------

// Serialises every write so a read-modify-write cycle can't interleave with
// another request's cycle and lose an update.
let writeQueue = Promise.resolve();
function withFileLock(fn) {
  const result = writeQueue.then(fn, fn);
  writeQueue = result.then(
    () => {},
    () => {}
  );
  return result;
}

function readFileState() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  } catch (e) {
    return null;
  }
}

function writeFileState(state) {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
}

function fileState() {
  assertFileStorageUsable();
  const existing = readFileState();
  if (!existing) {
    const fresh = { ...DEFAULT_CONFIG, scores: {} };
    writeFileState(fresh);
    return fresh;
  }
  const scores = existing.scores || {};
  const presentedParticipantIds = Array.isArray(existing.presentedParticipantIds)
    ? existing.presentedParticipantIds
    : Array.from(
        new Set(
          Object.keys(scores)
            .map((key) => key.split("::")[1])
            .filter(Boolean)
        )
      );
  return { ...DEFAULT_CONFIG, ...existing, presentedParticipantIds, scores };
}

// --- public API ------------------------------------------------------------

/**
 * The complete state, including each judge's pinHash/pinSalt. Only the auth
 * layer should see those — API responses go through stripSecrets() first.
 */
export async function getState() {
  if (!hasKv()) return fileState();

  const redis = await getRedis();
  let config = await redis.get(KV_CONFIG_KEY);

  if (!config) {
    config = { ...DEFAULT_CONFIG };
    await redis.set(KV_CONFIG_KEY, config);
  } else if (config.scores) {
    // Migrate databases written by the older single-blob layout.
    const legacy = config.scores;
    const { scores, ...rest } = config;
    if (legacy && Object.keys(legacy).length > 0) {
      await redis.hset(KV_SCORES_KEY, legacy);
    }
    config = rest;
    await redis.set(KV_CONFIG_KEY, config);
  }

  const scores = (await redis.hgetall(KV_SCORES_KEY)) || {};
  const presentedParticipantIds = Array.isArray(config.presentedParticipantIds)
    ? config.presentedParticipantIds
    : Array.from(
        new Set(
          Object.keys(scores)
            .map((key) => key.split("::")[1])
            .filter(Boolean)
        )
      );
  return { ...DEFAULT_CONFIG, ...config, presentedParticipantIds, scores };
}

/** Replace config fields (criteria / participants / judges / eventName). */
export async function patchConfig(patch) {
  if (!hasKv()) {
    return withFileLock(async () => {
      const current = fileState();
      const next = { ...current, ...patch };
      writeFileState(next);
      return next;
    });
  }

  const redis = await getRedis();
  const current = (await redis.get(KV_CONFIG_KEY)) || { ...DEFAULT_CONFIG };
  const { scores, ...configOnly } = current;
  const next = { ...DEFAULT_CONFIG, ...configOnly, ...patch };
  await redis.set(KV_CONFIG_KEY, next);
  const liveScores = (await redis.hgetall(KV_SCORES_KEY)) || {};
  return { ...next, scores: liveScores };
}

/** Write one judge's scores for one participant. Atomic — see file header. */
export async function putScore(key, entry) {
  if (!hasKv()) {
    return withFileLock(async () => {
      const current = fileState();
      current.scores = { ...current.scores, [key]: entry };
      writeFileState(current);
      return current.scores;
    });
  }

  const redis = await getRedis();
  await redis.hset(KV_SCORES_KEY, { [key]: entry });
  return (await redis.hgetall(KV_SCORES_KEY)) || {};
}

export async function removeScore(key) {
  if (!hasKv()) {
    return withFileLock(async () => {
      const current = fileState();
      const next = { ...current.scores };
      delete next[key];
      current.scores = next;
      writeFileState(current);
      return current.scores;
    });
  }

  const redis = await getRedis();
  await redis.hdel(KV_SCORES_KEY, key);
  return (await redis.hgetall(KV_SCORES_KEY)) || {};
}

/**
 * Strip judge credentials before anything is sent to a browser, replacing
 * them with a boolean the Admin tab uses to show "PIN set" / "no PIN yet".
 */
export function stripSecrets(state, isAdmin = false) {
  return {
    ...state,
    judges: (state.judges || []).map((j) => ({
      id: j.id,
      name: j.name,
      assignedPin: isAdmin ? j.assignedPin : undefined,
      hasPin: Boolean((j.pinHash && j.pinSalt) || j.assignedPin),
    })),
  };
}

export function usingFallbackStorage() {
  return !hasKv();
}
