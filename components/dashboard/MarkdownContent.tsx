import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import GithubSlugger from "github-slugger";
import type { Components } from "react-markdown";

// lilys.ai에서 내보낸 마크다운(회의록)을 Industry 테마 톤에 맞춰 렌더링한다.
// 이 앱은 별도 prose 유틸리티 클래스 스택이 없어(IndustryWorkJournalBoard.tsx
// 등과 같은 관례대로) 각 마크다운 엘리먼트를 react-markdown의 components prop으로
// 매핑해 인라인 스타일로 직접 그린다. rehype-slug가 헤딩에 부여하는 id와
// extractHeadings()가 만드는 목차(TOC) 링크가 정확히 같은 앵커를 가리켜야 해서,
// rehype-slug 내부와 같은 github-slugger를 직접 써서 동일한 규칙으로 슬러그를
// 생성한다(같은 순서로 처리하면 항상 같은 결과가 나옴).
export type MarkdownHeading = { depth: number; text: string; id: string };

export function extractHeadings(markdown: string): MarkdownHeading[] {
  const slugger = new GithubSlugger();
  const headings: MarkdownHeading[] = [];
  const lines = markdown.split("\n");
  let inCodeFence = false;
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;
    const match = line.match(/^(#{1,3})\s+(.+?)\s*#*\s*$/);
    if (!match) continue;
    const text = match[2].trim();
    headings.push({ depth: match[1].length, text, id: slugger.slug(text) });
  }
  return headings;
}

const HEADING_STYLE: Record<number, React.CSSProperties> = {
  1: { fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 26, margin: "var(--space-6) 0 var(--space-3)" },
  2: { fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 21, margin: "var(--space-5) 0 var(--space-2)" },
  3: { fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 17, margin: "var(--space-4) 0 var(--space-2)" },
  4: { fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 15, margin: "var(--space-3) 0 var(--space-1)" },
};

function heading(depth: number) {
  const style = HEADING_STYLE[depth] ?? HEADING_STYLE[4];
  const Tag = `h${depth}` as keyof React.JSX.IntrinsicElements;
  return function HeadingComponent({ id, children }: { id?: string; children?: React.ReactNode }) {
    return (
      <Tag id={id} style={style}>
        {children}
      </Tag>
    );
  };
}

const components: Components = {
  h1: heading(1),
  h2: heading(2),
  h3: heading(3),
  h4: heading(4),
  p: ({ children }) => <p style={{ fontSize: 15, lineHeight: 1.75, margin: "0 0 var(--space-3)" }}>{children}</p>,
  ul: ({ children }) => <ul style={{ margin: "0 0 var(--space-3)", paddingLeft: 22, fontSize: 15, lineHeight: 1.75 }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ margin: "0 0 var(--space-3)", paddingLeft: 22, fontSize: 15, lineHeight: 1.75 }}>{children}</ol>,
  li: ({ children }) => <li style={{ margin: "0 0 4px" }}>{children}</li>,
  blockquote: ({ children }) => (
    <blockquote
      style={{
        margin: "0 0 var(--space-3)",
        padding: "var(--space-2) var(--space-4)",
        borderLeft: "3px solid var(--color-accent)",
        background: "var(--color-accent-100)",
        color: "var(--color-accent-900)",
        fontSize: 14,
      }}
    >
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code style={{ background: "var(--color-accent-100)", padding: "1px 5px", fontSize: 13, fontFamily: "monospace" }}>{children}</code>
  ),
  pre: ({ children }) => (
    <pre
      style={{
        background: "var(--color-accent-100)",
        padding: "var(--space-3)",
        overflowX: "auto",
        fontSize: 13,
        fontFamily: "monospace",
        margin: "0 0 var(--space-3)",
      }}
    >
      {children}
    </pre>
  ),
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-accent-700)" }}>
      {children}
    </a>
  ),
  hr: () => <hr style={{ border: 0, borderTop: "1px solid var(--color-divider)", margin: "var(--space-4) 0" }} />,
  table: ({ children }) => (
    <div style={{ overflowX: "auto", marginBottom: "var(--space-3)" }}>
      <table className="table">{children}</table>
    </div>
  ),
  strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
};

export function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]} components={components}>
      {content}
    </ReactMarkdown>
  );
}
