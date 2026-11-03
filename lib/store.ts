import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SURVEY_VERSION, type Answers } from "./questions";

export interface ResponseRow {
  id: string;
  created_at: string;
  name: string | null;
  phone: string | null;
  school: string | null;
  consent_personal: boolean;
  answers: Answers;
  type_code: string;
  /** 이전 버전(CBI) 응답에만 값이 있음 */
  burnout_score: number | null;
  duration_sec: number | null;
  /** 설문지 버전. 이전 응답은 1 */
  survey_version: number;
}

export type NewResponse = Omit<ResponseRow, "id" | "created_at" | "survey_version" | "burnout_score"> & { created_at?: string };

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
const CONTACTS_FILE = path.join(DATA_DIR, "contacts.json");

interface ContactRow { response_id: string; created_at: string; name: string | null; phone: string | null }
const CONTACTS = "survey_contacts";

async function readJson<T>(file: string): Promise<T[]> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return [];
  }
}

async function writeJson(file: string, rows: unknown[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(rows, null, 2));
}

/**
 * 응답 저장. 안내문대로 성명·연락처는 응답 표(survey_responses)가 아닌
 * 별도 표(survey_contacts)에 응답 ID로만 연결해서 보관합니다.
 */
export async function insertResponses(items: NewResponse[]) {
  const rows: ResponseRow[] = items.map((r) => ({
    id: randomUUID(),
    ...r,
    name: null,
    phone: null,
    burnout_score: null,
    survey_version: SURVEY_VERSION,
    created_at: r.created_at ?? new Date().toISOString(),
  }));
  const contacts: ContactRow[] = rows
    .map((row, i) => ({ response_id: row.id, created_at: row.created_at, name: items[i].name, phone: items[i].phone }))
    .filter((c) => c.name || c.phone);

  const db = supabase();
  if (db) {
    const { error } = await db.from(TABLE).insert(rows);
    if (error) throw new Error(error.message);
    if (contacts.length) {
      const { error: cErr } = await db.from(CONTACTS).insert(contacts);
      if (cErr) throw new Error(cErr.message);
    }
    return rows;
  }
  await writeJson(DATA_FILE, [...(await readJson<ResponseRow>(DATA_FILE)), ...rows]);
  await writeJson(CONTACTS_FILE, [...(await readJson<ContactRow>(CONTACTS_FILE)), ...contacts]);
  return rows;
}

/** 관리자 화면용: 응답에 분리 보관된 성명·연락처를 붙여서 돌려줌 */
async function withContacts(rows: ResponseRow[]): Promise<ResponseRow[]> {
  let contacts: ContactRow[];
  const db = supabase();
  if (db) {
    contacts = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await db.from(CONTACTS).select("*").range(from, from + 999);
      if (error) throw new Error(error.message);
      contacts.push(...(data as ContactRow[]));
      if (!data || data.length < 1000) break;
    }
  } else {
    contacts = await readJson<ContactRow>(CONTACTS_FILE);
  }
  const byId = new Map(contacts.map((c) => [c.response_id, c]));
  // 이전 버전 응답은 성명·연락처가 응답 표에 함께 들어 있음
  return rows.map((r) => {
    const c = byId.get(r.id);
    return c ? { ...r, name: c.name, phone: c.phone } : r;
  });
}

/** version 을 주면 그 설문지 버전의 응답만 돌려줍니다. */
export async function listResponses(version?: number): Promise<ResponseRow[]> {
  const rows = await withContacts(await listAllResponses());
  return version == null ? rows : rows.filter((r) => r.survey_version === version);
}

async function listAllResponses(): Promise<ResponseRow[]> {
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
  return (await readJson<ResponseRow>(DATA_FILE))
    .map((r) => ({ ...r, survey_version: r.survey_version ?? 1 }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
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
