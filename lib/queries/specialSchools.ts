import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type SpecialSchool = {
  id: string;
  schoolName: string;
  provinceName: string | null;
  foundationType: string | null;
  disabilityDomain: string | null;
  principalName: string | null;
  approvalDate: string | null;
  openingDate: string | null;
  principalOfficePhone: string | null;
  adminOfficePhone: string | null;
  teacherOfficePhone: string | null;
  faxNumber: string | null;
  zipCode: string | null;
  address: string | null;
  homepageUrl: string | null;
  referenceDate: string | null;
  syncedAt: string;
};

// 하루 한 번만 파이프라인이 통째로 교체하는 참고용 스냅샷이라 요청마다 새로 조회할
// 필요가 없다 — unstable_cache(1시간 재검증)로 재방문 시 Supabase 왕복을 없앤다.
// 캐시된 조회는 요청자별 RLS 세션과 무관한 공용 데이터라 admin(service_role)
// 클라이언트로 수행한다(페이지 자체는 이미 requireAuthedClient()로 인증 게이트를
// 거친 뒤에만 이 함수를 호출한다).
const getCachedRows = unstable_cache(
  async () => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("special_schools")
      .select("*")
      .order("province_name", { ascending: true })
      .order("school_name", { ascending: true });
    return data ?? [];
  },
  ["special-schools"],
  { revalidate: 3600 }
);

export async function getSpecialSchools(): Promise<SpecialSchool[]> {
  const data = await getCachedRows();

  return data.map((s) => ({
    id: s.id,
    schoolName: s.school_name,
    provinceName: s.province_name,
    foundationType: s.foundation_type,
    disabilityDomain: s.disability_domain,
    principalName: s.principal_name,
    approvalDate: s.approval_date,
    openingDate: s.opening_date,
    principalOfficePhone: s.principal_office_phone,
    adminOfficePhone: s.admin_office_phone,
    teacherOfficePhone: s.teacher_office_phone,
    faxNumber: s.fax_number,
    zipCode: s.zip_code,
    address: s.address,
    homepageUrl: s.homepage_url,
    referenceDate: s.reference_date,
    syncedAt: s.synced_at,
  }));
}
