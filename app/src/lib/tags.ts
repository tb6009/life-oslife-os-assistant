// 해시태그 유틸리티 — 본문에서 #태그 추출, 태그명 → 컬러 매핑

const TAG_REGEX = /#([\w가-힣]+)/g;

// 자동 컬러 팔레트 (063 대시보드 토큰 기반)
const PALETTE: Array<{ bg: string; text: string }> = [
  { bg: "rgba(94,153,114,0.18)",  text: "#5E9972" }, // green
  { bg: "rgba(90,134,176,0.18)",  text: "#5A86B0" }, // blue
  { bg: "rgba(168,114,138,0.18)", text: "#A8728A" }, // pink
  { bg: "rgba(126,107,168,0.18)", text: "#7E6BA8" }, // violet
  { bg: "rgba(160,124,80,0.18)",  text: "#A07C50" }, // orange
  { bg: "rgba(154,138,85,0.18)",  text: "#9A8A55" }, // amber
  { bg: "rgba(168,107,104,0.18)", text: "#A86B68" }, // red
];

export function extractTags(text: string): string[] {
  const tags: string[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  TAG_REGEX.lastIndex = 0;
  while ((m = TAG_REGEX.exec(text)) !== null) {
    const tag = m[1];
    if (!seen.has(tag)) {
      seen.add(tag);
      tags.push(tag);
    }
  }
  return tags;
}

export function getTagColor(tag: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

// 본문을 [텍스트 | 태그] 토큰으로 분할 — 렌더링 시 칩 변환용
export type TextToken = { kind: "text"; value: string } | { kind: "tag"; value: string };

export function tokenize(text: string): TextToken[] {
  const out: TextToken[] = [];
  let last = 0;
  TAG_REGEX.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TAG_REGEX.exec(text)) !== null) {
    if (m.index > last) out.push({ kind: "text", value: text.slice(last, m.index) });
    out.push({ kind: "tag", value: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ kind: "text", value: text.slice(last) });
  return out;
}
