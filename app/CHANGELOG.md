# Life OS — Changelog

All notable changes to this project are documented here.

---

## v0.9.8 — 2026-05-30

### Added
- **Todo "오늘" 진행 버튼**: 며칠 걸리는 일회성 작업에 진행 기록 추가
  - 행 구조: `[제목+메타] [진행일수 배지] [오늘] [완료] [✕]`
  - "오늘" 누르면 `last_progressed_at` 갱신·`progress_count++`, 같은 날 다시 누르면 토글
  - "완료"는 기존 done 동작 그대로 → Done 섹션 이동
- **진행일수 배지**: 시작일 기준 N일째 표시 (Done 소요일 색상 규칙과 통일)
  - 진행 없음 = `—` 옅음 / 1~2일 = 회색 / 3~6일 = amber / 7일+ = red
- **DB**: `todos` 테이블에 `last_progressed_at TIMESTAMPTZ` · `progress_count INT` 2개 컬럼 추가 (`docs/migration_v0.9.8_todo_progress.sql`)

### UI
- 액션 간격 +5pt씩: 제목↔배지 15px, 배지↔오늘 11px, 오늘↔완료 11px (한 묶음 안에서도 호흡 확보)

### Stage 13 (Design History)
- v0.9.7 Stage 11의 "소요일·회고 picking" 흐름을 입력 측면(진행 기록)에서 보완. C안(라벨 버튼)을 베이스로 B안(진행일수)을 머지한 v2 시안 채택.

---

## v0.9.7 — 2026-05-25

### Added
- **Done 탭 소요일 메타**: 모든 완료 항목 아래 `created_at → completed_at + N일 배지` 표시
  - 색상 규칙: 당일=회색 조용히 / 1~2일=회색 / 3~6일=amber / 7일+=red 굵게
- **소팅 칩**: 날짜순 ↔ 기간순 토글 (통계 카드 아래)
- **회고 자동 picking**: 이번 주 7일+ 항목 최대 3건을 빨강 "오래 묵힌 일" 배너로 자동 노출
- **시안 문서**: `docs/done-duration-mockup.html` — BEFORE/AFTER + 기간순 소팅 + 메타 라인 디테일

### Changed
- **TodoList 완료 섹션**: 전체 누적 → **최근 7일 (오늘 포함)**만 표시. 1주일 지난 항목은 Done 탭에서만.

### Stage 11 (Design History)
- Daily 탭 무한 누적 문제 해결 + Done 탭 회고 가치 강화. DB 스키마 변경 없이 `todos.created_at` / `completed_at` 활용.

### Archive (별도 작업)
- `app-stage9` 워크트리 폐기 (폴더 이동으로 깨진 상태)
- `archive/stage-9-tip` 태그 생성 → `d36a576` 영구 보존
- `docs/archive/stage9-uncommitted-2026-05-25.tar.gz` (22KB, 미커밋 새 파일 50+개) + 복구 매뉴얼

---

## v0.9.4 — 2026-05-13

### Added
- **스케줄 삭제(✕)**: TODAY 각 일정 오른쪽에 삭제 버튼 — 중복/잘못된 항목 직접 제거
- **스케줄 건수 자동 갱신**: 삭제 시 "N건" 즉시 업데이트

### Changed
- **BottomNav 순서 변경**: 홈/하루/기록/설정 → **홈/기록/하루/설정** (기록이 더 자주 접근)

### Docs
- **Design History**: Stage 9 (v2.0 KILLED, 시안 19개 복원) + Stage 10 (v0.9.4 Before/After 시안)

---

## v0.9.3 — 2026-05-13

### Added
- **하루 메모리 시스템**: 사용자 프로필 + 주간 대화 요약 + 오늘 컨텍스트 강화
  - 프로필: 대학 교수, 코칭 전문가, 수면 7h 목표, 커피 관리
  - 오늘 컨텍스트: 스케줄/루틴/커피/투두 6개 테이블 병렬 조회
  - 주간 메모리: 최근 7일 대화 300자 요약 → 시스템 프롬프트에 포함
  - 맞춤 첫 인사: 시간대 + 스케줄 + 건강 기반 (AI 호출 없이 즉시)
- **홈 스케줄 체크 버튼**: 루틴/Todo처럼 완료 여부 토글 가능
- **Recommendation 삭제(✕)**: 각 항목 오른쪽에 삭제 버튼
- **Daily Review 분리**: "완료한 것 / 못한 것" → 2개 별도 입력 박스
- **Week 주간 네비게이션**: ← → 화살표로 이전주/다음주 이동
- **Week 타이틀**: "N월 N번째 주" 표시
- **수면 차트 기준선**: 7시간 위치에 점선 + "7h" 라벨
- **커피 차트 기준선**: 2잔 위치에 점선 + "2잔" 라벨
- **설정 버전 히스토리**: v0.1~v0.9.2 전체 업데이트 내역 표시

### Fixed
- **Google Calendar 시간 오류**: KST 이중 변환 → ISO 문자열에서 직접 HH:MM 추출
- **Google Calendar OAuth**: Vercel 환경변수 client_secret 끝 줄바꿈(\n) 제거
- **Google Calendar OAuth**: getServerSession에 authOptions 미전달 수정
- **Google Calendar OAuth**: Vercel 쿠키 prefix 불일치 해결 (cookie 6개 명시)
- **Google OAuth token 갱신**: access token 만료 시 refresh token으로 자동 갱신
- **Calendar 무한 호출**: sessionStorage로 1회만 실행
- **Calendar 중복 저장**: 날짜+제목+시간 3조건 체크 + limit(1)

### Changed
- **루틴**: "물 8잔 마시기" → "물 3잔 마시기"
- **max_tokens**: 300 → 600
- **Google Cloud**: vdiot07 계정 → tb6009@gmail.com 계정으로 재설정

### Database
- `schedules`: `done boolean DEFAULT false` 컬럼 추가
- `journal_entries`: `not_done_today text` 컬럼 추가

### Debug (Google Calendar — 8시간 디버깅 기록)
- 근본 원인: Vercel 환경변수 GOOGLE_CLIENT_SECRET 끝에 `\n` 1개
- 11번 시도, 10번 실패 → Vercel 런타임 로그에서 5분 만에 발견
- 상세 로그: docs/logs/20260509_google_calendar_debug_log.md

---

## v0.9.0 — 2026-05-09

### Added
- **커피 트래킹**: 기록 Today Health 섹션에 ＋/－ 스테퍼 (자동 저장)
- **커피 차트**: Week 바 차트 (보라=3잔이하, 노랑=4잔+), Month 30일 차트 (터치 데이터 표시)
- **커피 자동감지**: 하루 대화에서 "커피 N잔" → health_logs 자동 저장
- **Google Calendar 동기화**: /api/calendar 호출 시 Supabase schedules 테이블에 자동 저장 (중복 방지)
- **Todo 삭제(✕)**: 미완료/완료 항목 오른쪽에 삭제 버튼
- **Todo 시간 표시**: 생성 시간 (created_at) + 완료 시간 (completed_at 완료) 표시
- **디자인 진화 레포트**: docs/design-evolution-report.html (Stage 1~8 종합)

### Changed
- 버전 표기 v0.8.1 → v0.9.0

### Database
- `health_logs` 테이블: `coffee integer DEFAULT 0` 컬럼 추가
- `schedules` 테이블: `source varchar DEFAULT 'manual'` 컬럼 추가

---

## v0.8.0 — 2026-05-07

### Changed
- **텍스트 대비**: #b3b3b3(2.6:1) → #6B7280(4.6:1) — 77곳 일괄 교체
- **최소 폰트**: 0.55~0.65rem → 0.7rem 전체 상향
- **섹션 간격**: 라벨 margin-top 24px 통일 (내부 행간은 축소)
- **하루 헤더**: "하루" 타이틀 + "당신의 개인 비서" 제거 → pill 상태만 표시
- **하루 버블**: "하루" 이름 라벨 제거, padding 축소 (6px 10px), line-height 1.35
- **대화 간격**: 메시지 블럭 간격 10px
- **전체 좌정렬**: 모든 콘텐츠 텍스트 좌정렬 통일

### Added
- **홈 접힘**: Tomorrow/DayAfter/Yesterday → "Tomorrow / Upcoming" 접힘 가능 섹션
- **수면 차트 범례**: ● 7h+ ○ 미달
- **설정 버전 표시**: v0.8.0 + Build SHA + Deploy time
- **UX Audit 문서**: docs/process/ui-review-20260507.md (15건)
- **Stage 8 시안**: Before/After 비교 + 인터랙티브 프로토타입

### Design Process
- UX Pro Max 기준 15건 사용성 감사 → Before/After 시안 → 사용자 행간/정렬 라이브 조율 → 승인 후 코드 반영

---

## v0.7.0 — 2026-05-03 ~ 05-05

### Added
- **루틴 시스템**: 체크 토글 + 연속 일수 + 🔥(3일+) + "잊지 않으셨죠?"
- **주간 리포트**: 수면/컨디션/운동/감정/달성률 자동 문장 생성
- **월간 리포트**: 건강/감정/루틴/활동 4섹션 종합 자동 생성
- **주간 회고**: 다음 주 다짐 + 한줄 소감 (직접 입력, DB 저장)
- **월간 회고**: 기억에 남는 순간 + 다음 달 목표 + 나에게 한 마디
- **감정 컬러 10색**: 기쁨/평온/설렘/감사/무기력/불안/짜증/슬픔/피곤/외로움 각 고유 컬러
- **Recommendation 컨텍스트**: 상단 맥락 요약 + 체크 가능 항목 + 달성 카운트
- **하루 루틴 관리**: 대화로 루틴 추가/삭제 ("명상 루틴 추가해줘")
- **마크다운 렌더링**: **볼드**, *이탤릭*, `코드`
- **대화 요약**: 기록 Today에 주제별 인과관계 서술

### Changed
- **하루 대화 스타일**: MI(동기면담) 공감 대화 — 바로 리스트 금지, "정리해드릴까요?" 후 제공
- **폰트**: Outfit + Noto Sans KR → Inter(제목) + DM Sans(본문)
- **감정 버튼**: 흰색 배경 + 컬러 텍스트 + 2pt 아웃라인
- **기록 Today 스케줄**: 오늘만 표시 (내일/모레 → 홈에서 확인)

### Database
- `weekly_reviews`, `monthly_reviews` 테이블 추가
- `routines`, `routine_logs` 테이블 추가
- `recommendation_logs` 테이블 추가
- 총 12개 테이블

---

## v0.6.0 — 2026-05-03

### Added
- **하루 캐릭터**: 진+모미+마음 통합 만능 비서
- **Daily Insight**: DB에서 건강/감정/스케줄 실시간 조합 (30분 갱신)
- **Recommendation**: 하루 대화 내용 기반 팁 추출 + 체크 기능 (1시간 갱신)
- **기록 Week**: 달성률 카드 + 수면 바 차트 + 감정 컬러 비율 바
- **기록 Month**: 히트맵 캘린더 + 30일 차트 + 감정 분포 + 월간 요약
- **Daily Review**: 감사/완료/내일/나에게 한마디 4질문

### Changed
- 4탭: 홈/친구들/기록/설정 → 홈/하루/기록/설정
- 모미+마음 독립 대화 → "하루" 통합 대화
- 컬러 룰: 블루(#60A5FA) = 달성/7h+, 그레이(#E6E6E6) = 미달

---

## v0.5.0 — 2026-05-03

### Added
- **Diary 시안**: 날짜 스크롤 피커 (scroll-snap) + Health/Emotion/Schedule 표시
- **Nav 비교**: 3탭 vs 5탭 시안 → 최종 4탭(홈/친구들/기록/설정) 결정
- **친구들 합동**: 모미+마음 한 대화방, 키워드 자동 분기

---

## v0.4.0 — 2026-05-02

### Added
- **Next.js 16 앱**: App Router + TypeScript + Tailwind CSS v4
- **Supabase 연동**: PostgreSQL — health_logs, journal_entries, chat_messages, todos, schedules, daily_insights
- **ChatGPT API**: gpt-4o-mini (Claude에서 전환)
- **모미 탭**: Health Status 입력 (수면/컨디션/운동) + AI 대화
- **마음 탭**: 감정 선택 + AI 대화
- **설정**: API 키 입력
- **Vercel 배포**: 자동 배포

### Fixed
- iOS Safari 자동 확대 방지 (input font-size 16px)
- 날씨 텍스트 항상 검은색 (다크 하늘 가독성)

---

## v0.3.0 — 2026-05-02

### Added
- **인터랙티브 프로토타입**: 시간대/컬러 실시간 전환 가능
- 하늘 그라디언트 12종 (morning/afternoon/evening/night × 3 컬러)
- 기온 대형 폰트 + 맑음/최저/최고
- Good Morning/Afternoon/Evening/Night 자동 전환
- 3블록 브리핑: Yesterday(취소선) / Today / Recommendation(액센트 선)
- 캐릭터 탭: 진(Butler) / 모미(Trainer) / 마음(Coach)

---

## v0.2.0 — 2026-05-02

### Changed
- 다크 배경 (#0f0f0f) → 순백 배경 (#FFFFFF)
- 멀티 컬러 (3 팔레트) → 단일 컬러 (시간 기반)
- 카드/테두리/그림자 → 여백과 구분선만

### Added
- 텍스트 계층: #000(강조) / #333(본문) / #808080(보조) / #B3B3B3(라벨)
- 시간 컬러 3옵션: Blue Cycle / Warm Shift / Ink

---

## v0.1.0 — 2026-05-02

### Added
- 초기 무드보드: 3가지 컬러 팔레트, 4가지 폰트 조합
- 캐릭터 액센트: 진(Slate) / 모미(Emerald) / 마음(Violet)
- DB 스키마 설계, 아키텍처 구조 기획
