// 설문 문항 정의 — 문항 문구는 연구 타당성을 위해 최종 설문지 원안을 그대로 유지합니다.
// (나이 문항만 설문지 외에 추가된 문항입니다.)

export type QuestionType = "single" | "multi" | "likert" | "text" | "longtext" | "number";

export interface Option {
  value: string;
  label: string;
  /** 선택 시 "기타" 자유 입력란을 띄움 */
  other?: boolean;
}

export type AnswerValue = string | string[] | number;
export type Answers = Record<string, AnswerValue | undefined>;

export interface Question {
  id: string;
  /** 설문지 문항 번호 (설문지 외 추가 문항은 빈 문자열) */
  number: string;
  section: number;
  text: string;
  hint?: string;
  type: QuestionType;
  options?: Option[];
  max?: number;
  optional?: boolean;
  placeholder?: string;
  /** number 문항의 단위 (예: 세) */
  unit?: string;
  /** 단일선택 문항을 가로 점 슬라이더로 표시 */
  scale?: boolean;
  showIf?: (a: Answers) => boolean;
}

/** 응답이 어느 설문지 버전으로 수집됐는지 (문항 번호의 뜻이 버전마다 다름) */
export const SURVEY_VERSION = 2;

export const SECTIONS: Record<number, { title: string; sky: string; intro?: string }> = {
  1: { title: "기본 정보", sky: "새벽" },
  2: { title: "거주 및 생활패턴", sky: "아침" },
  3: { title: "조치원 생활환경 인식", sky: "한낮", intro: "다음 문항은 조치원에서 생활하면서 느끼는 환경에 관한 질문입니다." },
  4: { title: "일반 피로 측정", sky: "오후", intro: "최근 몇 달 동안의 경험을 떠올리며, 각 문항에 얼마나 동의하는지 선택해주세요." },
  5: { title: "일상 의욕 및 동기 경험", sky: "늦은 오후", intro: "최근 2주 동안의 자신을 떠올리며, 각 문항이 자신에게 얼마나 해당하는지 선택해주세요." },
  6: { title: "인식 및 대처", sky: "해 질 무렵" },
  7: { title: "조치원 이동 및 안전 환경 평가", sky: "해질녘", intro: "다음 문항은 조치원의 생활환경, 교통, 보행, 야간 안전 등에 관한 질문입니다." },
  8: { title: "생활환경 개선 및 프로그램 수요 / 자유의견", sky: "저녁" },
  9: { title: "후속 인터뷰 참여", sky: "밤" },
};

export const LIKERT_LABELS = [
  "전혀 그렇지 않다",
  "그렇지 않은 편이다",
  "보통이다",
  "그런 편이다",
  "매우 그렇다",
];

/** 값이 "1", "2", … 인 척도 보기 */
const scaleOpts = (labels: string[]): Option[] => labels.map((label, i) => ({ value: String(i + 1), label }));

export const AGREE4_OPTIONS = scaleOpts(["전혀 동의하지 않는다", "동의하지 않는다", "동의한다", "매우 동의한다"]);
export const MOTIVE5_OPTIONS = scaleOpts(["전혀 그렇지 않다", "대체로 그렇지 않다", "어느 쪽도 아니다", "대체로 그렇다", "완전히 그렇다"]);
const STATE5_OPTIONS = scaleOpts(["매우 나빴다", "나빴다", "보통이었다", "좋았다", "매우 좋았다"]);

const o = (label: string, other = false): Option => ({ value: label, label, other });
const etc = () => o("기타", true);

const has = (a: Answers, id: string, ...vals: string[]) => {
  const v = a[id];
  if (Array.isArray(v)) return vals.some((x) => v.includes(x));
  return vals.includes(String(v));
};
/** 1~5점 문항에서 1·2점(부정)을 고른 경우 */
const low = (a: Answers, id: string) => {
  const n = Number(a[id]);
  return n === 1 || n === 2;
};

const MULTI = "복수 선택 가능";

export const QUESTIONS: Question[] = [
  // 1. 기본 정보
  {
    id: "age", number: "", section: 1, type: "number", unit: "세",
    text: "나이는 어떻게 되나요?",
    placeholder: "21",
  },
  {
    id: "q1", number: "1", section: 1, type: "single",
    text: "현재 학년은 무엇인가요?",
    options: [o("1학년"), o("2학년"), o("3학년"), o("4학년"), o("5학년 이상 / 초과학기"), etc()],
  },
  {
    id: "q2", number: "2", section: 1, type: "single",
    text: "소속 단과대학 또는 전공 계열은 무엇인가요?",
    options: [o("인문 및 사회계열"), o("자연 및 과학계열"), o("공학계열"), o("예체능계열"), etc()],
  },
  {
    id: "q3", number: "3", section: 1, type: "single",
    text: "성별은 무엇인가요?",
    options: [o("여성"), o("남성"), etc()],
  },

  // 2. 거주 및 생활패턴
  {
    id: "q4", number: "4", section: 2, type: "single",
    text: "현재 거주 형태는 무엇인가요?",
    options: [
      o("자취(원룸, 빌라, 오피스텔 등)"), o("기숙사"), o("본가에서 통학"),
      o("친척 및 지인과 거주"), etc(),
    ],
  },
  {
    id: "q5", number: "5", section: 2, type: "single",
    text: "학기 중 주말(토, 일)에 조치원에 머무르는 빈도는 어느 정도인가요?",
    options: [
      o("거의 매주 머문다"), o("한 달에 2~3회 정도 머문다"), o("한 달에 1회 정도 머문다"),
      o("거의 머물지 않는다"), etc(),
    ],
  },
  {
    id: "q6", number: "6", section: 2, type: "multi", max: 2,
    text: "수업이나 과제가 끝난 평일 저녁, 주로 시간을 보내는 장소는 어디인가요?",
    hint: "복수 선택 가능, 최대 2개",
    options: [
      o("자취방 또는 기숙사"), o("교내 공간(도서관, 동아리방, 과방 등)"), o("학교 주변 카페 및 식당"),
      o("조치원 원도심"), o("세종시 시내 (나성동, 어진동, 도담동 등)"), etc(),
    ],
  },
  {
    id: "q7", number: "7", section: 2, type: "single",
    text: "수업이나 필수 일정 외에 외출하는 빈도는 어느 정도인가요?",
    options: [o("거의 매일"), o("주 3~4회"), o("주 1~2회"), o("거의 외출하지 않는다")],
  },
  {
    id: "q8", number: "8", section: 2, type: "single",
    text: "평소 조치원에서 학교를 제외하고 자주 이용하는 문화 및 여가 공간이 있나요?",
    options: [o("자주 이용하는 공간이 있다"), o("가끔 이용하는 공간이 있다"), o("거의 이용하는 공간이 없다")],
  },
  {
    id: "q8_1", number: "8-1", section: 2, type: "multi",
    text: "학교를 제외하고, 조치원에서 자주 이용하는 문화 및 여가 공간은 어디인가요?",
    hint: MULTI,
    showIf: (a) => has(a, "q8", "자주 이용하는 공간이 있다"),
    options: [
      o("카페"), o("공원 및 산책로"), o("운동시설"), o("영화, 공연, 전시 등 문화시설"),
      o("쇼핑 공간"), o("스터디 및 커뮤니티 공간"), etc(),
    ],
  },
  {
    id: "q8_2", number: "8-2", section: 2, type: "longtext", optional: true,
    text: "조치원 내 문화 및 여가 공간을 자주 이용하지 않는 이유를 자유롭게 작성해주세요.",
    showIf: (a) => has(a, "q8", "가끔 이용하는 공간이 있다", "거의 이용하는 공간이 없다"),
  },

  // 3. 조치원 생활환경 인식 (1~5점)
  ...[
    ["q9", "9", "조치원에는 일상적으로 이용할 수 있는 녹지나 산책공간이 충분하다."],
    ["q10", "10", "조치원에는 대학생이 참여할 수 있는 문화 및 여가의 활동 기회가 충분하다."],
    ["q11", "11", "조치원에는 대학생이 일상적으로 이용할 수 있는 생활 편의시설이 충분하다."],
    ["q12", "12", "주말에도 학교 주변이나 조치원 지역에서 사람들의 활동이 활발하다고 느낀다."],
    ["q13", "13", "전반적으로 조치원의 생활환경에 만족한다."],
  ].map(([id, number, text]) => ({ id, number, text, section: 3, type: "likert" as const })),

  // 4. 일반 피로 측정 (4점: 전혀 동의하지 않는다 ~ 매우 동의한다)
  ...[
    ["q14", "14", "내 삶의 많은 활동은 즐겁다."],
    ["q15", "15", "최근 나는 많은 경험이 나를 불행하게 만든다고 느낀다."],
    ["q16", "16", "나는 전반적으로 시간을 보내는 방식에 매우 만족한다."],
    ["q17", "17", "나는 내 삶에서 즐거움을 쉽게 찾을 수 있다."],
    ["q18", "18", "다른 사람들은 더 충만한 삶을 사는 것 같다."],
    ["q19", "19", "예전에는 즐거웠던 활동이 더 이상 만족스럽지 않다."],
    ["q20", "20", "나에게 즐거움을 줄 취미를 더 찾을 수 있으면 좋겠다."],
    ["q21", "21", "나는 내가 이룬 성취에 만족한다."],
    ["q22", "22", "내 삶은 지루하다."],
    ["q23", "23", "내가 참여하는 활동은 대체로 긍정적인 결과로 이어진다."],
  ].map(([id, number, text]) => ({
    id, number, text, section: 4, type: "single" as const, scale: true, options: AGREE4_OPTIONS,
    hint: SECTIONS[4].intro,
  })),

  // 5. 일상 의욕 및 동기 경험 (5점: 전혀 그렇지 않다 ~ 완전히 그렇다)
  ...[
    ["q24", "24", "나는 나쁜 소식을 들으면 슬프거나 속상하다."],
    ["q25", "25", "나는 잘 모르는 사람에게도 먼저 말을 건다."],
    ["q26", "26", "나는 처음 만난 사람들과 함께 무언가를 하는 것이 즐겁다."],
    ["q27", "27", "나는 친구들과 함께 할 활동을 제안한다."],
    ["q28", "28", "나는 망설임 없이 확고하게 결정을 내린다."],
    ["q29", "29", "나는 결정을 내린 뒤, 잘못된 선택을 한 것은 아닌지 생각한다."],
    ["q30", "30", "나는 내가 아끼는 사람들이 나를 어떻게 생각하는지 매우 신경 쓴다."],
    ["q31", "31", "나는 매주 친구들과 함께 외출한다."],
    ["q32", "32", "나는 무언가를 하기로 결정하면 어렵지 않게 노력을 기울일 수 있다."],
    ["q33", "33", "나는 빈둥거리는 것을 좋아하지 않는다."],
    ["q34", "34", "나는 다른 사람이 일깨워 주지 않아도 해야 할 일을 제때 처리한다."],
    ["q35", "35", "나는 무언가를 하기로 결정하면 끝까지 해내려는 의욕이 있다."],
    ["q36", "36", "나는 배려 없는 말을 하면 마음이 몹시 불편하다."],
    ["q37", "37", "나는 누가 시키지 않아도 먼저 대화를 시작한다."],
    ["q38", "38", "나는 해야 할 일이 있으면 바로 처리한다."],
    ["q39", "39", "나는 아는 사람이 사고를 당하거나 아프다는 소식을 들으면 마음이 좋지 않다."],
    ["q40", "40", "나는 여러 활동 중 무엇을 할지 고르는 것이 즐겁다."],
    ["q41", "41", "나는 누군가에게 불쾌하게 대했다는 것을 깨달으면 이후에 심한 죄책감을 느낀다."],
  ].map(([id, number, text]) => ({
    id, number, text, section: 5, type: "single" as const, scale: true, options: MOTIVE5_OPTIONS,
    hint: SECTIONS[5].intro,
  })),

  // 6. 인식 및 대처
  {
    id: "q42", number: "42", section: 6, type: "multi",
    text: "평소 피로하거나 무기력하다고 느낄 때, 어떤 요인이 영향을 미친다고 생각하나요?",
    hint: MULTI,
    options: [
      o("학업 부담"), o("수면 부족"), o("인간관계"), o("경제적 부담"),
      o("활동하거나 머물 수 있는 공간의 부족"), o("이동 및 교통의 불편"),
      o("문화 및 여가 활동 기회의 부족"), o("지역 내 사람들과 교류할 기회의 부족"),
      o("특별한 원인을 생각해 본 적 없다"), etc(),
    ],
  },
  {
    id: "q42_1", number: "42-1", section: 6, type: "single", scale: true, options: STATE5_OPTIONS,
    text: "최근 한달 간 전반적인 수면 상태는 어떠했나요?",
  },
  {
    id: "q42_2", number: "42-2", section: 6, type: "single", scale: true, options: STATE5_OPTIONS,
    text: "최근 한달 간 경제적 부담은 어느 정도였나요?",
  },
  {
    id: "q42_3", number: "42-3", section: 6, type: "single", scale: true, options: STATE5_OPTIONS,
    text: "최근 한달 간 학업 부담은 어느정도였나요?",
  },
  {
    id: "q43", number: "43", section: 6, type: "multi",
    text: "피로하거나 무기력하다고 느낄 때 주로 어떻게 대처하나요?",
    hint: MULTI,
    options: [
      o("혼자 쉬거나 잠을 잔다"), o("스마트폰, 영상, SNS, 게임 등을 하며 시간을 보낸다"),
      o("친구나 지인을 만난다"), o("산책이나 운동을 한다"), o("카페 및 공원 등 외부 공간에 나간다"),
      o("조치원 외 다른 지역으로 이동한다"), o("취미나 여가활동을 한다"), o("특별히 대처하지 않는다"), etc(),
    ],
  },

  // 7. 조치원 이동 및 안전 환경 평가
  {
    id: "q44", number: "44", section: 7, type: "likert",
    text: "조치원 내 대중교통 및 이동 여건에 전반적으로 만족한다.",
  },
  {
    id: "q44_1", number: "44-1", section: 7, type: "multi",
    text: "조치원에서 이동 시 가장 불편하다고 느끼는 점은 무엇인가요?",
    hint: MULTI,
    showIf: (a) => low(a, "q44"),
    options: [
      o("버스 배차 간격이 길거나 노선이 부족"),
      o("택시 잡기가 어렵거나 이용이 불편함"),
      o("타 지역(신도심, 대전, 천안 등)으로 나가는 대중교통 연결이 불편함"),
      o("자전거 및 개인형 이동장치(킥보드 등) 도로/주차 환경 불량"),
      o("버스 정류장 시설 불량 및 실시간 도착 정보(BIS) 부정확"),
      etc(),
    ],
  },
  {
    id: "q45", number: "45", section: 7, type: "likert",
    text: "조치원의 보행 및 야간 환경이 안전하게 관리되고 있다고 느낀다.",
  },
  {
    id: "q46", number: "46", section: 7, type: "multi",
    text: "조치원에서 이동하거나 생활할 때 가장 위협/불안을 느끼는 요인은 무엇인가요?",
    hint: MULTI,
    showIf: (a) => low(a, "q45"),
    options: [
      o("가로등이 어둡거나 적어 야간 보행 시 위험함"),
      o("인도 정비 불량 (인도와 차도 구분 불분명, 보도블록 파손, 수풀 무성함)"),
      o("불법 주정차 차량으로 인한 통행 위험"),
      o("야간 취객, 노상 소란, 쓰레기 방치 등으로 인한 치안 불안"),
      o("공사 현장 안전 펜스 미비 또는 도로변 자재 방치"),
      etc(),
    ],
  },

  // 8. 생활환경 개선 및 프로그램 수요 / 자유의견
  {
    id: "q47", number: "47", section: 8, type: "single", scale: true,
    text: "조치원에서 일상적인 기분 전환이나 외부 활동을 돕는 프로그램이 운영된다면 참여할 의향이 있나요?",
    options: scaleOpts([
      "전혀 참여할 의향이 없다", "참여할 의향이 별로 없다", "보통이다", "참여할 의향이 있다", "매우 참여할 의향이 있다",
    ]),
  },
  {
    id: "q47_1", number: "47-1", section: 8, type: "multi",
    text: "기분 전환 혹은 외부활동을 위한 프로그램에 참여할 의향이 없는 주된 이유는 무엇인가요?",
    hint: MULTI,
    showIf: (a) => low(a, "q47"),
    options: [
      o("활동이나 프로그램에 대한 정보를 얻기 어려워서"),
      o("참여 비용이 부담되어서"),
      o("참여할 시간이 부족해서"),
      o("활동 장소까지 이동하기 어려워서"),
      o("관심 있는 활동이나 프로그램이 없어서"),
      o("참여할 필요성을 느끼지 않아서"),
    ],
  },
  {
    id: "q48", number: "48", section: 8, type: "multi",
    text: "다음과 같은 프로그램이 있다면 참여하고 싶은 프로그램을 선택해주세요.",
    hint: MULTI,
    options: [
      o("산책 및 걷기 프로그램"), o("조치원 지역 탐방 프로그램"), o("소규모 취미 및 문화 활동"),
      o("지역 학생들간의 협력 및 교류 프로그램"), o("휴식 및 마음건강 프로그램"),
      o("앱 또는 웹 기반 미션형 프로그램"), o("지역 상점 및 문화공간과 연계한 프로그램"), etc(),
    ],
  },
  {
    id: "q49", number: "49", section: 8, type: "longtext", optional: true,
    text: "조치원에서 생활하면서 '이런 공간이나 프로그램이 있으면 좋겠다'고 생각한 것이 있다면 자유롭게 적어주세요.",
    placeholder: "자유롭게 적어주세요",
  },
  {
    id: "q50", number: "50", section: 8, type: "text", optional: true,
    text: "조치원을 한 단어로 표현한다면?",
    placeholder: "한 단어로 적어주세요",
  },

  // 9. 후속 인터뷰 참여
  {
    id: "q51", number: "51", section: 9, type: "single",
    text: "본 설문과 관련한 후속 인터뷰에 참여할 의향이 있나요?",
    options: [o("있다"), o("없다")],
  },
];

/** 시작 화면에서 받는 소속 학교 */
export const SCHOOLS = ["고려대학교", "홍익대학교"] as const;

export const visibleQuestions = (a: Answers) => QUESTIONS.filter((q) => !q.showIf || q.showIf(a));

export const etcKey = (id: string) => `${id}_etc`;
