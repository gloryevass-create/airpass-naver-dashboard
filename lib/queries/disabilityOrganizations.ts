import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

export type DisabilityOrganization = {
  id: string;
  groupName: string;
  provinceName: string | null;
  districtName: string | null;
  roadAddress: string | null;
  lotAddress: string | null;
  foundationDate: string | null;
  memberCount: number | null;
  phoneNumber: string | null;
  representativeName: string | null;
  referenceDate: string | null;
  providerOrgCode: string | null;
  providerOrgName: string | null;
  syncedAt: string;
};

export async function getDisabilityOrganizations(supabase: Client): Promise<DisabilityOrganization[]> {
  const { data } = await supabase
    .from("disability_organizations")
    .select("*")
    .order("province_name", { ascending: true })
    .order("group_name", { ascending: true });

  return (data ?? []).map((o) => ({
    id: o.id,
    groupName: o.group_name,
    provinceName: o.province_name,
    districtName: o.district_name,
    roadAddress: o.road_address,
    lotAddress: o.lot_address,
    foundationDate: o.foundation_date,
    memberCount: o.member_count,
    phoneNumber: o.phone_number,
    representativeName: o.representative_name,
    referenceDate: o.reference_date,
    providerOrgCode: o.provider_org_code,
    providerOrgName: o.provider_org_name,
    syncedAt: o.synced_at,
  }));
}
