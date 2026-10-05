import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Answers } from "./questions";

export interface ResponseRow {
  id: string;
  created_at: string;
  name: string | null;
  phone: string | null;
  school: string | null;
  consent_personal: boolean;
  answers: Answers;
  type_code: string;
  burnout_score: number | null;
  duration_sec: number | null;
}

export type NewResponse = Omit<ResponseRow, "id" | "created_at"> & { created_at?: string };

const TABLE = "survey_responses";

let supa: SupabaseClient | null | undefined;
function supabase() {
  if (supa !== undefined) return supa;
  // Vercel의 Supabase 연동은 SUPABASE_URL 과 NEXT_PUBLIC_SUPABASE_URL 을 모두 넣어줍니다.
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  supa = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return supa;
}

export const storageMode = () => (supabase() ? "supabase" : "local");

// ── 로컬 파일 저장 (Supabase 연결 전 프로토타입용) ──
const DATA_DIR = process.env.LOCAL_DATA_DIR || path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "responses.json");

async function readLocal(): Promise<ResponseRow[]> {
  try {
    return JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeLocal(rows: ResponseRow[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(rows, null, 2));
}

export async function insertResponses(items: NewResponse[]) {
  const rows: ResponseRow[] = items.map((r) => ({
    id: randomUUID(),
    ...r,
    created_at: r.created_at ?? new Date().toISOString(),
  }));
  const db = supabase();
  if (db) {
    const { error } = await db.from(TABLE).insert(rows);
    if (error) throw new Error(error.message);
    return rows;
  }
  const all = await readLocal();
  all.push(...rows);
  await writeLocal(all);
  return rows;
}

export async function listResponses(): Promise<ResponseRow[]> {
  const db = supabase();
  if (db) {
    const out: ResponseRow[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await db
        .from(TABLE)
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, from + 999);
      if (error) throw new Error(error.message);
      out.push(...(data as ResponseRow[]));
      if (!data || data.length < 1000) break;
    }
    return out;
  }
  return (await readLocal()).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export type DbStatus =
  | { mode: "local" }
  | { mode: "supabase"; ready: true }
  | { mode: "supabase"; ready: false; reason: "missing-table" | "error"; message?: string; canAutoSetup: boolean };

const postgresUrl = () => process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || "";

/** Supabase 테이블이 준비됐는지 확인 */
export async function dbStatus(): Promise<DbStatus> {
  const db = supabase();
  if (!db) return { mode: "local" };
  const { error } = await db.from(TABLE).select("id").limit(1);
  if (!error) return { mode: "supabase", ready: true };
  const missing = error.code === "42P01" || error.code === "PGRST205" || /does not exist|schema cache/i.test(error.message);
  return {
    mode: "supabase",
    ready: false,
    reason: missing ? "missing-table" : "error",
    message: error.message,
    canAutoSetup: !!postgresUrl(),
  };
}

/** Vercel–Supabase 연동이 넣어주는 POSTGRES_URL 로 테이블을 만듭니다. */
export async function setupDatabase() {
  const conn = postgresUrl();
  if (!conn) throw new Error("POSTGRES_URL 환경변수가 없어요. supabase/schema.sql 을 SQL Editor에서 실행해주세요.");
  const { Client } = await import("pg");
  const { SCHEMA_SQL } = await import("./schema");
  // Supabase 인증서 체인은 기본 CA 목록에 없어서 검증을 끄고 TLS로만 연결
  const url = new URL(conn);
  url.searchParams.delete("sslmode");
  const client = new Client({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(SCHEMA_SQL);
  } finally {
    await client.end();
  }
}
