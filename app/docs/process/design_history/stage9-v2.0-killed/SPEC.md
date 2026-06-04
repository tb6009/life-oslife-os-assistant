# 061_LifeOS/app — UX 재개선 통합 Spec (Stage 9 / v0.9)

- **작성일**: 2026-05-11
- **대상 프로젝트**: `061_LifeOS/app` (Next.js 16.2.4, React 19.2.4, Tailwind 4, Supabase, NextAuth)
- **브레인스토밍 로그**: [`log.md`](./log.md)
- **방법**: superpowers/brainstorming + 비주얼 컴패니언
- **다음 단계**: `writing-plans` 스킬로 구현 계획서 작성

본 문서는 brainstorming 단계의 최종 결정사항을 한 곳에 정리한 spec입니다. writing-plans는 본 문서를 입력으로 받아 구현 단계별 plan을 만듭니다.

---

## 1. 범위

다음 5개 영역의 사용성 + 코드 구조를 재정비합니다:

1. **IA (정보 아키텍처)** — BottomNav, 라우트 정합성
2. **다이어리** — 시간 네비, 회고 색상 시스템, 캘린더 레이아웃
3. **홈** — 7~8블록 우선순위
4. **하루 + 설정** — 채팅 책임 분리 + 자동 저장 피드백
5. **전체 아키텍처 / 성능** — 큰 파일 분리, 데이터 캐싱, dead code 정리

---

## 2. 영역별 결정사항

### 2.1. IA (영역 1)

| 항목 | 결정 |
|------|------|
| `/friends` 라우트 | **제거** (deprecate) — `/haru`와 거의 동일 코드, 진입로 없음 |
| BottomNav 탭 순서 | 홈 / 하루 / 기록 / 설정 → **홈 / 기록 / 하루 / 설정** |
| 4탭 큰 구조 | 유지 |
| 페이지 입구 일관성 | 별도 변경 불필요 |

**영향 파일**: `src/app/friends/page.tsx` (삭제), `src/components/BottomNav.tsx` (배열 순서)

### 2.2. 다이어리 (영역 2)

**시간 네비 — 공통 패턴**
- 세 탭(Today / Week / Month) 모두 `‹ 라벨 ›` 단순 화살표 형식
- 박스 테두리·배경색 없음, 화살표·라벨만 인라인
- Today는 기존 가로 스크롤 selector도 유지(아래)

**Today 탭**
- 기존 61일 가로 스크롤 selector **유지**
- 선택된 날짜를 화면 **정중앙**에 자동 정렬 (`scrollLeft = (selectedIndex × ITEM_WIDTH) - (containerWidth/2 - ITEM_WIDTH/2)`)
- 양옆 셀은 opacity 점진 fade (0.55 ~ 0.75)
- 선택된 셀이 일요일이면 배경 `#000` → `#DC2626` (한국 캘린더 컨벤션)

**Week 탭**
- `‹ 2026-W19 · 5/10~5/16 ›` 시간 네비 추가
- `getWeekRange()` 함수를 인자 받도록 리팩터 (현재 주 외 임의 주차 계산)

**Month 탭**
- `‹ 2026년 5월 ›` 시간 네비 추가
- 캘린더 셀 종횡비 **1:1 → 1.5:1 (3:2)** — 세로 길이 약 67%
- **회고 상태 색상 시스템 신설**:

| 회고 단위 | 대기 | 완료 | 표시 |
|----------|------|------|------|
| 일별 (데일리 리뷰) | (표시 없음) | 🟢 초록 도트 `#16a34a` | 평일 셀 우하단 |
| 주별 (주간회고) | 🔴 빨간 도트 `#DC2626` | 🔵 파란 도트 `#2563eb` | 일요일 셀 우하단 |
| 월별 (월간회고) | 핑크 배경 `#fef2f2` + `月` | 셀 전체 초록 채움 `#16a34a` | 월말 셀 |

**월간회고 trigger**
- 월의 마지막 날에 자동 prompt
- 한 달간 상세 리뷰 작성 후 `upsertMonthlyReview`로 저장

**회고 작성 UI**
- **Bottom sheet 모달** (캘린더 아이콘 탭 → 하단 슬라이드업)
- 컨텍스트(달력) 유지
- 저장 시 도트/셀 색상 자동 갱신

**영향 파일**: `src/app/diary/TodayTab.tsx`, `WeekTab.tsx`, `MonthTab.tsx` — 모두 분리 대상이므로 영역 5 분리와 함께 신규 컴포넌트로 이동

### 2.3. 홈 (영역 3)

**최종 7블록 순서** (8블록 → 7블록, WeatherHero+Greeting 압축):

| # | 블록 | 그룹 |
|---|------|------|
| 1 | `WeatherHero + Greeting` (압축) | 시각·인사 |
| 2 | `DailyInsight` | 인사이트 |
| 3 | `TodayBlock` | 액션 |
| 4 | **`TodoList`** (← 이전 5번) | 액션 |
| 5 | **`RoutineList`** (← 이전 4번) | 액션 |
| 6 | `DynamicRecommend` | 제안 |
| 7 | `CollapsibleUpcoming` (접힘) | 미래 |

**영향 파일**: `src/app/page.tsx` (render 순서), `src/components/briefing/WeatherHero.tsx` + `Greeting.tsx` (압축 통합 검토)

### 2.4. 하루 + 설정 (영역 4)

**`/haru/page.tsx` (467줄) → 6개 책임 분리**

| 책임 | 분리 후 위치 |
|------|--------------|
| 메시지 fetch/save 상태 | `hooks/useChatMessages.ts` |
| 키워드 감지 (운동·수면·커피·감정) | `lib/chat/keywords.ts` |
| 자동 저장 로직 (`autoSaveFromChat`) | `hooks/useAutoSave.ts` |
| 마크다운 → HTML 변환 | `lib/markdown.ts` |
| 메시지 한 개 렌더 | `components/chat/ChatMessage.tsx` |
| 입력 영역 | `components/chat/ChatInput.tsx` |

분리 후 `haru/page.tsx`는 약 80줄.

**자동 저장 토스트 신설** (`components/ui/Toast.tsx`)
- 자동 저장 발생 시 화면 상단/하단에 "수면 7시간 저장됨" 등 1.5초간 노출
- `useToast` 훅으로 트리거 (다른 페이지 재사용 가능)
- 입력을 막지 않는 passive feedback

**`/settings/page.tsx`** (213줄, 양호)
- 안내 문구 갱신: "친구들(모미/마음) AI 대화에 사용됩니다" → **"하루(어시스턴트) 대화에 사용됩니다"**
- 그 외 변경 없음

### 2.5. 전체 아키텍처 / 성능 (영역 5)

**P0 — 다이어리 3탭 분리**

| 현재 | After |
|------|-------|
| `TodayTab.tsx` 621줄 | `app/diary/TodayTab.tsx` ~120줄 (탭 컨테이너) |
| `MonthTab.tsx` 478줄 | `app/diary/MonthTab.tsx` ~120줄 |
| `WeekTab.tsx` 441줄 | `app/diary/WeekTab.tsx` ~120줄 |

분리되어 `src/components/diary/` 신설 폴더에 들어가는 컴포넌트:
- `DateSelector.tsx` — Today의 정중앙 정렬 가로 selector (일요일 빨강 반영)
- `HealthInput.tsx` — 수면/컨디션/커피/운동 입력 (Today 공유)
- `MemoSection.tsx` — 메모·데일리 리뷰 작성
- `WeekChart.tsx` — 주차 차트
- `CalendarGrid.tsx` — Month 캘린더 (회고 색상 시스템 + 3:2 셀)
- `TimeNav.tsx` — `‹ 라벨 ›` 공통 시간 네비 (Today/Week/Month 모두 사용)
- `ReviewModal.tsx` — 회고 작성 Bottom sheet (`components/ui/` 에 둘지는 구현 단계 결정)

**P0 — React Query 도입**

- 패키지: `@tanstack/react-query` (~40KB gz)
- `src/lib/supabase/queries.ts` 신설 — Supabase API wrapper 훅:
  - `useHealthLog(date)`, `useHealthLogs(range)`
  - `useJournalEntry(date)`, `useJournalEntries(range)`
  - `useRoutines()`, `useRoutineLogs(range)`
  - `useChatMessages()`, `useWeeklyReview(week)`, `useMonthlyReview(month)`
  - mutation: `useUpsertHealthLog`, `useUpsertJournal`, `useSaveChatMessage`, …
- 캐시 정책 초안: `staleTime: 1분`, `gcTime: 5분`, `refetchOnWindowFocus: false`
- `<QueryClientProvider />` 를 `src/app/layout.tsx` (또는 `SessionWrapper.tsx` 안)에 추가
- 기존 `lib/supabase/api.ts` 는 유지 (queries.ts가 wrapper로 사용)

**P1 — Tailwind 점진 마이그레이션**

- 새로 만드는 컴포넌트는 Tailwind 우선
- 기존 inline `style={{...}}`는 동시 전환하지 않음 — 영역별 작업 시 함께 변환
- 디자인 토큰은 `src/styles/` (신설) + `tailwind.config` 확장으로 관리
- 시간대별 액센트 색(`theme/timeColor.ts`)은 CSS 변수로 노출 → Tailwind에서 `var(--accent)` 사용

**P1 — Dead code 정리**

다음 파일 모두 삭제 (briefing 외 import 0회 확인됨):
- `src/app/friends/page.tsx` (349줄)
- `src/components/briefing/CharacterTabs.tsx`
- `src/components/briefing/MaeumView.tsx`
- `src/components/briefing/MomiView.tsx`

총 ~900줄 제거.

**P1 — debug API routes 환경 분기**

- `src/app/api/debug/headers/route.ts`
- `src/app/api/debug/oauth/route.ts`
- `src/app/api/debug/route.ts`

처리 방식:
- 옵션 a — 상단에 `if (process.env.NODE_ENV === "production") return new Response(null, { status: 401 })` 추가
- 옵션 b — 라우트 자체를 삭제 (개발 흔적 정리)

→ 구현 단계에서 a/b 결정. **기본 권장**: a (개발 편의 유지).

**P2 — 보류**

- `tsconfig.json` target ES2017 → ES2022 (후속 라운드)

---

## 3. 권장 디렉토리 구조 (개선 후)

```
src/
├── app/
│   ├── layout.tsx                    + QueryClientProvider 래핑
│   ├── page.tsx                      (홈 — 7블록 순서 반영, WeatherHero+Greeting 압축)
│   ├── diary/
│   │   ├── page.tsx                  (탭 라우터, ~30줄)
│   │   ├── TodayTab.tsx              (~120줄, 분리)
│   │   ├── WeekTab.tsx               (~120줄, 분리)
│   │   └── MonthTab.tsx              (~120줄, 분리)
│   ├── haru/page.tsx                 (~80줄, 분리)
│   ├── settings/page.tsx             (213줄, 문구만 갱신)
│   ├── (friends/ → 제거)
│   └── api/
│       ├── auth/  calendar/  chat/
│       └── debug/                    (환경 분기 추가)
├── components/
│   ├── ui/                           ★ NEW
│   │   ├── Toast.tsx
│   │   └── ReviewModal.tsx
│   ├── briefing/                     (CharacterTabs/Maeum/Momi 제거)
│   │   └── (정리된 홈 전용 블록들)
│   ├── diary/                        ★ NEW
│   │   ├── DateSelector.tsx
│   │   ├── HealthInput.tsx
│   │   ├── MemoSection.tsx
│   │   ├── WeekChart.tsx
│   │   ├── CalendarGrid.tsx
│   │   └── TimeNav.tsx
│   ├── chat/                         ★ NEW
│   │   ├── ChatMessage.tsx
│   │   └── ChatInput.tsx
│   ├── BottomNav.tsx                 (탭 순서 변경)
│   └── SessionWrapper.tsx            (QueryClientProvider 위치 검토)
├── hooks/                            ★ NEW
│   ├── useChatMessages.ts
│   ├── useAutoSave.ts
│   ├── useHealthLog.ts
│   ├── useReviews.ts
│   └── useToast.ts
├── lib/
│   ├── ai/  data/  theme/  types/
│   ├── chat/                         ★ NEW
│   │   └── keywords.ts
│   ├── markdown.ts                   ★ NEW
│   └── supabase/
│       ├── api.ts                    (기존 유지)
│       └── queries.ts                ★ NEW (React Query wrappers)
└── styles/                           ★ NEW (Tailwind 토큰 확장)
```

---

## 4. 회고 시각화 컬러 토큰 (확정)

| 토큰 | 의미 | HEX |
|------|------|-----|
| `--review-pending` | 주간회고 대기 | `#DC2626` |
| `--review-week-done` | 주간회고 완료 | `#2563eb` |
| `--review-day-done` | 일별 회고 완료 (도트) | `#16a34a` |
| `--review-month-done` | 월간회고 완료 (셀 채움) | `#16a34a` |

`--review-day-done`과 `--review-month-done`은 같은 초록. 의미 단위는 다르나 시각적 통일성 우선.

`src/lib/theme/tokens.ts` 또는 `src/styles/`의 CSS 변수로 노출 권장.

---

## 5. 데이터 모델 영향

기존 Supabase 스키마(`getWeeklyReview`, `getMonthlyReview`, `upsertHealthLog`, `upsertJournalEntry`)를 그대로 활용. **새 테이블/컬럼 추가 없음**.

단, **회고 완료 여부 판단**을 위해 다음 조건 사용:
- 일별 회고 완료 = 해당 날짜의 `journal_entries` 또는 `daily_review` 필드에 내용 존재
- 주간회고 완료 = 해당 주차의 `weekly_reviews` 레코드 존재 + 내용 비어있지 않음
- 월간회고 완료 = 해당 월의 `monthly_reviews` 레코드 존재 + 내용 비어있지 않음

`hooks/useReviews.ts` 에서 boolean 노출. 구현 시 정확한 "완료" 기준은 writing-plans에서 확정.

---

## 6. 비기능 요구

| 항목 | 요구 |
|------|------|
| 사용성 | Today selector 가로 스크롤이 60fps 유지, 정중앙 정렬 부드러움 |
| 성능 | 페이지 전환 시 캐시된 데이터 즉시 표시 (React Query), 초기 로드 1.5초 이하 |
| 접근성 | 회고 도트는 색상 외에도 형태(도트/체크) 구분, 색맹 사용자도 대기/완료 구분 가능. 추후 hover/focus 시 텍스트 라벨 노출 |
| 보안 | debug API routes 프로덕션 차단, API key는 password 마스킹 유지 |
| 모바일 | 회고 작성 Bottom sheet는 키보드 노출 시 자동 스크롤, 50% 화면 점유 기본 |
| 호환성 | 기존 사용자 데이터 무손상 (스키마 변경 없음) |

---

## 7. 구현 우선순위

writing-plans 단계에서 다음 순서로 plan 분할 권장:

**1차 — 토대 (1~2일)**
- React Query 도입 (`@tanstack/react-query` 설치 + `QueryClientProvider` + 첫 hook `useHealthLog` 검증)
- `components/ui/Toast.tsx` + `hooks/useToast.ts`
- `components/diary/TimeNav.tsx` (공통 컴포넌트)

**2차 — 다이어리 분리 (2~3일)**
- TodayTab → 분리 + 정중앙 정렬 + 일요일 빨강
- WeekTab → 분리 + 시간 네비 추가 + `getWeekRange(date?)` 리팩터
- MonthTab → 분리 + 시간 네비 + 캘린더 3:2 + 회고 색상 시스템
- `ReviewModal.tsx` + 월간회고 자동 trigger

**3차 — 하루 + 홈 (1~2일)**
- `/haru` 분리 (hooks 2개 + lib 2개 + components 2개)
- 자동 저장 토스트 연결
- 홈 7블록 순서 적용 (`src/app/page.tsx` render 순서)

**4차 — 정리 (1일)**
- IA 변경: BottomNav 순서, `/friends` 삭제
- Dead code 정리: CharacterTabs / MaeumView / MomiView
- `/settings` 안내 문구 갱신
- debug API routes 환경 분기

각 단계는 독립적으로 PR 가능. 회귀 테스트는 매 단계 후 수동 + 자동(추가될 경우).

---

## 8. 미결 사항 (writing-plans 단계에서 확정)

1. `ReviewModal` 위치: `components/ui/` vs `components/diary/`
2. debug API routes: 401 분기 vs 라우트 삭제
3. `QueryClientProvider` 마운트 위치: `app/layout.tsx` vs `SessionWrapper.tsx` 안
4. WeatherHero + Greeting "압축": 한 컴포넌트로 병합 vs 여백만 줄이기
5. 회고 완료 boolean의 정확한 기준 (내용 길이 임계값 등)
6. Tailwind 토큰 명세 (시간대별 액센트, 회고 색상 등)

---

## 9. 외부 문서 동기화

- [`docs/design-history.html`](../../design-history.html) — Stage 9 추가 (5/11) ✓ + 영역 4·5 결정 반영 (예정)
- [`docs/design-evolution-report.html`](../../design-evolution-report.html) — v0.9 추가 (5/11) ✓ + 영역 4·5 결정 반영 (예정)
- [`docs/brainstorming/2026-05-11_ux-improvement/log.md`](./log.md) — 시간순 진행 기록

본 spec이 변경되면 위 세 문서도 동기화.

---

## 10. 핸드오프 to writing-plans

본 spec을 입력으로:
- 1~4차 plan 작성
- 각 plan에 변경 파일·검증 절차·롤백 방법 명시
- 의존성 그래프(예: 다이어리 분리는 TimeNav 컴포넌트 의존)

**writing-plans 스킬 호출 전 사용자 spec 검토 필요.**
