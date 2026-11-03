import { isAdmin } from "@/lib/auth";
import { QUESTIONS, SURVEY_VERSION, etcKey } from "@/lib/questions";
import { CLOUD_TYPES, MOTIVE_SCALES, enjoymentScore, motivationScores } from "@/lib/cloudTypes";
import { listResponses, type ResponseRow } from "@/lib/store";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  const s = Array.isArray(v) ? v.join("; ") : v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const csv = (lines: unknown[][], name: string) => {
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + lines.map((l) => l.map(cell).join(",")).join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}-${stamp}.csv"`,
    },
  });
};

const base = (r: ResponseRow) => [r.id, r.created_at, r.name, r.phone, r.school, r.consent_personal ? "Y" : "N"];
const BASE_HEADER = ["응답ID", "제출시각", "이름", "전화번호", "학교", "개인정보동의"];

export async function GET(req: Request) {
  if (!(await isAdmin())) return new Response("unauthorized", { status: 401 });
  const version = Number(new URL(req.url).searchParams.get("version") ?? SURVEY_VERSION);
  const rows = await listResponses(version);


  // 이전 설문지 버전: 문항 정의가 코드에 없으므로 저장된 키 그대로 내보냄
  if (version !== SURVEY_VERSION) {
    const keys = [...new Set(rows.flatMap((r) => Object.keys(r.answers)))].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
    const lines: unknown[][] = [[...BASE_HEADER, "유형코드", "소진점수(CBI)", "소요시간(초)", ...keys]];
    for (const r of rows) lines.push([...base(r), r.type_code, r.burnout_score, r.duration_sec, ...keys.map((k) => r.answers[k])]);
    return csv(lines, `chowon-survey-v${version}`);
  }

  const header = [
    ...BASE_HEADER, "유형코드", "유형이름", "일상즐거움지수(0-100)",
    ...MOTIVE_SCALES.map((s) => `의욕_${s.key}(0-100)`), "소요시간(초)",
  ];
  const qCols: string[] = [];
  for (const q of QUESTIONS) {
    qCols.push(q.id);
    header.push(q.number ? `Q${q.number}` : q.id === "age" ? "나이" : q.id);
    if (q.options?.some((o) => o.other)) {
      qCols.push(etcKey(q.id));
      header.push(`${q.number ? `Q${q.number}` : q.id}_기타`);
    }
  }
  const lines: unknown[][] = [header];
  for (const r of rows) {
    const m = motivationScores(r.answers);
    lines.push([
      ...base(r), r.type_code, CLOUD_TYPES[r.type_code]?.name, enjoymentScore(r.answers),
      ...MOTIVE_SCALES.map((s) => m[s.key]), r.duration_sec,
      ...qCols.map((k) => r.answers[k]),
    ]);
  }
  return csv(lines, "chowon-survey");
}
