@AGENTS.md

# airpass-naver-dashboard

에어패스 마케팅팀이 네이버 키워드광고·블로그 경쟁사 모니터링 결과를 확인하는 웹 대시보드.
데이터를 직접 수집하지 않는다 — 별도 저장소 `airpass-naver-monitor`(모니터링 에이전트, cron으로 매일 실행)가
같은 Supabase 프로젝트에 `service_role` 키로 데이터를 채워 넣고, 이 앱은 읽기 전용으로 보여준다.

## 스택

- Next.js 16 (App Router, TypeScript, Tailwind CSS v4)
- Supabase: `@supabase/supabase-js` + `@supabase/ssr`
- Recharts (차트)
- `googleapis`(구글드라이브 자료 목록/공유 링크) + `nodemailer`(자료메일발송, SMTP 직접 로그인)
- Vercel 배포
- 시스템 폰트 스택 사용 (`next/font/google` 미사용 — 네트워크 제한 환경 빌드 실패 방지)

## 인증 설계

- 이메일 + 비밀번호만 지원 (매직링크 없음). 공개 회원가입 없음 — 계정 생성은 `/dashboard/admin`에서
  관리자가 직접 등록하는 경로 하나뿐.
- 흐름(2026-08-29부터, 이메일 초대 방식에서 변경): 관리자가 `/dashboard/admin`에서 이름·직함·
  회사메일·구글메일을 입력해 "등록" → `registerUser`(`app/dashboard/admin/actions.ts`)가
  `admin.auth.admin.createUser({ email, password: 고정 기본값, email_confirm: true })`로 즉시
  로그인 가능한 계정을 만든다(메일 발송·링크 클릭 없음). 모든 신규 계정의 초기 비밀번호는
  `"Airpass1511!"`로 고정이고, 로그인 후 헤더 개인 메뉴 "비밀번호 변경"에서 각자 바꾼다.
  `/auth/callback`/`/auth/set-password`는 이제 신규 가입 경로가 아니라 **비밀번호 재설정**
  (`/auth/forgot-password` → 재설정 메일 링크 → `/auth/callback` → `/auth/set-password`)
  전용으로만 쓰인다.
- `proxy.ts`(Next 16 컨벤션, 구 `middleware.ts`)가 모든 요청에서 세션을 갱신하고, 로그인하지 않은
  사용자를 `/login`으로 리다이렉트한다(공개 경로: `/login`, `/auth/*`).
- `/dashboard/admin` 접근 권한(role='admin')은 proxy가 아니라 페이지 자체(`lib/supabase/authed.ts`의
  `requireAdminClient`)에서 DB를 조회해 확인한다 — proxy는 매 요청마다 실행되므로 낙관적 세션 체크만
  하고, DB 조회가 필요한 권한 체크는 페이지/Server Action에서 한다(Next.js 공식 auth 가이드 권장 패턴).
- 최초 관리자는 Supabase 대시보드에서 직접 만든 뒤 SQL로 수동 승격해야 한다(README 참고).

## DB 설계

- 스키마 단일 출처: `supabase/migrations/0001_init.sql`. 프로젝트 2(모니터링 에이전트)는 이 파일을
  그대로 참조만 하고 별도로 스키마를 정의하지 않는다.
- RLS: `authenticated` 세션은 모니터링 데이터 테이블에 SELECT만 가능. INSERT/UPDATE는 `service_role`
  키를 쓰는 프로젝트 2와, 이 앱의 관리자 등록 Server Action(`app/dashboard/admin/actions.ts::registerUser`,
  역시 `service_role` 사용)만 가능하다.
- 대시보드의 모든 조회는 `lib/queries/dashboard.ts::getLatestDataDate()`로 구한 "가장 최근 수집일"을
  기준으로 필터링한다 — 특정 날짜를 하드코딩하지 않는다.
- Supabase 테이블 타입(`lib/types/database.types.ts`)은 `interface`가 아니라 `type` 객체 리터럴로
  선언되어 있다(`interface`는 암묵적 인덱스 시그니처가 없어 Supabase 제네릭이 결과 타입을 `never`로
  추론하는 문제가 있음). Supabase 프로젝트가 준비되면
  `npx supabase gen types typescript --project-id <ref> > lib/types/database.types.ts`로 교체 권장.
- PostgREST 임베디드 조인(`select("competitors(name)")`) 대신, `competitors`/`keywords`를 별도
  조회해 `Map`으로 JS 레벨 조인한다(`lib/queries/dashboard.ts`) — FK 관계 메타데이터 없이도 타입이
  안전하게 유지된다.
- `notifications`(팀 공유 알림 피드) + `notification_reads`(사용자별 읽음 상태). 유튜브업로드/
  광고비 부족은 `airpass-naver-monitor`가 매일 동기화 시 diff를 감지해
  service_role로 직접 삽입한다(`scripts/lib/supabase-sync.ts`의 `diffNewYoutubeVideos` 등).
  광고전략메모 작성(`app/dashboard/memos/actions.ts`)과 조달입찰공고/사전규격 스크랩
  (`app/dashboard/actions/scraps.ts`)은 이 대시보드 자체가 authenticated 세션으로 직접
  삽입한다. 클라이언트는 `components/NotificationBell.tsx`에서 Supabase Realtime으로
  새 알림을 실시간 수신한다(0026 마이그레이션에서 `supabase_realtime` publication에 추가).

- `profiles`에는 authenticated용 self-update RLS 정책이 의도적으로 없다 — 같은 행의 `role`
  컬럼을 사용자가 스스로 admin으로 바꿔치기하지 못하게 막기 위함(`app/login/actions.ts`의
  `recordLogin` 주석 참고). 그래서 로그인 기록 갱신, 회원정보 수정
  (`app/dashboard/actions/profile.ts::updateOwnProfile`) 모두 세션 클라이언트로 "본인이 맞는지"만
  확인한 뒤 `createAdminClient()`(service_role)로 필요한 컬럼만 골라 갱신한다. 회원정보 수정은
  `title`/`google_email` 두 컬럼만 건드리고 `role`/`email`/`name`은 절대 쓰지 않는다.
- `profiles.google_email`(2026-08-29 추가) — 로그인/회사 이메일(`email`)과 별개로, 회원정보
  수정 화면(`/dashboard/account/profile`)에서 본인이 참고용으로 입력하는 개인 구글 이메일.

## 자료메일발송

`/dashboard/material-email` — 구글드라이브 공유 자료 폴더에서 파일을 골라 안내 문구와 함께
이메일로 보낸다. 두 외부 서비스를 쓴다(둘 다 이 앱에 처음 추가된 연동, 2026-08-23):

- **구글드라이브**(`lib/googleDriveMaterials.ts`): 서비스 계정(JWT) 인증으로 `GOOGLE_DRIVE_MATERIALS_FOLDER_ID`
  폴더 바로 아래 파일 목록만 조회한다(하위 폴더 재귀 탐색은 안 함). 서비스 계정은 폴더에
  **"편집자" 이상**으로 공유돼 있어야 한다 — "뷰어"로는 발송 직전 `ensureFileShared()`가
  개별 파일에 "링크가 있는 모든 사용자" 권한을 부여하지 못해 403으로 실패한다.
- **메일 발송**(`lib/materialEmail.ts`, `nodemailer`): 이메일 API(Resend 등) 대신 실제 회사
  메일 계정(현재 하이웍스, `smtps.hiworks.com:465`)에 SMTP로 직접 로그인해서 그 이름으로
  보낸다 — 도메인 인증(DNS)이 필요 없는 대신, `MATERIAL_EMAIL_SMTP_PASSWORD`에 그 계정의
  실제 로그인 비밀번호를 그대로 저장한다(하이웍스는 앱 전용 비밀번호가 없음, 사용자 확인
  2026-08-23 — Resend 대비 "발송 전용" 권한 분리가 안 된다는 트레이드오프를 감안하고 선택).
  자료를 이메일에 실제로 첨부하지 않고, 위 공유 링크를 본문에 나열해서 보낸다(용량 제한
  회피 — 이메일 첨부는 보통 20~40MB 상한이라 카탈로그·영상류 자료가 실패할 수 있음). 다른
  메일 서비스로 바꾸려면 `MATERIAL_EMAIL_SMTP_HOST`/`PORT`만 교체하면 된다.
- Supabase 기본 메일(인증 전용, 시간당 발송량 극히 제한적)과는 무관한 별도 경로다 — 자세한
  제약은 이 대화의 이전 답변 참고, 필요하면 다시 물어보면 됨.
- 발송 이력은 `material_email_logs`(0040)에 팀 전체가 볼 수 있게 남긴다(감사 추적용,
  `business_projects_v2` 히스토리와 같은 취지) — 누가/언제/누구에게/무슨 자료를 보냈는지.
- 두 서비스 중 하나라도 환경변수가 비어 있으면 폼 대신 설정 안내 배너를 보여준다
  (`isGoogleDriveConfigured`/`isMaterialEmailConfigured`).
- 메일 본문 HTML은 사용자가 Claude Design으로 만든 템플릿을 그대로 이식했다(`lib/materialEmailTemplate.ts::buildMaterialEmailHtml`,
  2026-08-28). I/O가 전혀 없는 순수 함수라 서버(실제 발송)와 클라이언트(미리보기, `MaterialEmailForm.tsx`의
  iframe `srcDoc`) 양쪽에서 그대로 재사용한다 — 미리보기는 구글드라이브 실 링크 생성 API를
  호출하지 않으려고 자리표시 링크(`#`)를 쓰고, 실제 발송(`app/dashboard/actions/materialEmail.ts`)
  시점에만 `ensureFileShared`로 진짜 공유 링크를 만든다.
  - **산출내역(견적) 첨부**: 화면에서 저장된 산출내역을 검색해 최대 1건 연결하면(`quotations.id`,
    `material_email_logs.quotation_id`/`quotation_quote_number`로 이력에 남김), 메일에 "견적 및
    제품자료 안내" 섹션(산출내역 인쇄용 페이지 절대 URL 포함)이 추가된다 — 첨부하지 않으면 이
    섹션 자체가 통째로 빠진다. 절대 URL은 `next/headers`의 요청 host로 만든다(별도 SITE_URL
    환경변수 없이 어느 배포에서도 맞는 링크가 나오게).
  - **"회사 및 제품소개 자료" 7개 링크**: `PRODUCT_MATERIAL_CATALOG`(고정 이름 목록)가 자료
    폴더 파일명과 키워드로 매칭되면 그 파일의 실제 공유 링크를 넣고, 못 찾으면 그 항목은 메일에서
    빠진다(가짜 링크를 만들지 않음) — 파일을 폴더에 추가/이름 변경하면 코드 수정 없이 바로 반영된다.

## 산출내역 관리

`/dashboard/quotations` — WHIZZUP 레퍼런스 사이트의 견적서 기능을 참고해 핵심만 이식했다
(2026-08-27, 화면 워딩은 2026-08-28에 "견적서"에서 "산출내역"으로 전면 변경 — 코드의
파일명·라우트·테이블명·타입명은 `quotation*` 그대로 유지하고 사용자에게 보이는 문구만 바꿨다).
리비전 이력·정산조정·컨소시엄·내부원가·마진 추적·조달채널·구글드라이브 동기화 등 WHIZZUP
고유 영업 프로세스는 전부 제외 — 품목·금액 자동계산·인쇄용 출력만 다룬다.

- `quotations`(0043) 테이블 하나로 관리한다. 품목(`items`)은 산출내역과 항상 통째로 함께
  편집되는 종속 데이터라 별도 테이블 대신 jsonb 배열로 저장한다(WHIZZUP의 `items_json`과
  동일한 접근 — `lib/queries/quotations.ts`가 파싱/직렬화).
- 품목은 제품 카탈로그(`product_catalog`)에서 선택하면 품명·규격·단가를 자동으로 채우거나,
  직접 입력도 가능하다. 금액(공급가액/부가세/합계)은 클라이언트가 계산한 값을 신뢰하지 않고
  서버 액션(`app/dashboard/actions/quotations.ts`)에서 다시 계산해 저장한다.
- 산출번호는 `Q-YYYYMMDD-순번` 형식으로 같은 날짜 발급 건수를 세어 자동 생성한다
  (`generateQuoteNumber`) — 팀 규모상 동시 등록 충돌 가능성은 낮다고 보고 재시도 로직은
  두지 않았다(충돌 시 다시 저장하면 됨).
- 인쇄는 서버측 PDF 생성 없이 `/dashboard/quotations/[id]/print` 전용 페이지 +
  `window.print()` 방식이다. 헤더·사이드바·AI 명령창은 Tailwind `print:hidden`으로 인쇄 시
  숨긴다.
- 공급자(에어패스) 정보는 `lib/quotationCompany.ts`에 고정값으로 넣어뒀다(사업자등록번호
  ·대표자·주소 — WHIZZUP이 에어패스 제품 견적을 대행 발급할 때 쓰던 실제 등록 정보를
  그대로 재사용). 직인(도장) 포함 옵션은 실제 도장 이미지가 없어 원형 텍스트("인")로만
  표시한다 — 실제 이미지가 필요하면 이미지 파일을 받아 교체해야 한다.
- SI Business(`business_projects_v2`) 프로젝트와 `business_project_id`(0046)로 연결할 수
  있다 — 산출내역 작성 화면에서 프로젝트를 검색해 고르면, 그 프로젝트 상세 화면의
  "연결된 산출내역" 섹션에서도 조회된다.
- **고객 공유용 공개 인쇄 페이지**: `app/quote/[id]`(`/dashboard` 바깥, `proxy.ts`
  PUBLIC_PATHS에 `/quote` 등록) — 자료메일발송이 보내는 링크는 로그인 안 된 고객이
  여는 것이라 사이드바·헤더 없이 문서만 보이고, "인쇄"/"PDF 다운로드"(둘 다
  `window.print()`) 버튼만 뜬다. RLS를 anon까지 열어주는 대신 이 서버 컴포넌트에서만
  `createAdminClient()`(service_role)로 id 하나만 조회한다 — 구글드라이브 공유
  링크와 같은 "UUID를 아는 사람만 접근" 모델(사용자 확인, 2026-08-28). 내부 직원용
  `/dashboard/quotations/[id]/print`(로그인 필요, 인쇄 버튼 하나만)는 그대로 유지 —
  견적서 목록·SI Business 프로젝트 상세의 "인쇄" 링크는 계속 이쪽을 가리킨다.

## SI Business 2

`/dashboard/business3`(사이드바 라벨은 "SI Business 2") — 기존 SI Business
(`/dashboard/business2`)와 **완전히 같은 `business_projects_v2` 데이터·서버
액션**(`app/dashboard/actions/businessProjectsV2.ts`)을 쓰는 또 하나의 화면이다.
별도 사업 목록이 아니다 — 어느 쪽에서 추가·수정·삭제해도 두 화면 모두 갱신된다
(액션마다 `/dashboard/business2`와 `/dashboard/business3`를 함께
`revalidatePath`). 사용자가 Claude Design으로 만든 "Industry"(철강청사진
와이어프레임: 스틸블루 단색 악센트, 사각 모서리 + "+" 등록마크가 있는 카드·버튼,
Barlow/Barlow Condensed) 테마를 그대로 이식했다(2026-08-28).

- `components/dashboard/IndustryBusinessBoard.tsx` — 새 컴포넌트 트리(칸반 드래그
  앤드롭, 리스트 뷰, 추가 다이얼로그, 상세/수정 화면, 연결된 산출내역·히스토리·댓글).
  기존 `BusinessBoardV2.tsx`와 기능은 동일하지만 마크업·클래스는 전부 새로 짰다 —
  두 컴포넌트 사이에 공유 코드가 없다(디자인이 근본적으로 달라 억지로 합치면 둘 다
  지저분해진다고 판단).
- `components/industryTheme.css` — Claude Design이 내보낸 `styles.css`(디자인
  토큰 + 컴포넌트 클래스)를 그대로 옮기되, 모든 셀렉터를 `.industry-theme`
  아래로 스코프했다 — 원본은 `body`/`h1`처럼 전역 셀렉터를 쓰는 진짜 전역
  스타일시트라, 스코프하지 않으면 이 페이지 바깥의 Tailwind 화면까지 깨진다.
  이 테마를 쓰는 각 `page.tsx`가 이 CSS를 라우트 단위로 import하고, 최상위
  컨테이너에 `.industry-theme` 클래스를 건다 — Calendar(`/dashboard/events2`)도
  같은 파일을 공유해서 쓴다(아래 참고).
- 칸반 단계 이동은 마우스 드래그(HTML5 `draggable`)로 컬럼 사이를 옮기는 방식과
  카드 안 `<select>` 두 가지를 모두 지원한다(디자인 원본에 둘 다 있었음).
- 담당자 다중 선택은 `MemberMultiSelect`(Tailwind 톤) 대신 이 테마 전용
  `ManagerChips`로 새로 짰다 — 색이 섞이면 통일된 룩이 깨지기 때문.

## Cooperation / Marketing

`/dashboard/cooperation`, `/dashboard/marketing-tasks` — SI Business 2와 같은
Claude Design "Industry" 테마를 그대로 적용했다(2026-08-29). SI Business 2와
달리 이 두 화면은 **그 자리에서 다시 그린 것**이다(새 메뉴를 따로 만들지
않음, Calendar와 동일한 방식) — 데이터·서버 액션(`app/dashboard/actions/
cooperationProjects.ts`, `app/dashboard/actions/marketingTasks.ts`)은 그대로
두고 컴포넌트만 `IndustryCooperationBoard.tsx`/`IndustryMarketingBoard.tsx`로
새로 짰다. 옛 `CooperationBoard.tsx`/`MarketingTaskBoard.tsx`는 삭제됨.

- 칸반 컬럼 기준이 Business의 "단계"(순서가 있는 파이프라인)와 달리 각각
  "관계"(Cooperation)·"분류"(Marketing)라는 태그성 값이라 순서 개념이 없다 —
  컬럼 배지 문자는 라벨의 첫 글자를 그대로 쓴다(Business의 로마숫자 배지와
  같은 `codeOf` 방식을 재사용, 값만 다름).
- Cooperation은 담당자가 메인/서브 두 그룹(`mainAssignees`/`subAssignees`)이라
  `ManagerChips`를 두 번 렌더링한다. Marketing은 산출내역 연결 같은 기능이
  없어 `ConnectedQuotations` 상당 컴포넌트를 아예 만들지 않았다.
- 상단 환경설정 바(`TopSettingsBar`, showArchivedDefault/defaultView/Reset/
  Save as defaults)도 SI Business 2와 동일하게 구현했다 — 저장 키만 화면별로
  다르다(`cooperation-board:defaults`, `marketing-board:defaults`).

## Work Journal

`/dashboard/work-journal` — Cooperation/Marketing과 같은 방식으로 Claude Design
"Industry" 테마를 그 자리에서 적용했다(2026-08-29, 새 메뉴 아님). 데이터·서버
액션(`app/dashboard/actions/workJournal.ts`)은 그대로 두고
`IndustryWorkJournalBoard.tsx`로 화면만 새로 짰다. 옛 `WorkJournalBoard.tsx`는
삭제됨.

- 목업은 내용 중 `**굵게**`/`~~취소선~~`/`- [x] ` 같은 가벼운 마크다운을
  렌더링 단계에서 해석해 보여준다 — 저장되는 `content`는 여전히 평문이고,
  화면에 그릴 때만 `tokenizeLine()`으로 해석한다(데이터 마이그레이션 없음).
- 첨부파일은 목업과 달리 즉시 URL을 만들지 않는다 — 목록 조회 시 signed URL을
  전부 만들면 느려지므로, 카드를 펼치고 "첨부파일 N개 보기"를 눌렀을 때만
  `getWorkJournalAttachmentUrls()`로 그 항목의 URL만 받아온다(기존 동작 그대로
  유지, 이미지 파일은 썸네일 미리보기).
- 작성자 필터는 목업의 라디오형 `.seg`를 그대로 재사용했고, 새 일지 작성/수정
  폼은 모달이 아니라 목업처럼 목록 위에 인라인 카드로 펼쳐진다.
- 기존 `WorkJournalBoard.tsx`에는 폼 저장 실패 시에도 무조건 폼을 닫는
  버그(`onDone()`을 항상 호출)가 있었다 — 다시 그리면서 다른 Industry 화면과
  같은 `wasPendingRef` + `useEffect` 패턴으로 함께 고쳤다.

## Calendar

`/dashboard/events2` — 사용자가 Claude Design으로 만든 "Industry" 테마
캘린더 목업을 그대로 이식했다(2026-08-29, SI Business 2와 같은 디자인
시스템 — `components/industryTheme.css` 공유). SI Business 2와 달리 이건
**같은 화면을 그 자리에서 다시 그린 것**이다(새 메뉴를 따로 만들지 않음) —
기존 `team_events_v2` 데이터·서버 액션(`app/dashboard/actions/eventsV2.ts`)은
그대로 두고 화면(`components/dashboard/IndustryEventCalendar.tsx`)만 새로
짰다. 옛 `TeamEventCalendarV2.tsx`/`EventMonthNav.tsx`는 삭제됨.

- 디자인 목업은 월/주/일 세 가지 보기를 지원하는데, 기존 화면은 월 보기만
  있었다 — 주/일 보기를 새로 추가하면서 월 단위로만 데이터를 불러오는 기존
  구조(`getTeamEventsV2(supabase, month)`)는 그대로 뒀다. 주/일 보기에서
  이동하다 달 경계를 넘으면 URL의 `month`뿐 아니라 정확한 날짜를 가리키는
  `day` 파라미터도 함께 갱신해서, 새로 불러온 달의 데이터에서 그 날짜부터
  다시 보여준다(`IndustryEventCalendar.tsx`의 `navigateTo`).
- 디자인 목업은 태그(분류)가 고정 4종(시공/설치·미팅/방문·예정·기타)이지만,
  실제 데이터는 자유 텍스트 태그가 14종 이상 쓰이고 있어(회식/미팅/행사/휴일 등)
  4종으로 줄이면 정보가 손실된다 — 목업의 "점 하나로 분류 표시" 방식은 그대로
  따르되, 점 색은 기존 `TeamEventCalendarV2`의 태그별 Tailwind 색 매핑을 hex
  값으로 옮긴 `TAG_DOT_COLORS`를 그대로 재사용한다.
- 일정의 나머지 필드(종료일시로 여러 날 걸치는 일정, 시간 유무, 담당자·참석자,
  장소·대상·내용)는 목업에 없던 것들이지만 실제 운영에 쓰이고 있어 그대로
  유지했다 — 다이얼로그에 전부 남아 있다.

## Memo Board

`/dashboard/memos` — Claude Design "Industry" 테마 목업("게시판 디자인
요청.zip")을 이식했다(2026-08-29, 같은 디자인 시스템 —
`components/industryTheme.css` 공유). Business3/Calendar와 달리 이 화면은
**단일 컴포넌트로 뷰를 전환하는 SPA 구조가 아니라 원래부터 라우트가 나뉜
구조**(`/dashboard/memos`, `/new`, `/[id]`, `/[id]/edit`)를 그대로 유지했다 —
목업은 리스트/작성/상세를 한 컴포넌트의 `view` 상태로 전환하지만, 실제 앱은
`notifications` 테이블의 `link`가 `/dashboard/memos/${id}`를 직접 가리키고
(알림 벨 딥링크), `AiCommandBar.tsx`가 `createMemo` 서버 액션의
`redirect()` 동작에 의존하고 있어 라우트 구조를 바꾸면 이 둘이 깨진다.
그래서 각 페이지의 JSX만 Industry 스타일로 새로 그리고, 서버 액션·데이터
쿼리(`app/dashboard/memos/actions.ts`, `lib/queries/memos.ts`)는 전혀
건드리지 않았다.

- 구분(`business`/`cooperation`/`marketing`/`etc`)은 목업의
  Business/Cooperation/Marketing/General과 값만 다르고 개념은 동일 —
  기존 `CATEGORY_LABEL` 매핑을 그대로 썼다.
- 첨부파일(이미지·PDF·Office 문서·ZIP, 최대 5개)은 목업에 없던 기능이지만
  실제 운영에 쓰이고 있어 작성/수정/상세 화면에 그대로 유지했다.

## 폴더 구조

```
app/
  login/                이메일+비밀번호 로그인
  auth/callback/         code→세션 교환 (route handler)
  auth/set-password/     초대·재설정 후 새 비밀번호 저장
  auth/forgot-password/  재설정 메일 요청
  admin/                 관리자 전용: 팀원 등록 폼 + 가입자 목록, 전체 Industry 테마
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
