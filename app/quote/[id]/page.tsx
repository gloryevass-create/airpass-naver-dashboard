import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getQuotation } from "@/lib/queries/quotations";
import { QuotationPrintView } from "@/components/dashboard/QuotationPrintView";

type Params = Promise<{ id: string }>;

// 자료메일발송으로 고객에게 보내는 공개 링크 — 로그인 없이 열 수 있어야 해서
// /dashboard 바깥에 둔다(app/dashboard/layout.tsx의 사이드바·헤더가 안 씌워짐,
// proxy.ts PUBLIC_PATHS에도 등록됨). RLS를 anon까지 열어주는 대신, 이 서버
// 컴포넌트에서만 service_role로 딱 하나의 산출내역을 id로 조회한다 — UUID를
// 아는 사람만 접근 가능한 "링크 소유자 = 접근 권한" 방식(구글드라이브 공유
// 링크와 같은 방식, 사용자 확인 2026-08-28).
export default async function PublicQuotationPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = createAdminClient();
  const quotation = await getQuotation(supabase, id);
  if (!quotation) notFound();

  return <QuotationPrintView quotation={quotation} showDownloadButton />;
}
