// 설문 문항 정의 — 문항 문구는 연구 타당성을 위해 최신 설문지 원안을 그대로 유지합니다.
// (나이 문항만 설문지 외에 추가된 문항입니다.)

export type QuestionType = "single" | "multi" | "likert" | "freq" | "text" | "longtext" | "number";

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
  /** 단일선택 문항을 5단계 점 슬라이더로 표시 */
  scale?: boolean;
  showIf?: (a: Answers) => boolean;
}

export const SECTIONS: Record<number, { title: string; sky: string }> = {
  1: { title: "기본 정보", sky: "새벽" },
  2: { title: "거주 및 생활패턴", sky: "아침" },
  3: { title: "조치원 생활환경 인식", sky: "한낮" },
  4: { title: "피로 및 소진 경험", sky: "오후" },
  5: { title: "인식 및 대처", sky: "늦은 오후" },
  6: { title: "이동 및 안전 환경", sky: "해질녘" },
  7: { title: "프로그램 수요 · 자유의견", sky: "저녁" },
  8: { title: "후속 인터뷰", sky: "밤" },
};

export const LIKERT_LABELS = [
  "전혀 그렇지 않다",
  "그렇지 않은 편이다",
  "보통이다",
  "그런 편이다",
  "매우 그렇다",
];

export const FREQ_OPTIONS: Option[] = [
  { value: "0", label: "전혀 또는 거의 없다" },
  { value: "25", label: "드물다" },
  { value: "50", label: "가끔 있다" },
  { value: "75", label: "자주 있다" },
  { value: "100", label: "항상 또는 거의 항상 있다" },
];

const o = (label: string, other = false): Option => ({ value: label, label, other });
const etc = () => o("기타", true);

const has = (a: Answers, id: string, ...vals: string[]) => {
  const v = a[id];
  if (Array.isArray(v)) return vals.some((x) => v.includes(x));
  return vals.includes(String(v));
};

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
    options: [
      o("자주 이용하는 공간이 있다"), o("가끔 이용하는 공간이 있다"),
      o("알고 있는 공간은 있지만 거의 이용하지 않는다"), o("이용할 만한 공간을 잘 알지 못한다"),
    ],
  },
  {
    id: "q8_1", number: "8-1", section: 2, type: "multi",
    text: "이용하는 공간이 있다면 어떤 곳인가요?",
    hint: "복수 선택 가능",
    showIf: (a) => has(a, "q8", "자주 이용하는 공간이 있다", "가끔 이용하는 공간이 있다"),
    options: [
      o("카페"), o("공원 및 산책로"), o("운동시설"), o("영화, 공연, 전시 등 문화시설"),
      o("쇼핑 공간"), o("스터디 및 커뮤니티 공간"), etc(),
    ],
  },

  // 3. 조치원 생활환경 인식
  ...[
    ["q9", "9", "조치원에는 대학생이 일상적으로 이용할 수 있는 문화 및 여가 공간이 충분하다고 느낀다."],
    ["q10", "10", "조치원에서는 수업이나 과제 외에 할 수 있는 활동이 다양하다고 느낀다."],
    ["q11", "11", "조치원에서 기분 전환을 위해 가볍게 방문할 수 있는 공간을 찾기 쉽다."],
    ["q12", "12", "조치원에서 생활할 때 이동하거나 활동하는 공간이 다양하다고 느낀다."],
    ["q13", "13", "주말에도 학교 주변이나 조치원 지역에서 사람들의 활동이 활발하다고 느낀다."],
    ["q14", "14", "조치원에서 생활하면서 새로운 활동이나 경험을 접할 기회가 충분하다고 느낀다."],
    ["q15", "15", "전반적으로 조치원의 생활환경에 만족한다."],
  ].map(([id, number, text]) => ({
    id, number, text, section: 3, type: "likert" as const,
  })),

  // 4. 일반적 피로 및 소진 경험 (CBI Personal Burnout)
  ...[
    ["q16", "16", "평소 피곤하다고 느끼는 경우가 얼마나 자주 있습니까?"],
    ["q17", "17", "신체적으로 지쳐 있다고 느끼는 경우가 얼마나 자주 있습니까?"],
    ["q18", "18", "정서적으로 지쳐 있다고 느끼는 경우가 얼마나 자주 있습니까?"],
    ["q19", "19", "\"더 이상 감당하기 힘들다\"고 느끼는 경우가 얼마나 자주 있습니까?"],
    ["q20", "20", "완전히 녹초가 되었다고 느끼는 경우가 얼마나 자주 있습니까?"],
    ["q21", "21", "몸이 약해졌거나 쉽게 아플 것 같다고 느끼는 경우가 얼마나 자주 있습니까?"],
  ].map(([id, number, text]) => ({
    id, number, text, section: 4, type: "freq" as const, options: FREQ_OPTIONS,
  })),

  // 5. 인식 및 대처
  {
    id: "q22", number: "22", section: 5, type: "multi",
    text: "평소 피로하거나 지쳐 있다고 느낄 때, 어떤 요인이 영향을 미친다고 생각하나요?",
    hint: "복수 선택 가능",
    options: [
      o("학업 및 과제 부담"), o("수면 부족"), o("개인적인 고민이나 스트레스"), o("인간관계"),
      o("경제적 부담"), o("반복적인 생활패턴"), o("활동하거나 머물 수 있는 공간의 부족"),
      o("이동 및 교통의 불편"), o("특별한 원인을 생각해 본 적 없다"), etc(),
    ],
  },
  {
    id: "q23", number: "23", section: 5, type: "multi",
    text: "피로하거나 무기력하다고 느낄 때 주로 어떻게 대처하나요?",
    hint: "복수 선택 가능",
    options: [
      o("혼자 쉬거나 잠을 잔다"), o("스마트폰, 영상, SNS, 게임 등을 하며 시간을 보낸다"),
      o("친구나 지인을 만난다"), o("산책이나 운동을 한다"), o("카페 및 공원 등 외부 공간에 나간다"),
      o("조치원 외 다른 지역으로 이동한다"), o("취미나 여가활동을 한다"), o("특별히 대처하지 않는다"), etc(),
    ],
  },

  // 6. 조치원 이동 및 안전 환경 평가
  {
    id: "q24", number: "24", section: 6, type: "likert",
    text: "조치원 내 대중교통 및 이동 여건에 전반적으로 만족한다.",
  },
  {
    id: "q25", number: "25", section: 6, type: "multi",
    text: "조치원에서 이동 시 가장 불편하다고 느끼는 점은 무엇인가요?",
    hint: "복수 선택 가능",
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
    id: "q26", number: "26", section: 6, type: "likert",
    text: "조치원의 보행 및 야간 환경이 안전하게 관리되고 있다고 느낀다.",
  },
  {
    id: "q27", number: "27", section: 6, type: "multi",
    text: "조치원에서 이동하거나 생활할 때 가장 위협/불안을 느끼는 요인은 무엇인가요?",
    hint: "복수 선택 가능",
    options: [
      o("가로등이 어둡거나 적어 야간 보행 시 위험함"),
      o("인도 정비 불량 (인도와 차도 구분 불분명, 보도블록 파손, 수풀 무성함)"),
      o("불법 주정차 차량으로 인한 통행 위험"),
      o("야간 취객, 노상 소란, 쓰레기 방치 등으로 인한 치안 불안"),
      o("공사 현장 안전 펜스 미비 또는 도로변 자재 방치"),
      etc(),
    ],
  },

  // 7. 생활환경 개선 및 프로그램 수요 / 자유의견
  {
    id: "q28", number: "28", section: 7, type: "single", scale: true,
    text: "조치원에서 일상적인 기분 전환이나 외부 활동을 돕는 프로그램이 운영된다면 참여할 의향이 있나요?",
    options: [
      { value: "1", label: "전혀 참여할 의향이 없다" },
      { value: "2", label: "참여할 의향이 별로 없다" },
      { value: "3", label: "보통이다" },
      { value: "4", label: "참여할 의향이 있다" },
      { value: "5", label: "매우 참여할 의향이 있다" },
    ],
  },
  {
    id: "q28_1", number: "28-1", section: 7, type: "multi",
    text: "다음과 같은 프로그램이 있다면 참여하고 싶은 프로그램을 선택해주세요.",
    hint: "복수 선택 가능",
    options: [
      o("산책 및 걷기 프로그램"), o("조치원 지역 탐방 프로그램"), o("소규모 취미 및 문화 활동"),
      o("지역 학생들간의 협력 및 교류 프로그램"), o("휴식 및 마음건강 프로그램"),
      o("앱 또는 웹 기반 미션형 프로그램"), o("지역 상점 및 문화공간과 연계한 프로그램"), etc(),
    ],
  },
  {
    id: "q29", number: "29", section: 7, type: "longtext", optional: true,
    text: "조치원에서 생활하면서 '이런 공간이나 프로그램이 있으면 좋겠다'고 생각한 것이 있다면 자유롭게 적어주세요.",
    placeholder: "예) 밤늦게까지 여는 조용한 스터디 카페, 조천 따라 걷는 러닝 크루…",
  },
  {
    id: "q30", number: "30", section: 7, type: "text", optional: true,
    text: "조치원을 한 단어로 표현한다면?",
    placeholder: "한 단어로 적어주세요",
  },

  // 8. 후속 인터뷰 참여
  {
    id: "q31", number: "31", section: 8, type: "single",
    text: "본 설문과 관련한 후속 인터뷰에 참여할 의향이 있나요?",
    options: [o("있다"), o("없다")],
  },
];

/** 시작 화면에서 받는 소속 학교 */
export const SCHOOLS = ["고려대학교", "홍익대학교"] as const;

export const visibleQuestions = (a: Answers) => QUESTIONS.filter((q) => !q.showIf || q.showIf(a));

export const etcKey = (id: string) => `${id}_etc`;
