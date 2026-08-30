import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { buildGoogleAuthUrl } from "@/lib/googleCalendar/oauth";
import { isGoogleCalendarConfigured } from "@/lib/googleCalendar/env";

// Calendar 화면의 "구글 캘린더 연결" 버튼이 여기로 온다. CSRF 방지용 state를
// 쿠키에 잠깐 저장해뒀다가 콜백(app/auth/google-calendar/callback)에서 그대로
// 돌아왔는지 확인한다.
export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);

  const supabase = await createClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!supabase || !user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  if (!isGoogleCalendarConfigured) {
    return NextResponse.redirect(`${origin}/dashboard/calendar?googleError=not_configured`);
  }

  const state = randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("google_calendar_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  const redirectUri = `${origin}/auth/google-calendar/callback`;
  return NextResponse.redirect(buildGoogleAuthUrl(redirectUri, state));
}
