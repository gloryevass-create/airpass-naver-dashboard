import "@/components/industryTheme.css";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { getBusinessProjectsV2 } from "@/lib/queries/businessProjectsV2";
import { getTeamMemberNames } from "@/lib/queries/teamMembers";
import { getQuotations } from "@/lib/queries/quotations";
import { IndustryBusinessBoard } from "@/components/dashboard/IndustryBusinessBoard";

// SI Business 2 — SI Business(/dashboard/business2)와 같은 business_projects_v2
// 데이터를 사용자가 Claude Design으로 만든 "Industry" 청사진 테마로 다시 그린
// 화면(사용자 확인, 2026-08-28). 별도 데이터가 아니라 같은 데이터를 보는 또
// 하나의 화면이라, 여기서 추가·수정·삭제하면 기존 SI Business 화면에도 그대로
// 반영된다(app/dashboard/actions/businessProjectsV2.ts가 두 경로를 함께 무효화).
export default async function Business3Page() {
  const { supabase } = await requireAuthedClient();
  const [projects, members, quotations] = await Promise.all([
    getBusinessProjectsV2(supabase),
    getTeamMemberNames(supabase),
    getQuotations(supabase),
  ]);

  return <IndustryBusinessBoard projects={projects} members={members} quotations={quotations} />;
}
