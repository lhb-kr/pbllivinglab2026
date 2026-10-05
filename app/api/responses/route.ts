import { NextResponse } from "next/server";
import { burnoutScore, typeCode } from "@/lib/cloudTypes";
import { SCHOOLS } from "@/lib/questions";
import { cleanPersonal, sanitizeAnswers } from "@/lib/sanitize";
import { insertResponses } from "@/lib/store";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  // 개인정보 수집·이용 동의는 참여 필수
  if (body.consentPersonal !== true) {
    return NextResponse.json({ error: "개인정보 수집·이용 동의가 필요해요." }, { status: 400 });
  }
  const answers = sanitizeAnswers(body.answers);
  const school = SCHOOLS.find((s) => s === body.school) ?? null;
  const duration = Number(body.durationSec);

  try {
    const [row] = await insertResponses([
      {
        answers,
        consent_personal: true,
        name: cleanPersonal(body.name),
        phone: cleanPersonal(body.phone),
        school,
        type_code: typeCode(answers),
        burnout_score: burnoutScore(answers),
        duration_sec: Number.isFinite(duration) && duration > 0 ? Math.round(Math.min(duration, 86400)) : null,
      },
    ]);
    return NextResponse.json({ ok: true, id: row.id, type: row.type_code });
  } catch (e) {
    console.error("[responses] insert failed", e);
    return NextResponse.json({ error: "저장 중 문제가 발생했어요." }, { status: 500 });
  }
}
