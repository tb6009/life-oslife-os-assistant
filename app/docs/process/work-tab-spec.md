# Work 서브탭 — 구현 스펙

> 기록(Diary) > Today / Week / Month / **Work**
> 프로젝트별 코멘트 기록 기능

---

## 1. 목적

LifeOS 기록 탭에서 매일의 프로젝트 작업 코멘트를 직접 입력.
063 workDashboard 주간 업데이트의 데이터 소스로 활용.

## 2. 변경 범위

```
수정 파일 (3개):
├── src/app/diary/page.tsx          — tabs 배열에 "Work" 추가, WorkTab import
├── src/lib/supabase/api.ts         — project_comments CRUD 함수 4개
└── (Supabase Dashboard)            — project_comments 테이블 생성

신규 파일 (1개):
└── src/app/diary/WorkTab.tsx       — Work 서브탭 컴포넌트
```

## 3. Supabase 테이블

```sql
CREATE TABLE project_comments (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id  varchar(20)  NOT NULL,       -- '061', '063', '03_새론' 등
  project_name varchar(100),               -- 'LifeOS', '대시보드' (표시용, 선택)
  comment     text         NOT NULL,
  date        date         NOT NULL DEFAULT CURRENT_DATE,
  created_at  timestamptz  NOT NULL DEFAULT now()
);

-- 날짜 역순 조회용 인덱스
CREATE INDEX idx_project_comments_date ON project_comments (date DESC);
```

> Supabase Dashboard > SQL Editor에서 위 SQL 실행.

## 4. API 함수 (src/lib/supabase/api.ts)

기존 패턴(getTodos, addTodo 등)과 동일하게 추가:

```typescript
// ── Project Comments ──

// 특정 날짜 범위의 코멘트 조회 (최신순)
export async function getProjectComments(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from("project_comments")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("created_at", { ascending: false });
  if (error) console.error("getProjectComments error:", error);
  return data ?? [];
}

// 코멘트 추가
export async function addProjectComment(
  projectId: string,
  projectName: string,
  comment: string,
  date: string
) {
  const { error } = await supabase
    .from("project_comments")
    .insert({ project_id: projectId, project_name: projectName, comment, date });
  if (error) console.error("addProjectComment error:", error);
}

// 코멘트 삭제
export async function deleteProjectComment(id: number) {
  const { error } = await supabase
    .from("project_comments")
    .delete()
    .eq("id", id);
  if (error) console.error("deleteProjectComment error:", error);
}

// 프로젝트별 최근 코멘트 (프로젝트 상세 페이지용)
export async function getProjectCommentsByProject(projectId: string, limit = 20) {
  const { data, error } = await supabase
    .from("project_comments")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) console.error("getProjectCommentsByProject error:", error);
  return data ?? [];
}
```

## 5. WorkTab UI 구성 (src/app/diary/WorkTab.tsx)

### 레이아웃

```
┌─────────────────────────────────────┐
│  WORK LOG                           │
│                                     │
│  프로젝트 선택 (칩 버튼 가로 스크롤)    │
│  [061 LifeOS] [063 대시보드] [091 출판] │
│  [10 마음] [03_새론] [+ 직접입력]      │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 코멘트 입력...               │    │
│  └─────────────────────── [전송]│    │
│                                     │
│  ─── 오늘 ───                       │
│  061 LifeOS                         │
│  Calendar KST 수정 완료           ✕  │
│                                     │
│  063 대시보드                        │
│  W20 데이터 업데이트              ✕  │
│                                     │
│  ─── 어제 ───                       │
│  03_새론솔루션                       │
│  시안 3종 목업 완성               ✕  │
│                                     │
│  (더 보기...)                       │
└─────────────────────────────────────┘
```

### 프로젝트 선택 칩

최근 활동 프로젝트 상위 8개를 칩 버튼으로 표시.
마지막에 `[+ 직접입력]` 칩 → 클릭 시 프로젝트 ID + 이름 직접 입력.

하드코딩 초기 목록 (나중에 063 대시보드 JSON에서 pull 가능):

```typescript
const RECENT_PROJECTS = [
  { id: "061", name: "LifeOS" },
  { id: "063", name: "대시보드" },
  { id: "091", name: "출판기획" },
  { id: "10",  name: "마음 챗봇" },
  { id: "03_새론", name: "새론솔루션" },
  { id: "065", name: "인터뷰" },
  { id: "062", name: "논문리더" },
  { id: "32",  name: "강연시리즈" },
];
```

### 코멘트 타임라인

- 최근 7일 코멘트를 날짜별 그룹으로 표시
- 각 항목: 프로젝트명 (칩 컬러) + 코멘트 텍스트 + ✕ 삭제
- 빈 날짜는 표시 안 함

### 스타일 규칙

- 기존 LifeOS 스타일 100% 준수 (inline style, 흰 배경, 블루 액센트)
- 프로젝트 칩: 선택 시 `#60A5FA` 배경 + 흰 글자, 비선택 시 `#f5f5f5` + `#333`
- 코멘트 입력: TodayTab의 Memo 입력과 동일한 패턴
- 삭제 버튼: Recommendation/Schedule의 ✕ 패턴과 동일

## 6. diary/page.tsx 수정

```typescript
// 변경 전
const tabs = ["Today", "Week", "Month"] as const;

// 변경 후
const tabs = ["Today", "Week", "Month", "Work"] as const;

// import 추가
import WorkTab from "./WorkTab";

// 렌더링 추가
{activeTab === "Work" && <WorkTab />}
```

## 7. 구현 순서

```
1. Supabase SQL 실행 (테이블 생성)
   → 검증: Supabase Dashboard에서 project_comments 테이블 확인

2. api.ts에 CRUD 함수 4개 추가
   → 검증: 기존 함수 패턴과 동일, 타입 에러 없음

3. WorkTab.tsx 신규 작성
   → 검증: npm run build 성공

4. diary/page.tsx에 Work 탭 추가
   → 검증: dev 서버에서 기록 > Work 탭 진입, 코멘트 입력/표시/삭제 동작

5. 커밋 + 배포
   → 검증: Vercel 배포 후 모바일에서 Work 탭 사용 가능
```

## 8. 하지 않는 것

- 063 대시보드 연동 (별도 작업)
- 프로젝트 목록 자동 동기화 (초기에는 하드코딩)
- 코멘트 편집 기능 (삭제 후 재입력으로 충분)
- 통계/차트 (향후 확장)

## 9. 063 대시보드 연동 (향후)

Work 탭에 쌓인 코멘트를 063 대시보드에서 활용하는 방법:

```
주간 업데이트 시:
1. Supabase에서 해당 주의 project_comments 조회
2. 프로젝트별로 그룹핑
3. W20.json의 projects[].did / decisions[] 에 반영
4. 프로젝트 상세 페이지(/projects/[id])에 코멘트 타임라인 표시
```

이 연동은 Work 탭이 안정화된 후 별도 작업으로 진행.
