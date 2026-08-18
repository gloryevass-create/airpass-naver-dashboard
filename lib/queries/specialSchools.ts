import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

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

export async function getSpecialSchools(supabase: Client): Promise<SpecialSchool[]> {
  const { data } = await supabase
    .from("special_schools")
    .select("*")
    .order("province_name", { ascending: true })
    .order("school_name", { ascending: true });

  return (data ?? []).map((s) => ({
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
