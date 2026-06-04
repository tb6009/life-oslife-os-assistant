# Life OS 개발 로그

> 2026-05-02 (토) | 프로젝트 시작부터 MVP 완성까지 하루 기록

---

## 프로젝트 개요

**목표**: 박진현 교수의 개인 라이프 관리 마크다운 시스템(진/모미/마음 3캐릭터)을 웹+모바일 앱으로 구현

**기술 스택**: Next.js 16 + Tailwind CSS v4 + Supabase + ChatGPT API

**결과물**: https://life-os-7wj2.vercel.app

---

## 진행 순서

### Phase 1: 디자인 (오전)

1. **디자인 무드보드 작성** (`personal/design-moodboard.html`)
   - 3가지 컬러 팔레트 제안 (Teal / Mono Blue / Calm Lavender)
   - 4가지 타이포그래피 조합 제안
   - 캐릭터별 액센트 컬러 시스템

2. **디자인 방향 확정**
   - 흰 배경, 텍스트 중심, 형태 최소화
   - 텍스트: 100% Black(강조) + 80% Gray(본문)
   - 유일한 색: 시간에 따라 변하는 단일 액센트 (Blue/Warm/Ink)
   - 영문 제목(Outfit) + 한글 본문(Noto Sans KR)

3. **인터랙티브 프로토타입** (`personal/prototype-briefing.html`)
   - 날씨 헤더 + 하늘 그라디언트 12종
   - 시간대/컬러 전환 가능한 실제 브리핑 화면
   - 여러 차례 디자인 미세조정 (그라디언트 폭, 온도 위치, 영역 높이)

### Phase 2: 프로젝트 셋업 (오후)

4. **Next.js 프로젝트 생성**
   - npm 캐시 권한 오류 → `sudo chown` 으로 해결
   - Outfit + Noto Sans KR 폰트 설정
   - 디자인 토큰 파일 작성 (tokens.ts, timeColor.ts)

### Phase 3: 브리핑 화면 구현

5. **컴포넌트 개발**
   - WeatherHero: 하늘 그라디언트 + 기온
   - Greeting: Good Morning + 날짜
   - BriefingBlock: Today → Tomorrow → Yesterday
   - CharacterTabs: 진/모미/마음 하단 탭
   - TodoList: 할 일 추가/체크
   - DailyInsight: 컨디션 요약 + 생활 제안

### Phase 4: 데이터 연동

6. **Supabase 설정**
   - 6개 테이블 생성 (health_logs, journal_entries, chat_messages, todos, daily_insights, monthly_reviews)
   - RLS 정책 설정 → 처음에 데이터 저장이 안 되는 문제 발생

7. **Google Calendar 연동**
   - Google Calendar MCP로 실제 일정 가져오기
   - Supabase schedules 테이블에 저장
   - 앱에서 자동 로드

8. **AI 캐릭터 연동**
   - 모미/마음 v1.5 시스템 프롬프트 작성
   - Claude API → ChatGPT API 전환
   - 대화 기록 Supabase 저장

### Phase 5: 배포

9. **GitHub + Vercel 배포**
   - GitHub 비공개 repo 생성
   - Vercel 연결 + 환경변수 설정
   - 자동 배포 파이프라인 완성

---

## 핵심 문제 및 해결

### 1. npm 캐시 권한 오류
- **문제**: `npm install` 시 `EACCES: permission denied` 에러
- **원인**: 이전 npm 버전의 버그로 root 소유 파일이 캐시에 남음
- **해결**: `sudo chown -R 501:20 "/Users/jinhyunpark/.npm"`

### 2. Supabase RLS 정책으로 데이터 저장 실패
- **문제**: 앱에서 health_logs, chat_messages 등에 데이터 저장이 안 됨
- **원인**: Supabase가 기본적으로 RLS를 활성화하여 anon key로 쓰기 차단
- **해결**: 모든 테이블에 `create policy "allow all" ... using (true) with check (true)` 적용
- **교훈**: Supabase 테이블 생성 시 RLS 정책을 함께 설정해야 함

### 3. 건강 데이터 업데이트 안 됨 (수면 시간 7시간 고정)
- **문제**: 수면 시간을 4시간 38분으로 변경해도 계속 7시간으로 표시
- **원인**: `upsertHealthLog` 함수가 기존 데이터를 병합할 때 `id`, `created_at` 등 읽기 전용 필드를 함께 업데이트 시도
- **해결**: 업데이트 시 변경할 필드만 추출하여 전송
- **교훈**: Supabase update 시 generated/readonly 컬럼을 포함하면 안 됨

### 4. iOS Safari 입력 시 자동 확대(zoom)
- **문제**: 아이폰에서 입력창을 터치하면 화면이 확대되어 레이아웃 깨짐
- **원인**: iOS Safari는 font-size가 16px 미만인 input/textarea를 터치하면 자동 확대
- **해결**: 
  - 모든 input/textarea의 인라인 font-size를 `16px`로 변경
  - viewport 메타 태그에 `maximumScale: 1, userScalable: false` 설정
  - Next.js App Router에서는 `export const viewport` 로 별도 export 필요
- **교훈**: 모바일 웹에서 입력 폰트는 반드시 16px 이상

### 5. Claude API 모델 ID 오류
- **문제**: 모미/마음 AI 대화가 매번 같은 폴백 응답만 반환
- **원인**: 모델 ID `claude-sonnet-4-20250514`가 존재하지 않는 모델
- **해결**: `claude-sonnet-4-6`으로 수정
- **후속**: Anthropic 크레딧 부족으로 ChatGPT API(gpt-4o-mini)로 전환

### 6. Vercel 빌드 에러
- **문제**: 모든 Vercel 배포가 Error 상태
- **원인**: TypeScript 타입 오류 — NextAuth session 객체 캐스팅
- **해결**: `(session as any).accessToken` 으로 타입 우회
- **교훈**: 로컬 `npm run build`로 먼저 확인 후 push

### 7. 날짜 데이터 불일치
- **문제**: 오늘이 토요일인데 Today가 금요일로 표시
- **원인**: 목데이터를 수동으로 입력하면서 날짜를 잘못 계산
- **해결**: Google Calendar API로 실제 일정 재조회 후 수정
- **교훈**: 날짜 관련 데이터는 자동화가 필수

### 8. 날씨 텍스트 색상 안 보임
- **문제**: 밤/저녁 시간대에 맑음, 최저/최고 온도 텍스트가 흰색으로 안 보임
- **원인**: `isDark` 판별에 따라 흰색 텍스트 적용, 하지만 그라디언트 하단이 흰색이라 겹침
- **해결**: 모든 날씨 텍스트를 항상 검은색(#000000)으로 고정

---

## 현재 아키텍처

```
Life OS App
├── Frontend: Next.js 16 (App Router) + Tailwind CSS v4
├── Backend: Supabase (PostgreSQL + Storage)
├── AI: ChatGPT API (gpt-4o-mini)
├── 배포: Vercel (자동 배포)
└── 소스: GitHub (tb6009/life-os, private)
```

### 데이터 흐름
```
사용자 입력 → Supabase DB 저장
                ↓
페이지 로드 → Supabase에서 읽기 → 화면 표시
                ↓
모미/마음 대화 → ChatGPT API → 응답 표시 + DB 저장
                ↓
Google Calendar → (수동 동기화) → Supabase schedules
```

### DB 테이블
| 테이블 | 용도 |
|--------|------|
| health_logs | 수면/운동/컨디션 (모미) |
| journal_entries | 감정/일기 (마음) |
| chat_messages | 대화 기록 (날짜별) |
| todos | 할 일 목록 |
| schedules | 캘린더 일정 |
| daily_insights | 일일 인사이트 |
| monthly_reviews | 월간 리뷰 |

---

## 커밋 히스토리 (26 commits)

| # | 커밋 | 내용 |
|---|------|------|
| 1 | Initial commit | Next.js 프로젝트 생성 |
| 2 | feat: 모닝 브리핑 화면 | 날씨 헤더, 3블록, 캐릭터 탭, Todo |
| 3 | feat: 대화 기능 + Calendar | 모미/마음 대화 UI, Google Calendar 데이터 |
| 4 | feat: Daily Insight | 컨디션 요약 + 생활 제안 |
| 5 | feat: Supabase 연결 | Todo, 대화, 월간 리뷰 DB |
| 6 | feat: Claude API | AI 대화 시스템 프롬프트 |
| 7 | feat: 설정 패널 | 앱에서 API 키 입력 |
| 8 | feat: 건강/감정 DB | 입력 즉시 저장 + 상태 반영 |
| 9 | fix: OK 버튼 | Health Status 저장 버튼 |
| 10 | fix: iPhone 레이아웃 | 390px + 하단 탭 고정 |
| 11 | fix: 수면 입력 | 시간+분 분리, 운동↔컨디션 순서 |
| 12 | feat: 실시간 반영 | 몸/마음 기록 3초 폴링 |
| 13 | feat: 반응형 + AI 컨텍스트 | Health 데이터를 AI에 전달 |
| 14 | fix: 모미/마음 레이아웃 | overflow 방지 |
| 15 | fix: iOS zoom | viewport + font-size 16px |
| 16 | fix: iOS zoom (인라인) | 모든 input 16px 강제 |
| 17 | fix: 날짜 수정 | 5/3 → 5/2 기준 |
| 18 | feat: Google Calendar OAuth | NextAuth + Calendar API |
| 19 | fix: 빌드 에러 | TypeScript 타입 오류 |
| 20 | fix: 날짜 재수정 | 아고라01=토, 아고라02=일 |
| 21 | fix: DB 업데이트 | upsert 읽기전용 필드 제외 |
| 22 | feat: Supabase 일정 로드 | 캘린더 버튼 제거, 자동 로드 |
| 23 | feat: API 상태 표시 | 미연결 시 빨간색 |
| 24 | fix: API 안내 메시지 | 미연결 시 설명 |
| 25 | feat: ChatGPT 전환 | Claude → OpenAI |
| 26 | fix: 날씨 텍스트 색상 | 항상 검은색 |

---

## 다음 단계 (미완성)

- [ ] ChatGPT API 크레딧 충전 후 AI 대화 테스트
- [ ] Google Calendar 자동 동기화 (현재 수동)
- [ ] 월간 리뷰 자동 생성
- [ ] 실제 날씨 API 연동 (현재 목데이터)
- [ ] iOS 레이아웃 추가 테스트
- [ ] Expo 모바일 앱 (Phase 9)
