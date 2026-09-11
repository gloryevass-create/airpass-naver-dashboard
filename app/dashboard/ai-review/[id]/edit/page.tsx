import "@/components/industryTheme.css";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { getAiReviewDetail } from "@/lib/queries/aiReviews";
import { AiReviewForm } from "@/components/AiReviewForm";

type Params = Promise<{ id: string }>;

export default async function EditAiReviewPage({ params }: { params: Params }) {
  const { id } = await params;
  const { supabase, user } = await requireAuthedClient();

  const review = await getAiReviewDetail(supabase, id);
  if (!review) notFound();

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (review.authorId !== user.id && profile?.role !== "admin") notFound();

  return (
    <div className="industry-theme" style={{ minHeight: "100vh", background: "#ffffff" }}>
      <div style={{ padding: "var(--space-8) var(--space-6)", maxWidth: 800, margin: 0 }}>
      <Link
        href={`/dashboard/ai-review/${review.id}`}
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
        ← 돌아가기
      </Link>
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 24, margin: "0 0 var(--space-6)" }}>리뷰 수정</h1>
      <AiReviewForm review={review} />
      </div>
    </div>
  );
}
