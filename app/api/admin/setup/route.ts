import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { dbStatus, setupDatabase } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    await setupDatabase();
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
  // PostgREST 캐시 갱신에 잠깐 시간이 걸릴 수 있음
  await new Promise((r) => setTimeout(r, 1500));
  return NextResponse.json({ ok: true, status: await dbStatus() });
}
