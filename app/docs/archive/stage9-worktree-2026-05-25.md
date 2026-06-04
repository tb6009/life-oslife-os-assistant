# stage-9 워크트리 아카이브 (2026-05-25)

## 배경

`app-stage9/` 워크트리(브랜치 `stage-9/v0.9-release`)가 폴더 이동(`061_LifeOS/` → `06_Personal_Project/061_LifeOS/`)으로 git 포인터가 깨진 상태였음.

상태 점검 결과:
- **브랜치 커밋**: 모두 main에 머지됨 (`git cherry main stage-9/v0.9-release` 비어있음, merge-base = stage-9 tip = `d36a576`)
- **워크트리 폴더**: 커밋되지 않은 새 파일 다수 (테스트 인프라 + 컴포넌트 분리 작업 중단된 흔적)
- main은 그 사이 v0.9.4 ~ v0.9.6으로 진전 (Work/Thesis 탭, 활동 추적기 등)

판단: 워크트리 폐기. 단, 복구 가능하도록 아카이브 보존.

---

## 보존 자산

### 1. Git 태그
- `archive/stage-9-tip` → `d36a576` (stage-9/v0.9-release tip)
  - 브랜치 ref가 삭제되어도 커밋은 보존됨
  - `git checkout archive/stage-9-tip` 또는 `git log archive/stage-9-tip`으로 접근

### 2. 미커밋 파일 tarball
`docs/archive/stage9-uncommitted-2026-05-25.tar.gz` (22KB)

포함 파일 (워크트리에만 존재했고 main에 없던 새 파일):

**테스트 인프라**
- `vitest.config.mts`
- `src/test-setup.ts`
- `package.json` (devDeps에 vitest, @testing-library/*, jsdom, @vitejs/plugin-react, vite-tsconfig-paths, @tanstack/react-query-devtools 추가됨)

**컴포넌트 분리 (chat)**
- `src/components/chat/ChatInput.tsx`
- `src/components/chat/ChatMessage.tsx`

**컴포넌트 분리 (diary, 19개)**
- `src/components/diary/CalendarGrid.tsx`
- `src/components/diary/DateSelector.tsx`
- `src/components/diary/HealthInput.tsx`
- `src/components/diary/MemoSection.tsx`
- `src/components/diary/MonthAIReport.tsx`
- `src/components/diary/MonthHealthCharts.tsx`
- `src/components/diary/MonthInsights.tsx`
- `src/components/diary/MonthReview.tsx`
- `src/components/diary/RoutineSection.tsx`
- `src/components/diary/ScheduleSection.tsx`
- `src/components/diary/TimeNav.tsx`
- `src/components/diary/WeekAIReport.tsx`
- `src/components/diary/WeekChart.tsx`
- `src/components/diary/WeekDailyList.tsx`
- `src/components/diary/WeekEmotionBar.tsx`
- `src/components/diary/WeekHealthCharts.tsx`
- `src/components/diary/WeekReview.tsx`
- `src/components/diary/WeekStatCards.tsx`

**UI 공통**
- `src/components/ui/ReviewModal.tsx`
- `src/components/ui/Toast.tsx`

**Hooks**
- `src/hooks/useAutoSave.ts`
- `src/hooks/useChatMessages.ts`
- `src/hooks/useReviewStatus.ts`
- `src/hooks/useToast.tsx`

**Lib**
- `src/lib/chat/keywords.ts`
- `src/lib/time/range.ts`
- `src/lib/markdown.ts`
- `src/lib/react-query.ts`
- `src/lib/supabase/queries.ts`

**API 가드**
- `src/app/api/debug/_guard.ts` (debug 라우트를 production에서 401 차단)

**테스트 파일 (27개)**
- `src/components/__tests__/BottomNav.test.tsx`
- `src/components/ui/__tests__/{ReviewModal,Toast}.test.tsx`
- `src/components/chat/__tests__/{ChatInput,ChatMessage}.test.tsx`
- `src/components/diary/__tests__/*.test.tsx` (10개)
- `src/hooks/__tests__/*.test.tsx` (4개)
- `src/lib/__tests__/{markdown,sanity}.test.ts`
- `src/lib/chat/__tests__/keywords.test.ts`
- `src/lib/time/__tests__/range.test.ts`
- `src/lib/supabase/__tests__/queries.test.tsx`
- `src/app/api/debug/__tests__/guard.test.ts`
- `src/app/settings/__tests__/page.test.tsx`

---

## 복구 방법

### 케이스 A — 테스트 인프라만 다시 도입하고 싶을 때

```bash
cd /Users/jinhyunpark/Documents/cloude_Code/06_Personal_Project/061_LifeOS/app
mkdir -p /tmp/stage9-restore
tar xzf docs/archive/stage9-uncommitted-2026-05-25.tar.gz -C /tmp/stage9-restore
# 필요한 파일만 골라 복사
cp /tmp/stage9-restore/vitest.config.mts ./
cp /tmp/stage9-restore/src/test-setup.ts src/
# package.json은 devDeps만 머지 (덮어쓰면 main 변경분 손실)
```

### 케이스 B — diary 컴포넌트 분리 작업을 다시 시도할 때

main의 `src/app/diary/*Tab.tsx`는 이미 분리된 컴포넌트를 import하지 않는 통합 구조임. stage-9의 분리본을 그대로 가져와도 main의 Work/Thesis 탭 추가분과 호환 안 됨 → **참고용 패턴**으로만 활용 권장.

### 케이스 C — 전체 브랜치 상태 그대로 재현

```bash
cd /Users/jinhyunpark/Documents/cloude_Code/06_Personal_Project/061_LifeOS/app
git worktree add ../stage9-restore archive/stage-9-tip
cd ../stage9-restore
tar xzf ../app/docs/archive/stage9-uncommitted-2026-05-25.tar.gz
# 이제 stage-9 워크트리 상태 그대로 복원됨
```

---

## 폐기 사유 요약

1. 브랜치 커밋은 main에 100% 머지 완료 — 손실 없음
2. 미커밋 작업은 main이 다른 방향(Work/Thesis 탭 추가, 통합 구조)으로 진전한 상태에서 그대로 합치기 어려움
3. 가치 있는 부분(테스트 인프라, _guard.ts 패턴)은 tarball에 보존
4. 깨진 워크트리를 방치하면 `git worktree list`에 `prunable` 잔여물로 남아 헷갈림
