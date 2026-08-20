import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

export type SeniorWelfareFacility = {
  id: string;
  facilityName: string;
  facilityType: string | null;
  provinceName: string | null;
  roadAddress: string | null;
  lotAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  businessStatus: string | null;
  phoneNumber: string | null;
  managingOrgName: string | null;
  providingInstName: string | null;
  referenceDate: string | null;
  syncedAt: string;
};

export async function getSeniorWelfareFacilities(supabase: Client): Promise<SeniorWelfareFacility[]> {
  const { data } = await supabase
    .from("senior_welfare_facilities")
    .select("*")
    .order("province_name", { ascending: true })
    .order("facility_name", { ascending: true });

  return (data ?? []).map((f) => ({
    id: f.id,
    facilityName: f.facility_name,
    facilityType: f.facility_type,
    provinceName: f.province_name,
    roadAddress: f.road_address,
    lotAddress: f.lot_address,
    latitude: f.latitude,
    longitude: f.longitude,
    businessStatus: f.business_status,
    phoneNumber: f.phone_number,
    managingOrgName: f.managing_org_name,
    providingInstName: f.providing_inst_name,
    referenceDate: f.reference_date,
    syncedAt: f.synced_at,
  }));
}
