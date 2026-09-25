import type { Answers } from "./questions";

// ─────────────────────────────────────────────────────────────
// 조치원 구름 유형 — MBTI처럼 세 가지 축으로 8가지 유형을 만듭니다.
//   O / H : 바깥을 떠다니는 탐험 구름 vs 아늑한 곳에 머무는 구름   (Q5·Q6·Q7·Q8·Q23)
//   T / S : 함께 뭉치는 구름 vs 혼자 흐르는 구름                   (Q6·Q23·Q28-1)
//   L / E : 조치원에 머물고 싶은 구름 vs 어디론가 떠나고 싶은 구름  (Q9~Q15·Q5·Q6·Q23)
// 소진(CBI Personal Burnout, Q16~21)은 유형과 별개로 "마음 날씨"로 보여줍니다.
// ─────────────────────────────────────────────────────────────

export interface CloudType {
  code: string;
  name: string;
  tagline: string;
  description: string;
  tags: string[];
  tip: string;
  match: string;
  colors: [string, string];
}

export const AXES = [
  { key: 0, a: { letter: "O", label: "둥실 탐험" }, b: { letter: "H", label: "포근 칩거" } },
  { key: 1, a: { letter: "T", label: "뭉게 함께" }, b: { letter: "S", label: "새털 혼자" } },
  { key: 2, a: { letter: "L", label: "조치원 머묾" }, b: { letter: "E", label: "바깥 여행" } },
] as const;

export const CLOUD_TYPES: Record<string, CloudType> = {
  OTL: {
    code: "OTL",
    name: "복숭아 골목대장 구름",
    tagline: "조치원 원도심 맛집 지도는 이미 내 머릿속에",
    description:
      "친구들을 이끌고 원도심 골목골목을 누비는 분위기 메이커. 새로 생긴 카페도, 오래된 분식집도 당신이 제일 먼저 알아요. 조치원이 작다고요? 당신에겐 아직 못 가본 곳이 더 많은 동네랍니다.",
    tags: ["#인싸력만렙", "#단골집_부자", "#조치원_홍보대사"],
    tip: "복숭아 철엔 친구들과 조치원 복숭아 투어를 기획해보세요. 당신이 열면 다들 따라와요.",
    match: "HSL",
    colors: ["#ffb59e", "#ffd7a8"],
  },
  OTE: {
    code: "OTE",
    name: "세종행 BRT 구름",
    tagline: "약속 장소는 늘 나성동, 교통카드는 늘 충전 완료",
    description:
      "사람도 좋고 새로운 곳도 좋은 당신. 다만 조치원은 조금 좁게 느껴져서, 친구들과 함께 세종 시내나 더 먼 곳으로 흘러가곤 해요. 버스 시간표는 당신이 제일 잘 알죠.",
    tags: ["#약속_잡는_사람", "#막차_사수", "#어디든_같이"],
    tip: "조치원에서도 가볍게 모일 수 있는 아지트를 하나 만들어두면, 막차 걱정이 줄어들 거예요.",
    match: "HTL",
    colors: ["#9fb8ff", "#c9d6ff"],
  },
  OSL: {
    code: "OSL",
    name: "조천 산책 구름",
    tagline: "벚꽃길도, 노을도 혼자 걸을 때 제일 예뻐",
    description:
      "혼자만의 템포로 조치원을 천천히 즐기는 산책가. 조천 따라 걷거나, 조용한 카페 창가에 앉아 있는 시간이 당신을 충전시켜요. 조치원의 느린 공기가 당신과 잘 맞아요.",
    tags: ["#혼자서도_잘해요", "#산책_마스터", "#노을_수집가"],
    tip: "봄의 조천 벚꽃길은 당신을 위한 길이에요. 좋아하는 플레이리스트를 챙겨 나가보세요.",
    match: "HTE",
    colors: ["#a8e0c4", "#d4f0e2"],
  },
  OSE: {
    code: "OSE",
    name: "조치원역 떠돌이 구름",
    tagline: "배낭 하나면 어디든, 조치원역은 나의 출발점",
    description:
      "혼자 훌쩍 떠나는 게 익숙한 자유로운 구름. 기분 전환이 필요하면 조치원역에서 기차를 타고 천안으로, 대전으로 흘러가요. 떠날 곳이 있다는 게 당신의 숨구멍이에요.",
    tags: ["#즉흥여행", "#기차_창가석", "#자유영혼"],
    tip: "가끔은 멀리 가지 않아도 괜찮아요. 조치원 1927 아트센터처럼 가까운 곳에서도 새로운 풍경을 만날 수 있어요.",
    match: "HTL",
    colors: ["#c3a9ff", "#e4d6ff"],
  },
  HTL: {
    code: "HTL",
    name: "과방 지킴이 구름",
    tagline: "동아리방이 제2의 집, 학교 앞이 곧 내 세상",
    description:
      "멀리 가지 않아도 사람들과 함께라면 충분히 즐거운 당신. 과방, 동아리방, 학교 앞 식당이 당신의 무대예요. 조치원에서 쌓은 추억이 가장 많은 사람일지도 몰라요.",
    tags: ["#정_많은_구름", "#학교가_좋아", "#야식_파티"],
    tip: "가끔은 친구들과 원도심이나 전통시장까지 원정을 떠나보세요. 익숙한 사람과 낯선 풍경, 최고의 조합이에요.",
    match: "OSE",
    colors: ["#ffd88a", "#ffecc0"],
  },
  HTE: {
    code: "HTE",
    name: "기숙사 야식 구름",
    tagline: "“여기 진짜 할 거 없다” 토크로 밤을 새우는 사이",
    description:
      "친구들과 방에 모여 수다 떠는 게 최고의 힐링. 조치원에 아쉬운 점은 많지만, 함께 투덜댈 친구가 있어서 버틸 만해요. 배달 앱 속 조치원은 이미 전부 섭렵했죠.",
    tags: ["#배달앱_VIP", "#새벽수다", "#아쉬움_토론회"],
    tip: "투덜대던 아이디어를 모아보세요. 당신들이 원하는 공간이 바로 조치원에 필요한 공간이에요.",
    match: "OSL",
    colors: ["#ffadd0", "#ffd6e8"],
  },
  HSL: {
    code: "HSL",
    name: "원룸 포근 구름",
    tagline: "조용한 조치원의 속도가 딱 내 속도",
    description:
      "내 방, 내 이불, 내 루틴이 가장 소중한 평화주의자. 북적이지 않는 조치원의 고요함을 은근히 좋아해요. 혼자 있는 시간에 에너지를 차곡차곡 모으는 타입이에요.",
    tags: ["#집이_최고", "#루틴_장인", "#조용한_행복"],
    tip: "하루 10분, 집 앞 골목 산책을 루틴에 넣어보세요. 포근한 구름에게도 햇볕은 필요해요.",
    match: "OTL",
    colors: ["#a9d4ff", "#d8ecff"],
  },
  HSE: {
    code: "HSE",
    name: "이불 속 안개 구름",
    tagline: "이불 밖은 위험해, 주말엔 본가로 순간이동",
    description:
      "평일엔 이불 속에서 조용히, 주말엔 본가로 훌쩍. 조치원은 아직 ‘잠시 머무는 곳’처럼 느껴질 수 있어요. 하지만 안개가 걷히면 의외의 풍경이 보일지도 몰라요.",
    tags: ["#본가_러버", "#이불_요새", "#충전_중"],
    tip: "무리하지 않아도 돼요. 마음이 내킬 때 가까운 카페 한 곳부터 ‘나만의 장소’로 만들어보세요.",
    match: "OTE",
    colors: ["#b9b6dd", "#e2e0f3"],
  },
};

export interface Weather {
  key: "sunny" | "partly" | "cloudy" | "rain";
  label: string;
  message: string;
}

export const WEATHERS: Weather[] = [
  { key: "sunny", label: "맑음", message: "마음 하늘이 맑아요. 지금의 리듬을 잘 지켜주세요." },
  { key: "partly", label: "구름 조금", message: "가끔 구름이 끼지만 햇살도 충분해요. 틈틈이 쉬어가요." },
  { key: "cloudy", label: "흐림", message: "요즘 좀 지쳐 있었군요. 잠깐 멈춰 숨 고를 시간이 필요해요." },
  { key: "rain", label: "소나기", message: "많이 버텨왔네요. 혼자 견디지 말고, 주변이나 학생상담센터에 기대도 괜찮아요." },
];

const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : v == null ? [] : [String(v)]);
const num = (v: unknown) => (v == null || v === "" ? NaN : Number(v));

/** CBI Personal Burnout: 0~100 (응답 문항 평균). 응답 없으면 null */
export function burnoutScore(a: Answers): number | null {
  const vals = ["q16", "q17", "q18", "q19", "q20", "q21"].map((k) => num(a[k])).filter((n) => !Number.isNaN(n));
  if (!vals.length) return null;
  return Math.round((vals.reduce((s, n) => s + n, 0) / vals.length) * 10) / 10;
}

export function weatherFor(score: number | null): Weather {
  if (score == null) return WEATHERS[1];
  if (score < 25) return WEATHERS[0];
  if (score < 50) return WEATHERS[1];
  if (score < 75) return WEATHERS[2];
  return WEATHERS[3];
}

/** 각 축에 대해 0~100 (50 이상이면 앞 글자) */
export function axisScores(a: Answers): [number, number, number] {
  const q6 = arr(a.q6);
  const q23 = arr(a.q23);
  const q281 = arr(a.q28_1);

  // O / H — 활동 반경
  let out = 0;
  out += ({ "거의 매일": 3, "주 3~4회": 2, "주 1~2회": 1, "거의 외출하지 않는다": 0 } as Record<string, number>)[String(a.q7)] ?? 1;
  out += ({ "자주 이용하는 공간이 있다": 2, "가끔 이용하는 공간이 있다": 1 } as Record<string, number>)[String(a.q8)] ?? 0;
  if (q6.some((x) => ["학교 주변 카페 및 식당", "조치원 원도심", "세종시 시내 (나성동, 어진동, 도담동 등)"].includes(x))) out += 1;
  if (q6.includes("자취방 또는 기숙사")) out -= 1;
  out += q23.filter((x) => ["산책이나 운동을 한다", "카페 및 공원 등 외부 공간에 나간다", "조치원 외 다른 지역으로 이동한다", "취미나 여가활동을 한다"].includes(x)).length * 0.75;
  if (q23.includes("혼자 쉬거나 잠을 잔다")) out -= 0.5;
  const outPct = clamp(((out + 1.5) / 8) * 100); // 대략 -1.5 ~ 6.5 범위를 0~100으로

  // T / S — 함께 vs 혼자
  let together = 0;
  if (q23.includes("친구나 지인을 만난다")) together += 2;
  if (q23.includes("혼자 쉬거나 잠을 잔다")) together -= 1;
  if (q23.includes("스마트폰, 영상, SNS, 게임 등을 하며 시간을 보낸다")) together -= 0.5;
  if (q6.includes("교내 공간(도서관, 동아리방, 과방 등)")) together += 0.5;
  if (q6.includes("학교 주변 카페 및 식당")) together += 0.5;
  if (q281.includes("다른 학생들과 함께하는 교류 프로그램")) together += 1;
  if (q281.includes("휴식 및 마음건강 프로그램") && !q23.includes("친구나 지인을 만난다")) together -= 0.25;
  const togetherPct = clamp(((together + 1.75) / 5.75) * 100);

  // L / E — 조치원에 머묾 vs 떠남
  const env = ["q9", "q10", "q11", "q12", "q13", "q14", "q15"].map((k) => num(a[k])).filter((n) => !Number.isNaN(n));
  const envMean = env.length ? env.reduce((s, n) => s + n, 0) / env.length : 3;
  let stay = (envMean - 2.5) * 1.2; // 조치원 인식은 전반적으로 낮게 나오는 경향을 보정
  stay += ({ "거의 매주 머문다": 0.8, "한 달에 2~3회 정도 머문다": 0.3, "한 달에 1회 정도 머문다": -0.3, "거의 머물지 않는다": -0.8 } as Record<string, number>)[String(a.q5)] ?? 0;
  if (q6.includes("세종시 시내 (나성동, 어진동, 도담동 등)")) stay -= 0.6;
  if (q6.includes("조치원 원도심")) stay += 0.5;
  if (q23.includes("조치원 외 다른 지역으로 이동한다")) stay -= 0.6;
  const stayPct = clamp(((stay + 2.5) / 5) * 100);

  return [Math.round(outPct), Math.round(togetherPct), Math.round(stayPct)];
}

export function typeCode(a: Answers): string {
  const [o, t, l] = axisScores(a);
  return (o >= 50 ? "O" : "H") + (t >= 50 ? "T" : "S") + (l >= 50 ? "L" : "E");
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, n));
}
