import { NextResponse } from "next/server";
import { burnoutScore, typeCode } from "@/lib/cloudTypes";
import { cleanPersonal, sanitizeAnswers } from "@/lib/sanitize";
import { insertResponses } from "@/lib/store";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const answers = sanitizeAnswers(body.answers);
  const consent = body.consentPersonal === true;
  const duration = Number(body.durationSec);

  try {
    const [row] = await insertResponses([
      {
        answers,
        consent_personal: consent,
        // 개인정보 수집·이용에 동의한 경우에만 저장
        student_id: consent ? cleanPersonal(body.studentId) : null,
        phone: consent ? cleanPersonal(body.phone) : null,
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
