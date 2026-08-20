import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type BusinessProject = {
  id: string;
  title: string;
  stage: string | null;
  status: string | null;
  orgName: string | null;
  participationType: string | null;
  workType: string | null;
  result: string | null;
  amount: number | null;
  progressRate: number | null;
  submissionDate: string | null;
  submissionDateIsDatetime: boolean;
  submissionMethod: string | null;
  presentationDate: string | null;
  presentationDateIsDatetime: boolean;
  constructionStart: string | null;
  constructionEnd: string | null;
  constructionContent: string | null;
  assignees: string[];
  notionUrl: string;
  syncedAt: string;
};

// business_projects는 Notion을 파이프라인이 하루 한 번 미러링만 하고 대시보드에서는
// 쓰지 않는 읽기 전용 데이터라 admin 클라이언트 + unstable_cache(1시간 재검증)로
// 감싼다. 인증 게이트는 호출부의 requireAuthedClient()가 담당하므로 supabase
// 클라이언트 인자를 받지 않는다.
const getCachedRows = unstable_cache(
  async () => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("business_projects")
      .select("*")
      .order("notion_created_at", { ascending: false });
    return data ?? [];
  },
  ["business-projects"],
  { revalidate: 3600 }
);

export async function getBusinessProjects(): Promise<BusinessProject[]> {
  const data = await getCachedRows();

  return data.map((p) => ({
    id: p.id,
    title: p.title,
    stage: p.stage,
    status: p.status,
    orgName: p.org_name,
    participationType: p.participation_type,
    workType: p.work_type,
    result: p.result,
    amount: p.amount,
    progressRate: p.progress_rate,
    submissionDate: p.submission_date,
    submissionDateIsDatetime: p.submission_date_is_datetime,
    submissionMethod: p.submission_method,
    presentationDate: p.presentation_date,
    presentationDateIsDatetime: p.presentation_date_is_datetime,
    constructionStart: p.construction_start,
    constructionEnd: p.construction_end,
    constructionContent: p.construction_content,
    assignees: p.assignees,
    notionUrl: p.notion_url,
    syncedAt: p.synced_at,
  }));
}
