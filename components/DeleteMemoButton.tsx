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
      <button
        type="submit"
        className="rounded-full border border-semantic-error px-4 py-1.5 text-sm font-medium text-semantic-error hover:bg-semantic-error/10"
      >
        삭제
      </button>
    </form>
  );
}
