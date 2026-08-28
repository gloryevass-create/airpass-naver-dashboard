import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

const PUBLIC_PATHS = [
  "/login",
  "/auth/callback",
  "/auth/set-password",
  "/auth/forgot-password",
  // 산출내역(견적) 고객 공유용 인쇄 페이지 — 자료메일발송으로 받은 링크를 로그인
  // 없이 열 수 있어야 한다(UUID를 아는 사람만 접근 가능, 사용자 확인 2026-08-28).
  "/quote",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export async function proxy(request: NextRequest) {
  // Supabase 미설정 상태(초기 세팅 전)에서는 그대로 통과시켜 /login에 안내 문구가 뜨게 한다.
  if (!isSupabaseConfigured) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublic = isPublicPath(pathname);

  if (!user && !isPublic) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Server Action(예: 로그인 직후 recordLogin() 호출)은 현재 페이지 URL로 POST 요청을
  // 보낸다 — 로그인 폼이 /login에 있으므로 이 요청도 pathname === "/login"이 되어
  // 아래 리다이렉트 규칙에 잘못 걸린다(실측 확인, 2026-08-20: 로그인 직후 세션이 이미
  // 있는 상태에서 recordLogin()의 액션 요청이 대시보드로 리다이렉트되면서 "unexpected
  // response" 에러가 났음). Server Action 요청은 Next-Action 헤더로 식별해 제외한다.
  const isServerAction = request.headers.has("next-action");

  if (user && pathname === "/login" && !isServerAction) {
    return NextResponse.redirect(new URL("/dashboard/events2", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
