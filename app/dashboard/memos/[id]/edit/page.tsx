import { notFound, redirect } from "next/navigation";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { getMemoDetail } from "@/lib/queries/memos";
import { MemoEditForm } from "@/components/MemoEditForm";
import { NavIcon } from "@/components/icons/NavIcon";

type Params = Promise<{ id: string }>;

export default async function EditMemoPage({ params }: { params: Params }) {
  const { id } = await params;
  const { supabase, user } = await requireAuthedClient();
  const memo = await getMemoDetail(supabase, id);

  if (!memo) notFound();

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const canModify = memo.authorId === user.id || profile?.role === "admin";
  if (!canModify) redirect(`/dashboard/memos/${id}`);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
          <NavIcon name="clipboard" className="h-5 w-5" />
          메모 수정
        </h1>
      </div>
      <MemoEditForm memo={memo} />
    </main>
  );
}
