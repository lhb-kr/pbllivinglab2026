import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { listResponses, storageMode } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const rows = await listResponses();
  return NextResponse.json({ rows, storage: storageMode() });
}
