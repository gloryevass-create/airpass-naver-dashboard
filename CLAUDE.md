@AGENTS.md

# airpass-naver-dashboard

에어패스 마케팅팀이 네이버 키워드광고·블로그 경쟁사 모니터링 결과를 확인하는 웹 대시보드.
데이터를 직접 수집하지 않는다 — 별도 저장소 `airpass-naver-monitor`(모니터링 에이전트, cron으로 매일 실행)가
같은 Supabase 프로젝트에 `service_role` 키로 데이터를 채워 넣고, 이 앱은 읽기 전용으로 보여준다.

## 스택

- Next.js 16 (App Router, TypeScript, Tailwind CSS v4)
- Supabase: `@supabase/supabase-js` + `@supabase/ssr`
- Recharts (차트)
- Vercel 배포
- 시스템 폰트 스택 사용 (`next/font/google` 미사용 — 네트워크 제한 환경 빌드 실패 방지)

## 인증 설계

- 이메일 + 비밀번호만 지원 (매직링크 없음). 공개 회원가입 없음 — 계정 생성은 `/admin`에서 관리자가
  이메일을 입력해 초대하는 경로 하나뿐.
- 흐름: 관리자가 `/admin`에서 초대 → Supabase가 초대 메일 발송 → 사용자가 메일의 링크 클릭 →
  `/auth/callback`(code→세션 교환) → `/auth/set-password`(새 비밀번호 저장) → `/dashboard`.
  비밀번호 재설정도 `/auth/forgot-password` → 동일한 `/auth/callback` → `/auth/set-password` 경로를 공유한다.
- `proxy.ts`(Next 16 컨벤션, 구 `middleware.ts`)가 모든 요청에서 세션을 갱신하고, 로그인하지 않은
  사용자를 `/login`으로 리다이렉트한다(공개 경로: `/login`, `/auth/*`).
- `/admin` 접근 권한(role='admin')은 proxy가 아니라 페이지 자체(`lib/supabase/authed.ts`의
  `requireAdminClient`)에서 DB를 조회해 확인한다 — proxy는 매 요청마다 실행되므로 낙관적 세션 체크만
  하고, DB 조회가 필요한 권한 체크는 페이지/Server Action에서 한다(Next.js 공식 auth 가이드 권장 패턴).
- 최초 관리자는 Supabase 대시보드에서 직접 초대한 뒤 SQL로 수동 승격해야 한다(README 참고).

## DB 설계

- 스키마 단일 출처: `supabase/migrations/0001_init.sql`. 프로젝트 2(모니터링 에이전트)는 이 파일을
  그대로 참조만 하고 별도로 스키마를 정의하지 않는다.
- RLS: `authenticated` 세션은 모니터링 데이터 테이블에 SELECT만 가능. INSERT/UPDATE는 `service_role`
  키를 쓰는 프로젝트 2와, 이 앱의 관리자 초대 Server Action(`app/admin/actions.ts`, 역시 `service_role`
  사용)만 가능하다.
- 대시보드의 모든 조회는 `lib/queries/dashboard.ts::getLatestDataDate()`로 구한 "가장 최근 수집일"을
  기준으로 필터링한다 — 특정 날짜를 하드코딩하지 않는다.
- Supabase 테이블 타입(`lib/types/database.types.ts`)은 `interface`가 아니라 `type` 객체 리터럴로
  선언되어 있다(`interface`는 암묵적 인덱스 시그니처가 없어 Supabase 제네릭이 결과 타입을 `never`로
  추론하는 문제가 있음). Supabase 프로젝트가 준비되면
  `npx supabase gen types typescript --project-id <ref> > lib/types/database.types.ts`로 교체 권장.
- PostgREST 임베디드 조인(`select("competitors(name)")`) 대신, `competitors`/`keywords`를 별도
  조회해 `Map`으로 JS 레벨 조인한다(`lib/queries/dashboard.ts`) — FK 관계 메타데이터 없이도 타입이
  안전하게 유지된다.

## 폴더 구조

```
app/
  login/                이메일+비밀번호 로그인
  auth/callback/         code→세션 교환 (route handler)
  auth/set-password/     초대·재설정 후 새 비밀번호 저장
  auth/forgot-password/  재설정 메일 요청
  admin/                 관리자 전용: 초대 폼 + 가입자 목록
  dashboard/              메인 대시보드
components/               공용 UI (LoginForm, DashboardHeader 등)
components/dashboard/     대시보드 전용 차트/테이블 컴포넌트
lib/supabase/             client.ts(브라우저) / server.ts(서버) / admin.ts(service_role,
                           server-only) / authed.ts(권한 헬퍼) / env.ts
lib/types/                database.types.ts
lib/queries/               dashboard.ts (최근일 앵커 + 전체 대시보드 쿼리)
supabase/migrations/       0001_init.sql — 스키마 단일 출처
proxy.ts                   세션 갱신 + 로그인 리다이렉트 (Next 16, 구 middleware.ts)
```

## 실행 명령

```bash
npm run dev         # 개발 서버
npm run build        # 프로덕션 빌드 (typecheck 포함)
npm run lint          # ESLint
```
