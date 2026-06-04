# Life OS Design Foundations

> 디자인 시스템의 뿌리. 모든 컴포넌트와 화면은 이 Foundation 위에 만들어집니다.

---

## 1. Brand Identity

### 1-1. 미션

```
"나의 삶을 기록하고, 돌아보고, 더 나은 내일을 만든다"
```

### 1-2. 핵심 가치

| 가치 | 의미 | 디자인 반영 |
|------|------|------------|
| **자기 인식** | 나의 상태를 알아차린다 | 건강/감정 기록, Daily Insight |
| **대화** | 판단 없이 함께 생각한다 | 하루 MI 공감 대화 |
| **꾸준함** | 작은 습관이 쌓인다 | 루틴 연속 기록, 🔥 |
| **회고** | 돌아봐야 나아간다 | 주간/월간 리포트 + 회고 |

### 1-3. 성격 (Brand Personality)

```
차분한  ████████░░  (강함)
따뜻한  ███████░░░  (강함)
실용적  █████████░  (매우 강함)
미니멀  █████████░  (매우 강함)
유머    ███░░░░░░░  (약함 — 하루 대화에서만)
```

### 1-4. 톤 매트릭스

| 상황 | 톤 | 예시 |
|------|-----|------|
| 브리핑 (진) | 차분하고 정돈된 | "오늘 일정은 2건입니다" |
| 대화 (하루) | 따뜻하고 공감적 | "피곤하시구나... 어젯밤 잘 주무셨어요?" |
| 기록 | 객관적, 데이터 중심 | "평균 수면 6.2시간" |
| 제안 | 부드러운 제안 | "정리해드릴까요?" |
| 격려 | 조용한 응원 | "5일째 하고 계십니다 🔥" |

---

## 2. Color Foundation

### 2-1. Primitive Colors (원시 컬러)

디자인 시스템의 가장 기본 단위. 직접 사용하지 않고 Semantic Token으로 매핑.

```
Gray Scale
gray-0:   #FFFFFF
gray-50:  #FAFAFA
gray-100: #F8F8F8
gray-150: #F2F2F2
gray-200: #E6E6E6
gray-300: #B3B3B3
gray-400: #808080
gray-600: #333333
gray-900: #000000

Blue Scale
blue-300: #93C5FD
blue-400: #60A5FA  ← 메인 액센트
blue-500: #3B82F6
blue-600: #2563EB

Functional
green-600:  #059669
violet-500: #8B5CF6
red-500:    #DC2626
```

### 2-2. Semantic Tokens (의미 컬러)

```
text-primary:     gray-900  (#000000)   — 제목, 강조
text-body:        gray-600  (#333333)   — 본문
text-secondary:   gray-400  (#808080)   — 보조 설명
text-disabled:    gray-300  (#B3B3B3)   — 비활성, 완료

surface-primary:  gray-0    (#FFFFFF)   — 전체 배경
surface-card:     gray-50   (#FAFAFA)   — 카드, 요약
surface-input:    gray-100  (#F8F8F8)   — 입력 필드
surface-subtle:   gray-150  (#F2F2F2)   — 태그 배경

border-default:   gray-200  (#E6E6E6)   — 구분선, 입력 테두리
border-light:     gray-150  (#F2F2F2)   — 약한 구분

accent-primary:   blue-400  (#60A5FA)   — 활성, 달성, 링크
accent-highlight: blue-500  (#3B82F6)   — 호버, 강조
accent-subtle:    blue-400/10%          — 액센트 배경

status-health:    green-600 (#059669)   — 건강 태그
status-emotion:   violet-500(#8B5CF6)   — 감정 태그
status-danger:    red-500   (#DC2626)   — 삭제, 위험

chart-positive:   blue-400  (#60A5FA)   — 달성/목표 이상
chart-neutral:    gray-200  (#E6E6E6)   — 미달성/기본
chart-empty:      gray-150  (#F0F0F0)   — 데이터 없음
```

### 2-3. Emotion Colors (감정 전용)

감정만 예외적으로 다색 사용. 다른 영역에서는 사용 금지.

```
emotion-joy:        #FBBF24  (골드)
emotion-calm:       #60A5FA  (블루)
emotion-excited:    #F472B6  (핑크)
emotion-grateful:   #34D399  (민트)
emotion-lethargy:   #94A3B8  (슬레이트)
emotion-anxiety:    #A78BFA  (바이올렛)
emotion-irritated:  #FB923C  (오렌지)
emotion-sad:        #818CF8  (인디고)
emotion-tired:      #CBD5E1  (라이트그레이)
emotion-lonely:     #C4B5FD  (라벤더)
```

---

## 3. Typography Foundation

### 3-1. Font Stack

```css
--font-heading: 'Outfit', -apple-system, sans-serif;
--font-body: 'Noto Sans KR', -apple-system, sans-serif;
--font-mono: 'SF Mono', 'JetBrains Mono', monospace;
```

### 3-2. Type Scale

8px 기반 모듈러 스케일 (ratio ≈ 1.2)

```
Level    Size      Weight   Line-Height   Use
─────────────────────────────────────────────
display  5.4rem    300      1.0           날씨 온도
h1       1.5rem    700      1.2           인사말 (Good Morning)
h2       1.3rem    700      1.2           페이지 타이틀
h3       1.1rem    600      1.3           Today 요일
body-lg  0.9rem    400~500  1.6           인사이트 제안
body     0.84rem   400      1.65          본문, 대화
body-sm  0.78rem   400      1.5           보조 텍스트
caption  0.72rem   400      1.4           시간, 부가 정보
label    0.6rem    500      1.0           섹션 라벨 (UPPERCASE)
micro    0.55rem   400~500  1.0           차트 라벨, 범례
```

### 3-3. Font Loading Strategy

```
- display: swap (텍스트 먼저 표시, 폰트 로드 후 교체)
- Outfit: variable font (wght 300~700)
- Noto Sans KR: 300, 400, 500, 700 (4개 웨이트만)
- 프리로드: Outfit 400 + Noto Sans KR 400 (critical)
```

---

## 4. Spacing Foundation

### 4-1. Base Unit: 4px

```
space-1:   4px    — 아이콘-텍스트, 미세 조정
space-2:   8px    — 태그 간격, 리스트 내부
space-3:   12px   — 카드 패딩, 작은 섹션
space-4:   16px   — 일반 섹션 패딩
space-5:   20px   — 섹션 간 간격
space-6:   24px   — 큰 섹션 간격
space-7:   28px   — 페이지 좌우 패딩
space-8:   32px   — 대형 간격
space-10:  40px   — 페이지 상단 패딩
```

### 4-2. Layout Grid

```
Page:
- 좌우 패딩: 28px (space-7)
- 콘텐츠 최대 폭: 100% (반응형, 고정 max-width 없음)

Section:
- 라벨 위 간격: 20px (space-5)
- 라벨-콘텐츠 간격: 8px (space-2)
- 섹션 간 간격: 20px (space-5)

Card:
- 패딩: 12~16px (space-3~4)
- 모서리: 8~10px
```

---

## 5. Shape Foundation

### 5-1. Border Radius

```
radius-sm:   4px    — 차트 바 상단, 작은 요소
radius-md:   6px    — 입력 필드, 작은 버튼
radius-lg:   8~10px — 카드, 요약 박스, 큰 버튼
radius-xl:   12px   — 대화 버블
radius-pill: 20px   — 태그, 감정 버튼
radius-full: 50%    — 체크 원, 상태 점
```

### 5-2. Border

```
border-width:   1px (기본), 1.5px (체크 원), 2px (선택된 컨디션/인디케이터)
border-color:   border-default (#E6E6E6)
border-style:   solid
```

### 5-3. Elevation (그림자)

```
Life OS는 그림자를 사용하지 않습니다.
깊이는 배경색 차이(white → #FAFAFA)와 테두리로 표현합니다.

유일한 예외: 하단 탭 바 상단 테두리 (1px solid #E6E6E6)
```

---

## 6. Motion Foundation

### 6-1. Duration Tokens

```
instant:  0ms     — 체크 상태 전환
fast:     150ms   — 탭 전환, 마이크로 인터랙션
normal:   300ms   — 저장 피드백, 색상 전환
slow:     800ms   — 날씨 그라디언트 전환
```

### 6-2. Easing

```
ease-out:  — 들어올 때 (요소 등장)
ease-in:   — 나갈 때 (요소 사라짐)
linear:    — 사용하지 않음
```

### 6-3. 원칙

```
1. 장식적 애니메이션 없음
2. 상태 전환만 애니메이트 (색상, opacity)
3. 레이아웃 이동 애니메이트 금지 (width, height, top, left)
4. reduced-motion 존중
5. 로딩 중: "생각하는 중..." 텍스트 (스피너 대신)
```

---

## 7. Iconography Foundation

### 7-1. 원칙

```
1. 이모지를 구조적 아이콘으로 사용하지 않음
2. 🔥은 유일한 예외 (루틴 연속 달성)
3. SVG 체크마크만 아이콘으로 사용
4. 아이콘 대신 텍스트 라벨 우선
```

### 7-2. 체크마크 SVG

```svg
<svg width="8" height="6" viewBox="0 0 8 6" fill="none">
  <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" 
        strokeLinecap="round" strokeLinejoin="round" />
</svg>
```

### 7-3. 전송 버튼 SVG

```svg
<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
  <path d="M14 2L7 9M14 2L9.5 14L7 9M14 2L2 6.5L7 9" 
        stroke="white" strokeWidth="1.5" 
        strokeLinecap="round" strokeLinejoin="round" />
</svg>
```

---

## 8. Touch & Interaction Foundation

### 8-1. Touch Targets

```
minimum:   44×44px (Apple HIG)
preferred: 48×48px
spacing:   최소 8px 간격

체크 원: 시각 16px, 행 전체(44px) 터치 영역
버튼: min-height 44px
입력 필드: min-height 44px
감정 태그: min-height 34px, 간격 8px
```

### 8-2. States

```
Default:   기본 색상
Hover:     accent-highlight (데스크탑만)
Active:    opacity 0.8 또는 scale 0.98
Disabled:  opacity 0.38, cursor: not-allowed
Selected:  accent-primary 배경/테두리
```

### 8-3. Feedback

```
체크 토글: 즉시 (0ms)
저장: 버튼 색 전환 (300ms) + "저장 완료" 텍스트
로딩: "생각하는 중..." + 버튼 비활성
에러: (TODO) 입력 테두리 빨강 + 메시지
```

---

## 9. Data Visualization Foundation

### 9-1. Chart Color Rules

```
단일 지표 (수면, 컨디션):
  달성(목표 이상): chart-positive (#60A5FA)
  미달성:         chart-neutral  (#E6E6E6)
  데이터 없음:     chart-empty    (#F0F0F0)

비율 지표 (달성률):
  opacity = 달성률/100 (최소 0.2)
  예: 72% → rgba(96,165,250, 0.72)

감정:
  각 감정별 고유 컬러 (emotion-* 토큰)

하이라이트 (마우스오버/터치):
  chart-positive → accent-highlight (#3B82F6)
```

### 9-2. Chart Anatomy

```
┌───────────────────────────────┐
│ LABEL (섹션 라벨 스타일)       │  ← 0.6rem, #B3B3B3, uppercase
│ [선택된 값 표시]              │  ← 마우스오버 시, 0.72rem, #60A5FA
│ ┌───────────────────────────┐│
│ │        차트 영역           ││  ← 높이 40~80px
│ └───────────────────────────┘│
│ ● 범례1  ● 범례2  ● 범례3   │  ← 0.65rem, 컬러 원 8px
└───────────────────────────────┘
```

### 9-3. 목표선

```
수면 7시간 목표:
- 점선 (2px dash, 2px gap)
- 색: #B3B3B3
- 라벨: "7h" (우측 끝)
```

---

## 10. Content Foundation

### 10-1. 용어 통일

| 영문 | 한글 | 사용처 |
|------|------|--------|
| Today | (번역 안 함) | 섹션 라벨 |
| Tomorrow | (번역 안 함) | 섹션 라벨 |
| Routine | (번역 안 함) | 섹션 라벨 |
| Recommendation | (번역 안 함) | 섹션 라벨 |
| Emotion | (번역 안 함) | 섹션 라벨 |
| Daily Review | (번역 안 함) | 섹션 라벨 |
| Weekly Report | (번역 안 함) | 섹션 라벨 |
| 저장 | — | 버튼 |
| 회고 저장 | — | 버튼 |
| 추가 | — | 버튼 |
| 수정 | — | 버튼 |
| 기록 | — | 운동 저장 버튼 |

### 10-2. 날짜 형식

```
헤더:     SUN, MAY 04 (Outfit, uppercase)
스케줄:   5/4 (월요일) — 볼드
월 표시:  2026년 5월
시간:     08:30-17:30 (Outfit)
```

### 10-3. 빈 상태 메시지

```
데이터 없음:    "기록 없음" (#B3B3B3)
일정 없음:     "일정 없음" (#B3B3B3)
대화 없음:     초기 인사 메시지
루틴 미완료:   "잊지 않으셨죠?" (#B3B3B3)
```

---

*Foundation v1 — 2026-05-05*
*이 문서는 디자인 가이드의 기반이 됩니다. 모든 컴포넌트와 화면은 여기 정의된 토큰과 원칙을 따릅니다.*
