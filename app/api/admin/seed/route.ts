import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { burnoutScore, typeCode } from "@/lib/cloudTypes";
import { QUESTIONS, SCHOOLS, visibleQuestions, type Answers } from "@/lib/questions";
import { insertResponses, storageMode, type NewResponse } from "@/lib/store";

// 프로토타입 시연용 가짜 응답 생성 — 로컬 저장 모드에서만 동작합니다.
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
const NAMES = ["김하늘", "이구름", "박노을", "최새벽", "정바람", "한여름", "윤별", "오솔길"];
const WORDS = ["복숭아", "고요함", "정거장", "시골", "아늑함", "심심함", "벚꽃", "기차역", "노잼", "포근함", "안개", "우리동네"];
const WISHES = [
  "늦게까지 여는 스터디 카페가 있었으면 좋겠어요.",
  "조천 따라 달리는 러닝 크루 프로그램!",
  "학생들이 편하게 모일 수 있는 무료 공유 라운지",
  "밤에도 밝은 산책로와 가로등",
  "작은 영화관이나 공연장",
  "",
  "",
];

function fakeAnswers(): Answers {
  const a: Answers = {};
  const mood = Math.random();
  for (const q of QUESTIONS) {
    if (q.showIf && !q.showIf(a)) continue;
    const opts = q.options?.map((o) => o.value) ?? [];
    if (q.type === "likert") a[q.id] = Math.max(1, Math.min(5, Math.round(1 + Math.random() * 3 + (mood - 0.5))));
    else if (q.type === "freq") a[q.id] = String(Math.min(4, Math.max(0, Math.round(mood * 4 + (Math.random() - 0.5) * 2))) * 25);
    else if (q.type === "single") a[q.id] = pick(opts.filter((o) => o !== "기타"));
    else if (q.type === "multi") {
      const n = Math.min(q.max ?? 3, 1 + Math.floor(Math.random() * 3));
      a[q.id] = [...opts.filter((o) => o !== "기타")].sort(() => Math.random() - 0.5).slice(0, n);
    } else if (q.id === "q30") a[q.id] = pick(WORDS);
    else if (q.id === "q29") a[q.id] = pick(WISHES) || undefined;
    else if (q.type === "number") a[q.id] = 19 + Math.floor(Math.random() * 8);
  }
  const visible = new Set(visibleQuestions(a).map((q) => q.id));
  for (const k of Object.keys(a)) if (!visible.has(k)) delete a[k];
  return a;
}

export async function POST() {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (storageMode() !== "local") return NextResponse.json({ error: "Supabase 연결 시에는 데모 데이터를 만들 수 없어요." }, { status: 400 });

  const items: NewResponse[] = Array.from({ length: 40 }, () => {
    const answers = fakeAnswers();
    return {
      answers,
      consent_personal: true,
      name: pick(NAMES),
      phone: `010-${1000 + Math.floor(Math.random() * 8999)}-${1000 + Math.floor(Math.random() * 8999)}`,
      school: pick([...SCHOOLS]),
      type_code: typeCode(answers),
      burnout_score: burnoutScore(answers),
      duration_sec: 150 + Math.floor(Math.random() * 300),
      created_at: new Date(Date.now() - Math.random() * 6 * 86400000).toISOString(),
    };
  });
  await insertResponses(items);
  return NextResponse.json({ ok: true, count: items.length });
}
