import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatMember } from "@/lib/formatMember";

// 사용자가 별도로 만들어 둔 Claude 스킬/서비스가 리뷰 글을 만들면, 그 결과를
// 이 앱의 로그인 화면을 거치지 않고 바로 AI Review에 올리기 위한 수신 엔드포인트
// (2026-09-06). /api/cron/ai-issues와 같은 이유로 세션 쿠키 없는 서버-투-서버
// 호출이라 proxy.ts PUBLIC_PATHS에도 등록했다 — 진짜 인증은 이 라우트 안의
// Authorization: Bearer $AI_REVIEW_INGEST_SECRET 검사다.
//
// 요청 예시:
//   POST /api/ai-review/ingest
//   Authorization: Bearer <AI_REVIEW_INGEST_SECRET>
//   Content-Type: application/json
//   { "content": "# 제목\n\n마크다운 본문...", "authorEmail": "looney@airpass.co.kr", "title": "선택사항" }
//
// content는 필수(마크다운 텍스트, 원본 파일을 저장하지 않고 텍스트만 남기는
// AI Review 설계와 동일). title을 안 주면 content 첫 줄의 "# 제목"을 자동으로
// 쓴다(app/dashboard/actions/aiReviews.ts::resolveTitle과 동일 로직). authorEmail은
// profiles에 등록된 팀원 이메일이어야 한다 — 로그인 세션이 없어 author_id를
// auth.uid()로 알 수 없으므로, 어느 팀원 이름으로 남길지 호출부가 알려줘야 한다.
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.AI_REVIEW_INGEST_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { title?: unknown; content?: unknown; authorEmail?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 JSON 요청입니다." }, { status: 400 });
  }

  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content) {
    return NextResponse.json({ error: "content가 비어 있습니다." }, { status: 400 });
  }

  const authorEmail = typeof body.authorEmail === "string" ? body.authorEmail.trim() : "";
  if (!authorEmail) {
    return NextResponse.json({ error: "authorEmail이 필요합니다." }, { status: 400 });
  }

  const formTitle = typeof body.title === "string" ? body.title.trim() : "";
  const headingMatch = content.match(/^#\s+(.+)$/m);
  const title = formTitle || headingMatch?.[1]?.trim();
  if (!title) {
    return NextResponse.json(
      { error: "title을 지정하거나, content 첫 줄에 '# 제목' 형식의 헤딩을 포함하세요." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data: profile } = await admin.from("profiles").select("id, name, title, email").eq("email", authorEmail).maybeSingle();
  if (!profile) {
    return NextResponse.json({ error: `등록된 팀원 이메일이 아닙니다: ${authorEmail}` }, { status: 400 });
  }

  const { data: review, error } = await admin
    .from("ai_reviews")
    .insert({
      author_id: profile.id,
      author_email: profile.email,
      title,
      content,
    })
    .select("id")
    .single();

  if (error || !review) {
    return NextResponse.json({ error: error?.message ?? "저장에 실패했습니다." }, { status: 500 });
  }

  const actor = formatMember(profile.name, profile.title, profile.email);
  await admin.from("notifications").insert({
    type: "ai_review",
    title,
    message: `${actor}님이 AI Review를 등록했습니다.`,
    link: `/dashboard/ai-review/${review.id}`,
  });

  return NextResponse.json({ ok: true, id: review.id, url: `/dashboard/ai-review/${review.id}` });
}
