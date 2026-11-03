import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { SURVEY_VERSION } from "@/lib/questions";
import { dbStatus, listResponses } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const status = await dbStatus();
  if (status.mode === "supabase" && !status.ready) return NextResponse.json({ rows: [], storage: "supabase", status });
  const all = await listResponses();
  // 문항 번호의 뜻이 버전마다 달라서, 대시보드는 현재 설문지 버전 응답만 보여줌
  const rows = all.filter((r) => r.survey_version === SURVEY_VERSION);
  return NextResponse.json({ rows, oldCount: all.length - rows.length, storage: status.mode, status });
}
