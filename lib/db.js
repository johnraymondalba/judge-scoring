// lib/db.js
//
// Storage layer for the judging system.
//
// On Vercel, add a free Redis database from the Vercel Marketplace (Upstash
// Redis, "Add Integration → Storage → Redis"). Connecting it to your project
// automatically sets UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (or,
// for older Vercel KV projects, KV_REST_API_URL / KV_REST_API_TOKEN). When
// those are present, all judges and admins share one live database.
//
// If those env vars are NOT present (e.g. running `npm run dev` on your own
// laptop without Redis configured), everything falls back to a JSON file on
// disk at .data/db.json so the app still works for local testing. Data in
// that fallback file is NOT shared between different devices.

import fs from "fs";
import path from "path";

const DB_FILE = path.join(process.cwd(), ".data", "db.json");
const KV_KEY = "judging-state-v1";

const DEFAULT_STATE = {
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
  judges: [],
  // scores keyed by `${judgeId}::${participantId}` -> { [criteriaId]: number, submittedAt }
  scores: {},
};

function hasKv() {
  return Boolean(
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) ||
      (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
  );
}

let redisClient = null;
async function getRedis() {
  if (redisClient) return redisClient;
  const { Redis } = await import("@upstash/redis");
  redisClient = Redis.fromEnv();
  return redisClient;
}

function readFileState() {
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function writeFileState(state) {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
}

export async function getState() {
  if (hasKv()) {
    const redis = await getRedis();
    const state = await redis.get(KV_KEY);
    if (!state) {
      await redis.set(KV_KEY, DEFAULT_STATE);
      return DEFAULT_STATE;
    }
    return state;
  }
  const fileState = readFileState();
  if (!fileState) {
    writeFileState(DEFAULT_STATE);
    return DEFAULT_STATE;
  }
  return fileState;
}

export async function setState(state) {
  if (hasKv()) {
    const redis = await getRedis();
    await redis.set(KV_KEY, state);
    return state;
  }
  writeFileState(state);
  return state;
}

export function usingFallbackStorage() {
  return !hasKv();
}
