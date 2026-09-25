-- 조치원 구름 설문 — Supabase 스키마
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 실행하세요.

create table if not exists public.survey_responses (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  student_id       text,               -- 개인정보 수집·이용 동의 시에만 저장
  phone            text,               -- 개인정보 수집·이용 동의 시에만 저장
  consent_personal boolean not null default false,
  answers          jsonb not null,     -- { "q1": "1학년", "q6": ["..."], "q9": 3, "q2_etc": "..." }
  type_code        text not null,      -- 구름 유형 (예: OSL)
  burnout_score    numeric,            -- CBI Personal Burnout 0~100
  duration_sec     integer
);

create index if not exists survey_responses_created_at_idx on public.survey_responses (created_at desc);

-- RLS 켜기: 정책을 하나도 만들지 않으므로 anon/authenticated 키로는 읽기·쓰기가 불가능합니다.
-- 서버(Next.js API)만 service_role 키로 접근합니다.
alter table public.survey_responses enable row level security;
