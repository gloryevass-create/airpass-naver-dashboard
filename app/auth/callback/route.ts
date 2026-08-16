import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 초대 메일 / 비밀번호 재설정 메일의 code→세션 교환 지점.
// 성공하면 항상 /auth/set-password로 보내 새 비밀번호를 받는다.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}/auth/set-password`);
      }
    }
  }

  return NextResponse.redirect(
    `${origin}/login?message=${encodeURIComponent("인증 링크가 유효하지 않거나 만료되었습니다.")}`
  );
}
