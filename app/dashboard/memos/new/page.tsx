import { requireAuthedClient } from "@/lib/supabase/authed";
import { MemoForm } from "@/components/MemoForm";

export default async function NewMemoPage() {
  await requireAuthedClient();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-primary">새 메모 작성</h1>
        <p className="mt-1 text-sm text-ink-mute">작성자와 작성일은 자동으로 기록됩니다.</p>
      </div>
      <MemoForm />
    </main>
  );
}
