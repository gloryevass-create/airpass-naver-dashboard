import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

export type DisabilityWelfareCenter = {
  id: string;
  facilityName: string;
  facilityType: string | null;
  provinceName: string | null;
  roadAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  operatingStatus: string | null;
  establishmentDate: string | null;
  welfareFacilityId: string | null;
  syncedAt: string;
};

export async function getDisabilityWelfareCenters(supabase: Client): Promise<DisabilityWelfareCenter[]> {
  const { data } = await supabase
    .from("disability_welfare_centers")
    .select("*")
    .order("province_name", { ascending: true })
    .order("facility_name", { ascending: true });

  return (data ?? []).map((c) => ({
    id: c.id,
    facilityName: c.facility_name,
    facilityType: c.facility_type,
    provinceName: c.province_name,
    roadAddress: c.road_address,
    latitude: c.latitude != null ? Number(c.latitude) : null,
    longitude: c.longitude != null ? Number(c.longitude) : null,
    operatingStatus: c.operating_status,
    establishmentDate: c.establishment_date,
    welfareFacilityId: c.welfare_facility_id,
    syncedAt: c.synced_at,
  }));
}
