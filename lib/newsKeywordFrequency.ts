// 수집된 뉴스 제목에서 자주 등장하는 단어를 세어 "지금 화제가 되는 키워드"를 뽑는다.
// LLM 호출 없이 순수 빈도 계산이라 비용·지연이 없고, 실제 수집된 기사 제목에만 근거한다
// (지어낸 요약이 아니다). 제대로 된 형태소 분석기가 없어 어절 단위로 쪼갠 뒤 흔한 조사를
// 잘라내는 휴리스틱을 쓴다 — 완벽하지 않지만 "무엇이 자주 언급되는지" 감을 잡기엔 충분하다.

const STOPWORDS = new Set([
  "기자",
  "종합",
  "속보",
  "단독",
  "인터뷰",
  "오늘",
  "내일",
  "어제",
  "대해",
  "위해",
  "통해",
  "관련",
  "이번",
  "지난",
  "올해",
  "내년",
  "오전",
  "오후",
  "이날",
  "것으로",
  "것을",
  "등",
  "것",
  "수",
  "및",
  "그리고",
  "하지만",
  "대한",
  "위한",
  "에서는",
  "한다",
  "했다",
  "된다",
  "됐다",
  "이라",
  "라며",
  "이라며",
  "라고",
  "이라고",
  "이란",
  "라는",
  "이라는",
]);

const PARTICLE_SUFFIXES = [
  "에서는",
  "으로는",
  "에게서",
  "이라서",
  "에게",
  "까지",
  "부터",
  "처럼",
  "이나마",
  "이나",
  "밖에",
  "마저",
  "조차",
  "보다",
  "이라",
  "으로",
  "에서",
  "라서",
  "은",
  "는",
  "이",
  "가",
  "을",
  "를",
  "의",
  "에",
  "와",
  "과",
  "도",
  "만",
  "로",
  "나",
];

function stripParticle(token: string): string {
  for (const suffix of PARTICLE_SUFFIXES) {
    if (token.length > suffix.length + 1 && token.endsWith(suffix)) {
      return token.slice(0, -suffix.length);
    }
  }
  return token;
}

export type HotKeyword = { term: string; count: number };

const MIN_COUNT = 2;
const MAX_KEYWORDS = 15;

export function extractHotKeywords(titles: string[], limit = MAX_KEYWORDS): HotKeyword[] {
  const counts = new Map<string, number>();

  for (const title of titles) {
    // 대괄호/괄호 안 언론사·섹션 표기(예: [단독], (종합))와 구두점을 제거하고 어절로 쪼갠다.
    const cleaned = title.replace(/[[({][^\])}]*[\])}]/g, " ").replace(/[.,!?"'“”‘’·…]/g, " ");
    const tokens = cleaned.split(/\s+/).filter(Boolean);

    const seenInTitle = new Set<string>();
    for (const raw of tokens) {
      const stripped = stripParticle(raw);
      const isAsciiWord = /^[A-Za-z]+$/.test(stripped);
      const minLen = isAsciiWord ? 2 : 2;
      if (stripped.length < minLen) continue;
      if (STOPWORDS.has(stripped)) continue;
      if (/^\d+$/.test(stripped)) continue; // 순수 숫자 제외

      const key = isAsciiWord ? stripped.toUpperCase() : stripped;
      if (seenInTitle.has(key)) continue; // 같은 제목 안 중복은 1회만 카운트
      seenInTitle.add(key);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .filter(([, count]) => count >= MIN_COUNT)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term, count]) => ({ term, count }));
}
