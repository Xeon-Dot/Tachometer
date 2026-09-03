import { MongoClient, Db, Collection } from "mongodb";

export type RequestMetric = {
  _id?: unknown;
  provider: string;
  path: string;
  method: string;
  status: number;
  latencyMs: number;
  ttftMs: number | null;
  isStreaming: boolean;
  inputTokens: number | null;
  outputTokens: number | null;
  cachedTokens: number | null;
  totalTokens: number | null;
  requestBytes: number;
  responseBytes: number | null;
  timestamp: Date;
  model: string | null;
  error: string | null;
};

const MONGO_URL =
  process.env.MONGO_URL ||
  process.env.MONGODB_URI ||
  "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "tachometer";
const REQUIRE_MONGO = ["1", "true", "yes", "on"].includes(
  (process.env.REQUIRE_MONGO || "").trim().toLowerCase(),
);

let client: MongoClient | null = null;
let db: Db | null = null;
let connected = false;

const memoryStore: RequestMetric[] = [];

export async function initDb() {
  try {
    client = new MongoClient(MONGO_URL, { serverSelectionTimeoutMS: 2000 });
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    db = client.db(DB_NAME);
    connected = true;
    console.log(`[db] connected to ${MONGO_URL} / ${DB_NAME}`);
    await db.collection("requests").createIndex({ timestamp: -1 });
    await db.collection("requests").createIndex({ provider: 1, timestamp: -1 });
  } catch (e) {
    if (REQUIRE_MONGO) {
      console.error(
        `[db] REQUIRE_MONGO is set but mongodb is not reachable (${MONGO_URL}):`,
        (e as Error).message,
      );
      throw new Error(
        `REQUIRE_MONGO is set but mongodb is not reachable at ${MONGO_URL}`,
      );
    }
    console.warn(
      `[db] mongodb not available (${MONGO_URL}), using in-memory store:`,
      (e as Error).message,
    );
    connected = false;
    db = null;
  }
}

export function isDbConnected() {
  return connected && db !== null;
}

export function getCollection(): Collection<RequestMetric> | null {
  if (!connected || !db) return null;
  return db.collection<RequestMetric>("requests");
}

export async function insertMetric(m: RequestMetric) {
  const col = getCollection();
  if (col) {
    try {
      await col.insertOne(m as unknown);
      return;
    } catch {}
  }
  memoryStore.push(m);
  if (memoryStore.length > 10000) memoryStore.shift();
}

export async function getRecent(limit = 100): Promise<RequestMetric[]> {
  const col = getCollection();
  if (col) {
    try {
      return (await col
        .find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray()) as unknown;
    } catch {}
  }
  return [...memoryStore]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

export async function getAllSince(since: Date): Promise<RequestMetric[]> {
  const col = getCollection();
  if (col) {
    try {
      return (await col
        .find({ timestamp: { $gte: since } })
        .toArray()) as unknown;
    } catch {}
  }
  return memoryStore.filter((m) => m.timestamp >= since);
}

export async function getAll(): Promise<RequestMetric[]> {
  const col = getCollection();
  if (col) {
    try {
      return (await col.find().toArray()) as unknown;
    } catch {}
  }
  return [...memoryStore];
}
