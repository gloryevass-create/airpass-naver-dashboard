"use client";

export function DeleteMemoButton({ action }: { action: (formData: FormData) => void }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("정말 삭제하시겠습니까? 되돌릴 수 없습니다.")) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className="btn btn-ghost" style={{ color: "var(--color-accent-700)" }}>
        삭제
      </button>
    </form>
  );
}
