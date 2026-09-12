"use client";

export function DeleteIconButton({ action }: { action: (formData: FormData) => void }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("정말 삭제하시겠습니까? 되돌릴 수 없습니다.")) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="btn btn-ghost"
        aria-label="삭제"
        title="삭제"
        style={{ width: 26, height: 26, padding: 0, minHeight: "auto", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-accent-700)" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>
      </button>
    </form>
  );
}
