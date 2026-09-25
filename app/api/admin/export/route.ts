import { isAdmin } from "@/lib/auth";
import { QUESTIONS, etcKey } from "@/lib/questions";
import { CLOUD_TYPES } from "@/lib/cloudTypes";
import { listResponses } from "@/lib/store";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  const s = Array.isArray(v) ? v.join("; ") : v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET() {
  if (!(await isAdmin())) return new Response("unauthorized", { status: 401 });
  const rows = await listResponses();

  const header = ["응답ID", "제출시각", "학번", "전화번호", "개인정보동의", "유형코드", "유형이름", "소진점수(CBI)", "소요시간(초)"];
  const qCols: string[] = [];
  for (const q of QUESTIONS) {
    qCols.push(q.id);
    header.push(`Q${q.number}`);
    if (q.options?.some((o) => o.other)) {
      qCols.push(etcKey(q.id));
      header.push(`Q${q.number}_기타`);
    }
  }
  const lines = [header.map(cell).join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.id, r.created_at, r.student_id, r.phone, r.consent_personal ? "Y" : "N",
        r.type_code, CLOUD_TYPES[r.type_code]?.name, r.burnout_score, r.duration_sec,
        ...qCols.map((k) => r.answers[k]),
      ].map(cell).join(","),
    );
  }
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="chowon-survey-${stamp}.csv"`,
    },
  });
}
