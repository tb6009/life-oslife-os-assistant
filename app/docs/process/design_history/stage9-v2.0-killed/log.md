# 061_LifeOS/app — UX 개선 브레인스토밍 진행 기록

- **기간**: 2026-05-11 ~
- **대상**: `061_LifeOS/app` (Next.js 16.2.4, React 19.2.4, Tailwind 4, Supabase + NextAuth)
- **목적**: 메뉴구조 + 페이지 내부 사용성 전반 개선
- **방법**: superpowers/brainstorming 스킬 + 비주얼 컴패니언 (브라우저 mockup) 병행
- **자료 위치**: 각 단계의 화면 HTML은 `NN_<주제>.html` 로 본 폴더에 보존

---

## 0단계 — 컨텍스트 파악 (코드 탐색)

발견 사항:

| 영역 | 현재 상태 |
|------|-----------|
| **BottomNav** | 4탭: 홈(Briefing) / 하루(Assistant) / 기록(Diary) / 설정(Settings) |
| **홈** (`/`) | 7개 블록 적층: WeatherHero, Greeting, DailyInsight, TodayBlock, RoutineList, DynamicRecommend, TodoList |
| **다이어리** (`/diary`) | 서브탭 Today / Week / Month. **Week에 이전주/다음주 네비 부재** — `getWeekRange()`가 항상 "이번 주"만 계산 |
| **친구** (`/friends`) | 라우트는 존재하지만 BottomNav에 없음 — 진입 경로 불명 |
| **하루** (`/haru`), **설정** (`/settings`) | 별도 평가 필요 |

---

## 1단계 — 평가/개선 범위 결정

### 화면
[`01_scope.html`](./01_scope.html) — 현재 IA 맵 + 3옵션 (A 핀포인트 / B IA 전반 / C 풀세트)

### Claude 추천
**A 핀포인트** — YAGNI 원칙으로 좁게 시작 후 확장 권장

### 사용자 코멘트 (원문 보존)

> 아무래도 구조를 홈, 기록, 하루, 설정 단위로 가야 할 것 같아. 그리고 서브탭의 페이지들은 이 전주와 다음주를 볼 수 있도록 했으면 하고. 평가와 개선범위는 c안으로 해보면 좋을 것 같아. 그리고 지금 브라우저에 띄운 내용들은 작업 진행상황으로 다 저장해서 내 코멘트와 함께 기혹해주세요. 나중에 블로그 글로 써야 해서.

### 결정 사항
1. **메뉴 구조**: 4탭 유지 (홈 / 기록 / 하루 / 설정)
2. **서브탭**: 모든 서브탭 페이지에 **이전주 / 다음주 네비** 추가
3. **평가 범위**: **C안 (풀세트)** 채택 — IA 전반 + 페이지 내부 흐름까지
4. **운영**: 본 폴더에 진행 자료 누적 보존 (블로그 글 원천)

### 다음 단계
- C안 4개 영역(글로벌 네비/IA, 다이어리, 홈, 하루+설정)의 **진행 순서** 결정
- friends 페이지 처리 방향은 IA 단계에서 다룸

---

## 2단계 — 진행 순서 자동 채택 + IA 영역 시작

자동 모드 진입. 4개 영역의 진행 순서를 합리적 가정으로 확정:

1. **글로벌 IA** ← 시작 (friends 처리, BottomNav 정합성)
2. 다이어리 (서브탭 주차 네비, 입력 흐름)
3. 홈 (7블록 우선순위)
4. 하루 + 설정 (마무리)

**근거**: IA를 먼저 잡아야 각 페이지의 입구가 흔들리지 않음. 다이어리는 사용자 통증이 가장 명확. 홈은 우선순위 정리만. 하루+설정은 검토 위주.

### 코드 탐색 중 핵심 발견 — friends/haru 중복

`/friends`와 `/haru` 두 페이지가 거의 동일한 컨셉으로 발견됨:
- 둘 다 채팅 인터페이스 + 운동·수면·감정 키워드 자동 감지 → Supabase 저장
- 차이는 `/friends`만 모미·마음 캐릭터 분기, `/haru`는 단일
- BottomNav에는 `/haru`만 노출, `/friends`는 진입로 부재

---

## 3단계 — IA 영역 1: `/friends` 처리 결정

### 화면
[`02_ia-friends.html`](./02_ia-friends.html) — friends/haru 중복 진단 + 4옵션 (A 통합 / B 제거 / C 역할 분리 / D 보류)

### Claude 추천
**A** (haru로 통합 + 캐릭터 분기 흡수)

### 사용자 코멘트 (원문 보존)

> B 맞아. 하루가 있는데 프랜즈가 남아있었구나?

### 결정 사항
- **`/friends` 페이지 deprecate** (B안 채택)
- 사용자 본인도 friends 페이지 존재 인지 못함 → unused legacy 확정
- 캐릭터 분기 로직은 흡수하지 않고 단순 제거 (필요해지면 별도 brainstorming)

### 구현 단계 처리 항목 (writing-plans 단계로 이월)
- `src/app/friends/page.tsx` 삭제
- `friends`만 사용하는 helper/import 정리 검토
- 라우트 제거 후 사이트맵·테스트 영향 없음 확인

### 다음 단계
- IA 마무리: BottomNav 4탭 **순서** 점검 (사용자 무심결 발화에 다른 순서 등장)

---

## 4단계 — IA 영역 2: BottomNav 탭 순서

### 화면
[`03_ia-bottomnav.html`](./03_ia-bottomnav.html) — 현재 vs 사용자 발화 순서 비교 + 3옵션

### Claude 추천
**B** (홈 / 기록 / 하루 / 설정 — 일과 흐름에 맞춤)

### 사용자 코멘트 (원문 보존)

> B

### 결정 사항
- BottomNav 탭 순서를 **홈 / 기록 / 하루 / 설정** 으로 변경
- 일과 흐름(보기→기록→대화→설정)에 부합

### 구현 단계 처리 항목 (writing-plans 단계로 이월)
- `src/components/BottomNav.tsx` 의 `tabs` 배열 순서 조정만

### IA 영역 정리 (결과 요약)
| 항목 | 결정 |
|------|------|
| `/friends` | deprecate (페이지·라우트 제거) |
| BottomNav 탭 순서 | 홈 / 기록 / 하루 / 설정 |
| 4탭 큰 구조 | 유지 |
| 페이지 입구 일관성 | 별도 평가 불필요 (현재 일관됨) |

→ **IA 영역 종료. 다이어리(영역 2) 시작.**

---

## 5단계 — 다이어리 영역 진입: 시간 네비 진단

### 다이어리 3탭 시간 네비 현황

| 탭 | 현재 시간 네비 |
|----|---------------|
| **Today** | 가로 스크롤 61일짜리 selector 존재 (특이) |
| **Week** | **부재** — 항상 "이번 주" (`getWeekRange()`가 현재 주만 계산) |
| **Month** | `viewYear`/`viewMonth` state는 있으나 헤더 UI는 미확인 |

세 탭의 패턴이 제각각 — 일관성 부재가 핵심 문제.

### 화면
[`04_diary-time-nav.html`](./04_diary-time-nav.html) — 공통 네비 패턴 2옵션 (A 단순 화살표 / B 화살표 + 피커)

### Claude 추천
**A 단순 화살표** (YAGNI — 사용자 표현도 단순)

### 다음 단계
- 패턴 선택 후, Today 탭의 기존 가로 스크롤 selector 처리 결정 (유지/제거/축소)

---

## 6단계 — 다이어리 시간 네비 패턴 확정

### Claude 추천
A 단순 화살표

### 사용자 코멘트 (원문 보존)

> A안이 좋은데 블럭과 배경색은 없으면 좋겠어. 그리고 UI는 단순하게

### 결정 사항
- 시간 네비 패턴: **A안 + UI 단순화**
  - `‹ 라벨 ›` 형식
  - 박스 테두리 / 배경색 없음
  - 화살표·라벨만 인라인으로
- Today / Week / Month 세 탭 공통 적용
- 디자인 토큰: 라벨 한 줄 위에 작은 캡션(TODAY / WEEK / MONTH)이 회색·소문자·트래킹 넓은 형태로 노출 (옵션)

### 다음 단계
- Today 탭에 남아있는 61일 가로 스크롤 selector 처리 (시간 네비와 중복)

---

## 7단계 — Today 가로 스크롤 selector 처리

### 화면
[`05_diary-today-scroll.html`](./05_diary-today-scroll.html) — 확정된 시간 네비 미리보기 + 가로 스크롤 처리 3옵션

### Claude 추천
A 제거 ("UI 단순하게" 방향과 일치)

### Claude 추천
A 제거

### 사용자 코멘트 (원문 보존)

> 일단 투데이는 현재 가로 탭의 디자인을 동일하게 유지 해주세요. 한가지 수정하자면 일요일에는 배경의 색이 검정색에서 빨간색으로 바꿔주세요. 빨간 날짜에 주간회고를 하라고 캘린더에 빨간 아이콘으로 만들어서 표시 해주세요. 그리고 다 하면 체크 할 수 있도록. 월간도 월의 마지막 날 월간 회고 전에 한달간의 리뷰를 상세하게 작성하고 저장해주세요. 그리고 학장된 네비게이션은 현행 기준으로 유사하게 디자인을 해주세요. 대신 7일이 까지 보일 필요는 없고 현재 있는 형식에서 화살표로만 보여주면 됩니다. month도 동일하게 해주세요.

### 결정 사항 (다이어리 영역 종합)

**Today 탭**:
- 가로 스크롤 61일 selector **유지** (현행 디자인 그대로)
- 수정점: 선택된 셀이 일요일이면 배경색을 검정(#000) → 빨강(#DC2626)
- 코드 위치: [`src/app/diary/TodayTab.tsx:324`](../../src/app/diary/TodayTab.tsx#L324)

**Week 탭**:
- 시간 네비 추가: `‹ 2026-W19 · 5/10~5/16 ›`
- 화살표 + 라벨만, strip 없이, 박스/배경 없이
- 기존 `getWeekRange()` 함수가 인자 받도록 리팩터: 현재 주가 아니라 임의 주차 계산

**Month 탭**:
- 시간 네비 추가: `‹ 2026년 5월 ›`
- 캘린더 일요일 셀에 **빨간 회고 아이콘**(점/도트) 표시 → 주간회고 trigger
- 회고 완료 시 ✓ 체크로 변경
- 월의 마지막 날에 **월간회고 자동 prompt** + 한 달 리뷰 상세 작성 + 저장 (`upsertMonthlyReview` 활용)

**회고 컨셉의 일관성**:
- 일요일 = 주간회고일이라는 컨셉이 Today selector(빨강 배경)와 Month 캘린더(빨간 아이콘)에 모두 반영
- 한국 캘린더 관행(일요일=빨강)과도 부합

### 다음 단계 (마지막 결정 한 가지)
- 회고 작성 UI 형식: Modal vs 별도 페이지 vs 인라인 펼침

---

## 8단계 — 회고 작성 UI 형식

### 화면
[`06_diary-final.html`](./06_diary-final.html) — Today/Week/Month 통합 mockup + 회고 작성 UI 3옵션 (A 모달 / B 별도 페이지 / C 인라인 펼침)

### Claude 추천
**A 모달 (Bottom sheet)** — 컨텍스트(달력) 유지 + 모바일 친화

### 사용자 코멘트 (원문 보존, 추가 요청)

> today는 날짜를 센터에 위치시켜주세요

### 추가 결정 사항
- Today 가로 selector가 항상 **선택된 날짜를 화면 정중앙에 위치**시키도록
- 양옆은 점진 fade 효과로 더 많은 날짜가 있다는 시각적 단서 제공
- 코드 수정: `scrollToDate` 호출 후 `scrollLeft = (selectedIndex × ITEM_WIDTH) - (containerWidth / 2 - ITEM_WIDTH / 2)` 로 정렬
- 화면: [`07_diary-final-v2.html`](./07_diary-final-v2.html)

### 사용자 코멘트 (원문 보존, 추가 요청 2)

> 그리고 월별회고는 캘린더 가 위아래로 너무 길다. 각 날짜 블럭의 높이를 반으로 줄여주세요

### 추가 결정 사항
- Month 캘린더 셀 종횡비 변경: 정사각형(`aspect-ratio:1`) → 가로 2배(`aspect-ratio:2`)
- 셀 높이 절반 → 캘린더 전체 세로 길이 절반
- 빨간 도트·체크·月 표시 위치는 그대로 (우하단)
- 화면: [`08_diary-final-v3.html`](./08_diary-final-v3.html)

### 사용자 코멘트 (원문 보존, 추가 요청 3)

> 이러면 또 너무 납짝하네 이 전과 지금의 중간정도 높이면 어떨까?

### 추가 결정 사항
- Month 캘린더 셀 종횡비 재조정: `aspect-ratio:2` → `aspect-ratio:1.5` (3:2)
- v2(정사각, 100%)와 v3(2:1, 50%)의 중간 = 약 67%
- 화면: [`09_diary-final-v4.html`](./09_diary-final-v4.html)

### 사용자 코멘트 (원문 보존, 추가 요청 4)

> 그리고 month캘린더에 초록 닷은 회고가 마무리 된 것으로 표시 해주시고, 주별 회고가 마무리 되면 파란색, 월별 회고가 마무리 되면 그 블럭을 초록 색으로 블럭을 채워주세요.

### 추가 결정 사항 — 회고 상태별 색상 시스템

| 회고 단위 | 대기 | 완료 | 표시 위치 |
|----------|------|------|-----------|
| **일별** (데일리 리뷰) | 표시 없음 | 🟢 초록 도트 | 각 평일 셀 우하단 |
| **주별** (주간회고) | 🔴 빨간 도트 | 🔵 파란 도트 | 일요일 셀 우하단 |
| **월별** (월간회고) | 핑크 배경 + `月` | 셀 전체 초록 채움 | 월말 셀 |

**색상 토큰**:
- 빨강: `#DC2626` (주간회고 대기)
- 파랑: `#2563eb` (주간회고 완료)
- 초록: `#16a34a` (일별 회고 완료 도트 / 월별 회고 완료 셀 채움)

**의미적 일관성**:
- "회고가 마무리됐다"는 신호 = 채워진 도트(평일)/파란 도트(주별)/초록 셀(월별)
- 일요일에는 평일과 달리 빨강(대기)→파랑(완료)으로 별도 색 사용 — 주간이라는 단위의 무게감 강조

**화면**: [`10_diary-final-v5.html`](./10_diary-final-v5.html)

### 진행 중
- 회고 작성 UI 형식 결정 대기 (A 모달 / B 별도 페이지 / C 인라인)

---

## ★ 현재까지 변경사항 누적 요약 (2026-05-11 시점)

영역별로 한눈에 보는 결정사항. 구현 단계(writing-plans)에서 이 표를 spec으로 변환.

### IA (영역 1) — 결정 완료

| 항목 | 변경 | 코드 영향 |
|------|------|-----------|
| `/friends` 라우트 | **제거** (deprecate) | `src/app/friends/page.tsx` 삭제 |
| BottomNav 탭 순서 | 홈/하루/기록/설정 → **홈/기록/하루/설정** | `src/components/BottomNav.tsx` `tabs` 배열 |
| 4탭 큰 구조 | 유지 | — |

### 다이어리 (영역 2) — 결정 진행 중

| 항목 | 변경 | 코드 영향 |
|------|------|-----------|
| Today selector | 가로 스크롤 유지 + 선택일 화면 정중앙 자동 정렬 | `src/app/diary/TodayTab.tsx` `scrollLeft` 계산 |
| Today 일요일 셀 | 검정(#000) → 빨강(#DC2626) | `TodayTab.tsx:324` 분기 |
| Today selector fade | 양옆 점진 opacity 0.55~0.75 | 새 스타일 |
| Week 탭 시간 네비 | 없음 → `‹ 2026-W19 · 5/10~5/16 ›` | `WeekTab.tsx` + `getWeekRange(date?)` 리팩터 |
| Month 탭 시간 네비 | 없음 → `‹ 2026년 5월 ›` (화살표만) | `MonthTab.tsx` 헤더 |
| Month 캘린더 셀 종횡비 | 1:1 → **1.5:1 (3:2)** | `MonthTab.tsx` grid 셀 |
| Month — 일별 회고 완료 | 표시 없음 → **🟢 초록 도트** (#16a34a) 우하단 | 신규 — `daily_review` 필드 활용 |
| Month — 주간회고 대기 | 표시 없음 → **🔴 빨강 도트** (#DC2626) 일요일 셀 우하단 | 신규 — 일요일 + 미완료 조건 |
| Month — 주간회고 완료 | 표시 없음 → **🔵 파랑 도트** (#2563eb) | `weekly_review` 존재 시 |
| Month — 월간회고 완료 | 표시 없음 → **🟢 셀 전체 초록 채움** | 월말 셀 + `monthly_review` 존재 시 |
| 월간회고 trigger | 수동 | 월의 마지막 날 자동 prompt + 한 달 상세 리뷰 | `MonthTab.tsx` + `upsertMonthlyReview` |
| 회고 작성 UI 형식 | **A 모달 (Bottom sheet)** — 추천 채택 | 신규 모달 컴포넌트 + 캘린더 클릭 핸들러 |

### 홈 (영역 3) — 평가 예정
- 7개 블록(WeatherHero / Greeting / DailyInsight / TodayBlock / RoutineList / DynamicRecommend / TodoList)의 우선순위 정리

### 하루 + 설정 (영역 4) — 평가 예정
- 단일 어시스턴트 채팅 흐름 검토
- 설정 페이지 정보 위계 점검

### 회고 시각화 컬러 토큰 (확정)

| 토큰 | 의미 | HEX |
|------|------|-----|
| `--review-pending` | 주간회고 대기 (일요일 도트) | `#DC2626` |
| `--review-week-done` | 주간회고 완료 (도트) | `#2563eb` |
| `--review-day-done` | 일별 회고 완료 (평일 도트 / 월간 셀 채움) | `#16a34a` |
| `--review-month-done` | 월간회고 완료 (셀 채움) | `#16a34a` (동일) |

→ `--review-day-done`과 `--review-month-done`은 같은 초록. 의미 단위는 다르나 시각적 통일성 우선.

### 외부 문서 업데이트
- [`design-history.html`](../../design-history.html) → Stage 9 추가 (2026-05-11)
- [`design-evolution-report.html`](../../design-evolution-report.html) → v0.9 추가 (2026-05-11)

---

## 11단계 — 다이어리 영역 종료 + 홈 영역 진입

### 사용자 코멘트 (원문 보존)

> 좋아요. 일단 이렇게 진행해봅시다.

### 결정 사항
- 회고 작성 UI 형식: **A 모달 (Bottom sheet)** 추천 채택
- 다이어리 영역 종료 (영역 2 완료)
- 영역 3 (홈) 진입

### 홈 페이지 현재 렌더 순서 (8블록)

`src/app/page.tsx` 의 렌더 트리:

| # | 블록 | 성격 |
|---|------|------|
| 1 | `WeatherHero` | 시각 헤더 (날씨 + 그라디언트) |
| 2 | `Greeting` | 인사 + 날짜 |
| 3 | `DailyInsight` | 날씨 기반 인사이트 |
| 4 | `TodayBlock` | 오늘 일정 |
| 5 | `RoutineList` | 루틴 체크리스트 |
| 6 | `CollapsibleUpcoming` | 내일·모레·어제 일정 (접힘) |
| 7 | `DynamicRecommend` | 동적 제안 |
| 8 | `TodoList` | 할 일 |

### 진단
- **액션 항목 분산**: TodayBlock(4) — RoutineList(5) — TodoList(8) 사이가 멀음
- **TodoList가 최하단**: 핵심 액션인데 스크롤 끝까지 가야 도달
- **DynamicRecommend가 TodoList 위**: 제안이 할 일보다 위에 노출되는 게 합리적인가?
- **인사이트/제안 두 블록**: DailyInsight + DynamicRecommend 역할 중첩 가능성

### 화면
[`11_home-priority.html`](./11_home-priority.html) — 현재 8블록 + 재배치 3안 (A 액션우선 / B 시간흐름 / C 그룹헤더)

### Claude 추천
A 액션 우선

### 사용자 코멘트 (원문 보존)

> B로 일단 하고 4의 루틴과 5의 투두리스트의 순서를 바꿔주세요

### 결정 사항 (홈 영역 종합)
- B안(시간 흐름) 채택 + RoutineList ↔ TodoList 순서 swap
- 최종 블록 순서:

| # | 블록 | 그룹 |
|---|------|------|
| 1 | WeatherHero + Greeting (압축) | 시각·인사 |
| 2 | DailyInsight | 인사이트 |
| 3 | TodayBlock | 액션 |
| 4 | **TodoList** (← swap, 이전 5) | 액션 |
| 5 | **RoutineList** (← swap, 이전 4) | 액션 |
| 6 | DynamicRecommend | 제안 |
| 7 | Upcoming (접힘) | 미래 |

- 8블록 → 7블록 (WeatherHero·Greeting 압축)
- 화면: [`12_home-priority-v2.html`](./12_home-priority-v2.html)

### 구현 단계 처리 항목 (writing-plans 단계로 이월)
- `src/app/page.tsx` 의 render 순서 변경
- WeatherHero + Greeting 압축 (현재는 별개 컴포넌트 → 시각적 통합 검토)

### 다음 단계
- **영역 4 — 하루(어시스턴트) + 설정** 진입

---

## 12단계 — 영역 4 1차 진단 + 사용자 코멘트

### 화면
[`13_area4-summary.html`](./13_area4-summary.html) — 1차 가벼운 진단 + 3옵션 (A 잔여 정리만 / B 토스트 추가 / C 깊이 평가)

### 사용자 코멘트 (원문 보존)

> 이 부분은 내가 무슨말인지 잘 모르겠어. 일단 전체 구조를 앞으로 수정보완을 하거나 퍼포먼스의 최적화를 할 수 있는 구조로 정리해주세요(판단은 니가 해주세요. 근거를 찾아서) 그리고 B의 경우 하루 토스트도 함께 추가는 무슨말인지 모르겠음. 그런데 이번에 하는김에 깊이 평가도 같이 해봐주세요. 시간걸려도

### 사용자 학습 항목 — "토스트(Toast)"
- 화면 한 켠에 잠깐 떠올랐다 사라지는 작은 알림 박스 (1~2초)
- 예: "수면 7시간 저장됨"이 채팅 메시지 위에 잠시 떴다 사라짐
- 자동 저장이 일어났음을 사용자가 인지하도록 해주는 짧은 피드백 UI
- 모달이 아니라 사용자의 입력을 막지 않음 (passive feedback)

### 결정
- 영역 4 **깊이 평가** 진행 (C 채택, 시간 더 들임)
- 추가로 **영역 5 — 전체 아키텍처 / 성능 최적화** 평가 신설 (사용자 명시 요청)

---

## 13단계 — 영역 4 깊이 평가 (/haru + /settings)

### 화면
[`14_area4-deep.html`](./14_area4-deep.html) — 책임 분리 표 + 4개 결정 항목 (multiselect)

### Claude 진단

**/haru/page.tsx (467줄)** — 한 파일에 6개 책임 혼재:
1. 메시지 fetch/save 상태 (useState 다수)
2. 키워드 감지 (운동·수면·커피·감정)
3. 자동 저장 로직 (`autoSaveFromChat`)
4. 마크다운 → HTML 변환 (`renderMarkdown`)
5. 메시지 한 개 렌더 (JSX 인라인)
6. 입력 영역 (JSX 인라인)

→ 분리 권장:
- `hooks/useChatMessages.ts`, `hooks/useAutoSave.ts`
- `lib/chat/keywords.ts`, `lib/markdown.ts`
- `components/chat/ChatMessage.tsx`, `components/chat/ChatInput.tsx`
- `components/ui/Toast.tsx` ★ 신규

**/settings/page.tsx (213줄)** — 적정. 갱신 항목만:
- "친구들(모미/마음) AI 대화에 사용됩니다" → "하루(어시스턴트) 대화에 사용됩니다"
- localStorage 평문 저장은 단일 사용자 PWA로는 OK. 다중 기기 사용 시 Supabase 비밀 테이블 검토 (후속)

### 영역 4 채택 항목 (multiselect, 모두 채택 권장)
1. `/haru` 6개 책임 분리
2. 자동 저장 토스트 추가
3. `/settings` 안내 문구 갱신
4. Dead code 동시 정리 (friends + CharacterTabs + MaeumView + MomiView)

---

## 14단계 — 영역 5 전체 아키텍처 / 성능 평가 (신규)

### 화면
[`15_area5-architecture.html`](./15_area5-architecture.html) — 파일 크기 진단 + 5대 구조적 이슈 + 권장 디렉토리 구조

### Claude 진단 (근거 포함)

**파일 크기 Top 6**:
| 파일 | 줄 | 판단 |
|------|-----|------|
| `diary/TodayTab.tsx` | **621** | 너무 큼 |
| `diary/MonthTab.tsx` | **478** | 너무 큼 |
| `haru/page.tsx` | **467** | 너무 큼 (영역 4) |
| `diary/WeekTab.tsx` | **441** | 분리 권장 |
| `friends/page.tsx` | 349 | deprecate 예정 |
| `settings/page.tsx` | 213 | 양호 |

**근거**: 200~250줄 이상이면 사람·AI 모두 reasoning 비용 급증. Anthropic composition-patterns 가이드 — "한 단위는 한 책임, 한 컨텍스트에 담아낼 크기".

**5대 구조적 이슈**:

| 우선순위 | 이슈 | 근거 / 권장 |
|----------|------|-------------|
| **P0** | 큰 파일 4개 | 컴포넌트 분리 → 단위당 ~120줄. `components/diary/`, `components/chat/` 신설. |
| **P0** | 데이터 캐싱 부재 | 같은 데이터(`getHealthLogs` 등)를 여러 페이지가 매번 재요청. `@tanstack/react-query` 도입. `lib/supabase/queries.ts` wrapper. |
| **P1** | 100% inline style | Tailwind v4 설치되어 있으나 활용 거의 없음. 새 코드부터 Tailwind 우선, 기존은 점진 마이그레이션. |
| **P1** | Dead code ~900줄 | friends + CharacterTabs + MaeumView + MomiView (briefing 외 import 0회 확인됨). |
| **P1** | debug API routes | `/api/debug/*` 프로덕션 노출 위험. `NODE_ENV` 분기. |
| P2 | tsconfig target ES2017 | ES2022로 상향. 후속. |

### 권장 디렉토리 구조

```
src/
├── app/
│   ├── page.tsx                  (홈 — 7블록 순서)
│   ├── diary/
│   │   ├── page.tsx              (탭 라우터, ~30줄)
│   │   ├── TodayTab.tsx          (~120줄)
│   │   ├── WeekTab.tsx           (~120줄)
│   │   └── MonthTab.tsx          (~120줄)
│   ├── haru/page.tsx             (~80줄)
│   ├── settings/page.tsx         (213줄)
│   └── api/
│       └── (debug → 환경 분기)
├── components/
│   ├── ui/
│   │   ├── Toast.tsx             ★ NEW
│   │   └── ReviewModal.tsx       ★ NEW (Stage 9 회고 작성)
│   ├── briefing/                 (정리: CharacterTabs/Maeum/Momi 제거)
│   ├── diary/                    ★ NEW
│   │   ├── DateSelector.tsx      (Today selector — 정중앙·일요일 빨강)
│   │   ├── HealthInput.tsx
│   │   ├── MemoSection.tsx
│   │   ├── WeekChart.tsx
│   │   ├── CalendarGrid.tsx      (회고 색상 시스템)
│   │   └── TimeNav.tsx           (‹ 라벨 › 공통)
│   └── chat/                     ★ NEW
│       ├── ChatMessage.tsx
│       └── ChatInput.tsx
├── hooks/                        ★ NEW
│   ├── useChatMessages.ts
│   ├── useAutoSave.ts
│   ├── useHealthLog.ts
│   ├── useReviews.ts
│   └── useToast.ts
├── lib/
│   ├── ai/  data/  theme/  types/
│   ├── chat/keywords.ts          ★ NEW
│   ├── markdown.ts               ★ NEW
│   └── supabase/
│       ├── api.ts                (기존)
│       └── queries.ts            ★ NEW (React Query wrappers)
└── styles/                       ★ NEW (Tailwind 토큰 확장)
```

### 영역 5 채택 항목 (multiselect)
- **P0** 다이어리 3탭 분리
- **P0** React Query 도입
- **P1** Tailwind 점진 마이그레이션
- **P1** Dead code 정리 (영역 4와 함께)
- **P1** debug API routes 환경 분기
- P2 tsconfig target 상향 (보류 가능)

### 화면
- [`14_area4-deep.html`](./14_area4-deep.html) — 영역 4 깊이 평가
- [`15_area5-architecture.html`](./15_area5-architecture.html) — 영역 5 아키텍처
- [`16_changes-impact.html`](./16_changes-impact.html) — Before/After 임팩트 분석 (사용자 학습용)

### Claude 추천
A — P0+P1 모두 채택

### 사용자 코멘트 (원문 보존)

> 이렇게 수정하면 뭐가 달라져?
>
> (Claude가 사용자/개발/시스템 3축으로 Before/After 표 제시 후)
>
> P0, P1을 진행해주세요.

### 채택 결정 (영역 4 + 5 종합)

**P0 — 반드시**
1. 다이어리 3탭 분리 (TodayTab 621→~120, MonthTab 478→~120, WeekTab 441→~120)
2. React Query 도입 (`@tanstack/react-query`)

**P1 — 하면 좋음**
3. `/haru` 6개 책임 분리 (467→~80줄 + 보조 6파일)
4. 자동 저장 토스트 추가
5. `/settings` 안내 문구 갱신 ("친구들" → "하루")
6. Dead code 정리 (friends + CharacterTabs + MaeumView + MomiView, ~900줄)
7. debug API routes 환경 분기
8. Tailwind 점진 마이그레이션 (새 코드 우선)

**P2 — 보류**
9. tsconfig ES2022 (얻는 게 작아서 후속 라운드)

### 다음 단계
- 통합 spec 문서 작성: [`SPEC.md`](./SPEC.md)
- design-history.html / design-evolution-report.html에 영역 4·5 추가
- spec self-review → 사용자 검토 → writing-plans 인계
