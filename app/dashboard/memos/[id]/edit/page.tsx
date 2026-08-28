import "@/components/industryTheme.css";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { getMemoDetail } from "@/lib/queries/memos";
import { MemoEditForm } from "@/components/MemoEditForm";

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
    <div className="industry-theme" style={{ padding: "var(--space-8) var(--space-6)", maxWidth: 800, margin: "0 auto" }}>
      <Link
        href={`/dashboard/memos/${id}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "var(--color-accent-700)",
          fontSize: 13,
          textDecoration: "none",
          marginBottom: "var(--space-5)",
        }}
      >
        ← 목록으로
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-6)" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="8" y="2" width="8" height="4" rx="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <path d="M9 12h6" />
          <path d="M9 16h6" />
        </svg>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 24, margin: 0 }}>메모 수정</h1>
      </div>
      <MemoEditForm memo={memo} />
    </div>
  );
}
