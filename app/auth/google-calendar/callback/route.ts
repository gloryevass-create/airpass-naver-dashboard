import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens, fetchGoogleUserEmail } from "@/lib/googleCalendar/oauth";

export async function GET(request: NextRequest) {
  const { origin, searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  const cookieStore = await cookies();
  const savedState = cookieStore.get("google_calendar_oauth_state")?.value;
  cookieStore.delete("google_calendar_oauth_state");

  if (oauthError || !code || !state || state !== savedState) {
    return NextResponse.redirect(`${origin}/dashboard/events2?googleError=1`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!supabase || !user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  try {
    const redirectUri = `${origin}/auth/google-calendar/callback`;
    const tokens = await exchangeCodeForTokens(code, redirectUri);

    if (!tokens.refresh_token) {
      // access_type=offline + prompt=consent를 항상 붙이지만, 그래도 구글이
      // refresh_token을 안 줄 때가 있다 — 그럴 땐 재연결을 안내한다.
      return NextResponse.redirect(`${origin}/dashboard/events2?googleError=no_refresh_token`);
    }

    const googleEmail = await fetchGoogleUserEmail(tokens.access_token);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const { error } = await supabase.from("google_calendar_connections").upsert({
      user_id: user.id,
      google_email: googleEmail ?? "",
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token,
      access_token_expires_at: expiresAt,
    });
    if (error) {
      console.error("[google-calendar/callback] 연결 저장 실패:", error.message);
      return NextResponse.redirect(`${origin}/dashboard/events2?googleError=1`);
    }
  } catch (e) {
    console.error("[google-calendar/callback] 토큰 교환 실패:", e instanceof Error ? e.message : e);
    return NextResponse.redirect(`${origin}/dashboard/events2?googleError=1`);
  }

  return NextResponse.redirect(`${origin}/dashboard/events2?googleConnected=1`);
}
