import { requireAuthedClient } from "@/lib/supabase/authed";
import { MemoForm } from "@/components/MemoForm";
import { NavIcon } from "@/components/icons/NavIcon";

export default async function NewMemoPage() {
  await requireAuthedClient();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
          <NavIcon name="clipboard" className="h-5 w-5" />
          새 메모 작성
        </h1>
        <p className="mt-1 text-sm text-ink-mute">작성자와 작성일은 자동으로 기록됩니다.</p>
      </div>
      <MemoForm />
    </main>
  );
}
