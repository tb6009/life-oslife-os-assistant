# Google Calendar OAuth 디버깅 로그

> 2026-05-09 | 총 소요시간: 약 8시간 (09:38 ~ 17:40+)
> 근본 원인: Vercel 환경변수 GOOGLE_CLIENT_SECRET 끝에 줄바꿈(`\n`) 1개

---

## 타임라인

### 09:38 — 시작: Google Calendar 동기화 코드 추가
- `syncSchedulesFromCalendar()` 함수 구현
- `/api/calendar`에서 Google Calendar API → Supabase schedules 저장
- **이 시점에서 OAuth 자체는 이미 작동하지 않는 상태였음** (이전 세션에서도 미해결)

### 10:41 — 홈 로드 시 자동 동기화 시도
- `page.tsx`에서 `fetch("/api/calendar")` 추가
- 결과: 인증 안 된 상태라 조용히 실패

### 11:11 — 설정 페이지에 Google Calendar 연결 UI 추가
- 로그인/로그아웃 버튼, "지금 동기화" 버튼 추가
- OAuth scope `calendar.readonly` → `calendar` (읽기+쓰기)
- **문제 발견**: 설정에서 "Google Calendar 연결" 클릭 → "Server error"

### 11:18 — 첫 번째 시도: getServerSession에 authOptions 전달
- **진단**: `/api/calendar`에서 `getServerSession()` 호출 시 authOptions 미전달 → 세션 항상 null
- **수정**: `authOptions`를 별도 export, `getServerSession(authOptions)` 사용
- **결과**: Server error는 해결되었지만 "Try signing in with a different account" 에러 시작

### 11:56 — NextAuth debug 모드 + 커스텀 에러 페이지
- `debug: true` 추가
- `/auth/error` 커스텀 에러 페이지 생성
- **결과**: 에러 페이지가 보이지 않고 기본 NextAuth 에러 페이지만 표시

### ~12:00 — Google Cloud Console 점검 시작
- OAuth 동의 화면 확인 → "프로덕션 단계"
- 승인된 JavaScript 원본 / 리디렉션 URI 확인 → 정상
- **1차 오판**: Google Cloud 설정 문제라고 판단

### ~12:20 — Google 인증 화면까지는 진행
- "액세스 차단됨: 테스터만 앱에 액세스" 에러
- **진단**: OAuth 동의 화면이 테스트 모드 → tb6009@gmail.com 테스트 사용자 추가
- **결과**: 여전히 차단됨

### ~12:30 — OAuth 동의 화면 scope 추가
- email, profile, openid + calendar scope 추가
- **결과**: 여전히 차단됨

### ~12:35 — 계정 문제 발견
- **핵심 발견**: Google Cloud 프로젝트가 `vdiot07` 계정 소유 — `tb6009@gmail.com`과 다른 계정!
- 이래서 테스트 사용자를 추가해도 프로젝트 소유자가 달라서 적용 안 됨

### ~15:20 — 새 Google Cloud 프로젝트 생성 (tb6009@gmail.com)
- 프로젝트명: LifeOS
- Google Calendar API 활성화
- OAuth 동의 화면 설정 (External)
- 새 OAuth 클라이언트 생성:
  - Client ID: `554628386573-la8n...`
  - Client Secret: `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`
- 승인된 JavaScript 원본 + 리디렉션 URI 설정

### ~15:45 — Vercel 환경변수 업데이트
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET 새 값으로 교체
- **이 시점에서 Client Secret 붙여넣기 시 끝에 줄바꿈(\n) 포함됨** ← 근본 원인
- Redeploy 실행

### ~15:50 — 환경변수 뒤바뀜 발견
- `/api/debug` 엔드포인트로 확인 → NEXTAUTH_URL에 SECRET 값이 들어가 있었음
- NEXTAUTH_URL과 NEXTAUTH_SECRET 값 교체 수정
- **결과**: 여전히 "Try signing in with a different account"

### ~16:00 — 테스트 사용자 + 동의 화면 재설정
- 새 LifeOS 프로젝트에서 tb6009@gmail.com 테스트 사용자 추가
- Google 동의 화면 → Continue → 권한 허용까지 성공!
- **하지만** 콜백에서 여전히 실패

### ~16:12 — 디버그 API 추가
- `/api/debug` — 환경변수 상태 확인
- `/api/debug/oauth` — 쿠키 상태 확인
- `/api/debug/headers` — Vercel 헤더 확인

### ~16:30 — calendar API 무한 호출 발견
- 로그에서 `/api/calendar`가 무한 반복 호출되는 것 확인
- `sessionStorage`로 1회만 실행하도록 수정
- Google Calendar 중복 데이터 36건 삭제 (요가 37건 → 1건)

### ~17:00 — 쿠키 prefix 이론 (2차 오판)
- **가설**: Vercel에서 `__Host-` vs `__Secure-` 쿠키 prefix 불일치
- 에이전트 투입하여 전체 NextAuth 코드 분석
- 쿠키 6개 모두 명시적 선언
- **결과**: 여전히 실패

### ~17:18 — `delete process.env.VERCEL` 시도 (3차 오판)
- NextAuth가 `VERCEL=1` 감지 시 `__Host-` 강제 사용하는 것 방지
- **결과**: 모듈 로드 타이밍 문제로 효과 없음

### ~17:33 — CSRF 쿠키 `__Host-`로 통일 (4차 오판)
- Vercel 기본값과 일치시키는 방향
- **결과**: 여전히 실패

### ~17:36 — Vercel 런타임 로그 직접 확인 → 근본 원인 발견!
- **로그 메시지**: `"The provided client secret is invalid."`
- **결정적 증거**: `"clientSecret": "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\n"`
- **끝에 `\n` (줄바꿈) 1개**가 포함되어 있었음!

### ~17:40 — 해결
- Vercel 환경변수에서 GOOGLE_CLIENT_SECRET 값 재입력 (줄바꿈 제거)
- Redeploy → 로그인 성공

---

## 근본 원인 분석

```
"clientSecret": "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\n"
                                                       ^^
                                              이 줄바꿈 1개
```

Vercel Environment Variables 입력 시 값 끝에 줄바꿈(`\n`)이 포함되었음.
Google OAuth 토큰 교환 시 이 값이 그대로 전달되어 `invalid_client` 에러 발생.

## 왜 이렇게 오래 걸렸나?

### 1. 에러 메시지가 문제를 숨김 (7시간)
- NextAuth는 모든 OAuth 콜백 에러를 `"Try signing in with a different account"`로 표시
- 실제 에러(`invalid_client_secret`)는 서버 로그에서만 확인 가능
- **교훈**: 처음부터 Vercel 런타임 로그를 확인했어야 함

### 2. Google Cloud 계정 혼동 (2시간)
- 프로젝트가 `vdiot07` 계정 소유인데 `tb6009@gmail.com`으로 로그인 시도
- 테스트 사용자 추가해도 프로젝트 소유자가 달라서 미적용
- **교훈**: 프로젝트 소유자 계정부터 확인

### 3. 쿠키 이론에 빠짐 (1.5시간)
- 로컬에서 되고 Vercel에서 안 되니까 "Vercel 쿠키 문제"로 추정
- `__Host-` vs `__Secure-` prefix 차이 분석에 시간 소모
- 실제로는 쿠키와 전혀 무관한 client_secret 문제
- **교훈**: 가설 검증 전에 서버 로그부터 확인

### 4. Vercel 환경변수 입력 UI의 함정
- 텍스트 입력란에서 값을 붙여넣을 때 줄바꿈이 자동 포함
- 값이 `Sensitive`로 마스킹되어 확인 불가
- debug API를 만들어도 `SET (36 chars)`로만 표시 (36 vs 37 차이를 놓침)
- **교훈**: 환경변수 입력 후 char count까지 검증 필요

## 시도 횟수 및 커밋

| # | 시도 | 결과 | 소요 |
|---|------|------|------|
| 1 | getServerSession에 authOptions 전달 | Server error 해결, 로그인은 실패 | 20분 |
| 2 | debug 모드 + 에러 페이지 | 에러 코드 확인 불가 | 15분 |
| 3 | Google Cloud Console 점검 | 동의 화면/scope 문제 아님 | 40분 |
| 4 | 테스트 사용자 추가 | 계정 불일치로 실패 | 30분 |
| 5 | 새 Google Cloud 프로젝트 생성 | 동의 화면 통과, 콜백 실패 | 50분 |
| 6 | 환경변수 값 교체 | NEXTAUTH_URL/SECRET 뒤바뀜 발견·수정 | 20분 |
| 7 | calendar 무한 호출 수정 | 무한 로딩 해결 | 15분 |
| 8 | 쿠키 prefix 통일 (에이전트) | 효과 없음 | 40분 |
| 9 | VERCEL 환경변수 삭제 | 효과 없음 | 15분 |
| 10 | CSRF __Host__ 통일 | 효과 없음 | 15분 |
| 11 | **Vercel 런타임 로그 확인** | **`\n` 발견 → 해결** | 5분 |

**총 11번 시도, 10번 실패, 1번 성공**
**실제 원인 파악에 5분, 나머지 7시간 55분은 잘못된 방향 탐색**

## 재발 방지책

1. **환경변수 검증 API** — char count, trim 후 비교, 특수문자 확인
2. **Vercel 환경변수 입력 시** — 값 끝에 줄바꿈/공백 없는지 반드시 확인
3. **OAuth 문제 시 최우선** — Vercel 런타임 로그(`/logs`) 확인
4. **에러 추적 순서** — 서버 로그 → 환경변수 값 → 네트워크 → 쿠키/세션 (역순 금지)

---

*작성일: 2026-05-10*
*관련 커밋: 65e2aac → bb406d5 (13개 커밋)*
