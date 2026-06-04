-- Life OS v0.9.8 — Todo 진행 추적 (오늘 버튼)
-- 2026-05-30
-- 실행: Supabase Dashboard > SQL Editor

ALTER TABLE todos
  ADD COLUMN IF NOT EXISTS last_progressed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS progress_count INT NOT NULL DEFAULT 0;

-- 기존 데이터: 진행 정보 없음 (NULL / 0) 그대로 유지
-- 새 컬럼 의미:
--   last_progressed_at = 마지막 "오늘" 버튼 누른 시각
--   progress_count     = "오늘" 누른 총 일수
