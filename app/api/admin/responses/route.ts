import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { dbStatus, listResponses } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const status = await dbStatus();
  if (status.mode === "supabase" && !status.ready) return NextResponse.json({ rows: [], storage: "supabase", status });
  const rows = await listResponses();
  return NextResponse.json({ rows, storage: status.mode, status });
}
