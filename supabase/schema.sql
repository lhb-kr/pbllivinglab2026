-- 조치원 구름 설문 — Supabase 스키마
-- 관리자 화면(/admin)의 "테이블 만들기" 버튼이 같은 SQL을 실행합니다.
-- 버튼을 쓸 수 없으면 Supabase 대시보드 → SQL Editor 에 붙여넣고 실행하세요.
-- (lib/schema.ts 와 같은 내용입니다.)

create table if not exists public.survey_responses (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  name             text,
  phone            text,
  school           text,
  consent_personal boolean not null default false,
  answers          jsonb not null,
  type_code        text not null,
  burnout_score    numeric,
  duration_sec     integer
);

-- 이전 버전(학번 수집) 테이블을 쓰고 있었다면 새 칼럼을 추가
alter table public.survey_responses add column if not exists name text;
alter table public.survey_responses add column if not exists school text;

create index if not exists survey_responses_created_at_idx on public.survey_responses (created_at desc);

-- RLS: 정책을 만들지 않으므로 anon/authenticated 키로는 접근 불가, 서버(service_role)만 접근
alter table public.survey_responses enable row level security;

-- Supabase API가 새 테이블을 바로 인식하도록 스키마 캐시 새로고침
notify pgrst, 'reload schema';
