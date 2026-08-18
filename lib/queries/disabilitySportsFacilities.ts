import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

export type DisabilitySportsFacility = {
  id: string;
  facilityName: string;
  provinceName: string | null;
  districtName: string | null;
  operatingBody: string | null;
  phoneNumber: string | null;
  homepageUrl: string | null;
  hasVoucherProgram: boolean | null;
  hasBandabiFacility: boolean | null;
  syncedAt: string;
};

export async function getDisabilitySportsFacilities(
  supabase: Client
): Promise<DisabilitySportsFacility[]> {
  const { data } = await supabase
    .from("disability_sports_facilities")
    .select("*")
    .order("province_name", { ascending: true })
    .order("facility_name", { ascending: true });

  return (data ?? []).map((f) => ({
    id: f.id,
    facilityName: f.facility_name,
    provinceName: f.province_name,
    districtName: f.district_name,
    operatingBody: f.operating_body,
    phoneNumber: f.phone_number,
    homepageUrl: f.homepage_url,
    hasVoucherProgram: f.has_voucher_program,
    hasBandabiFacility: f.has_bandabi_facility,
    syncedAt: f.synced_at,
  }));
}
