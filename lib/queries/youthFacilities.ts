import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

export type YouthFacility = {
  id: string;
  facilityName: string;
  representativeName: string | null;
  operatingBody: string | null;
  operationMode: string | null;
  foundationSubject: string | null;
  foundationOrgDetail: string | null;
  installationType: string | null;
  facilityType: string | null;
  provinceName: string | null;
  districtName: string | null;
  roadAddress: string | null;
  lotAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  homepageUrl: string | null;
  phoneNumber: string | null;
  faxNumber: string | null;
  email: string | null;
  operatingHours: string | null;
  holidayInfo: string | null;
  hasParking: boolean | null;
  capacityCount: number | null;
  overnightCapacityCount: number | null;
  stayCapacityCount: number | null;
  companionCapacityCount: number | null;
  firstRegisteredDate: string | null;
  referenceDate: string | null;
  isExposed: boolean | null;
  remarks: string | null;
  syncedAt: string;
};

export async function getYouthFacilities(supabase: Client): Promise<YouthFacility[]> {
  const { data } = await supabase
    .from("youth_facilities")
    .select("*")
    .order("province_name", { ascending: true })
    .order("facility_name", { ascending: true });

  return (data ?? []).map((f) => ({
    id: f.id,
    facilityName: f.facility_name,
    representativeName: f.representative_name,
    operatingBody: f.operating_body,
    operationMode: f.operation_mode,
    foundationSubject: f.foundation_subject,
    foundationOrgDetail: f.foundation_org_detail,
    installationType: f.installation_type,
    facilityType: f.facility_type,
    provinceName: f.province_name,
    districtName: f.district_name,
    roadAddress: f.road_address,
    lotAddress: f.lot_address,
    latitude: f.latitude != null ? Number(f.latitude) : null,
    longitude: f.longitude != null ? Number(f.longitude) : null,
    homepageUrl: f.homepage_url,
    phoneNumber: f.phone_number,
    faxNumber: f.fax_number,
    email: f.email,
    operatingHours: f.operating_hours,
    holidayInfo: f.holiday_info,
    hasParking: f.has_parking,
    capacityCount: f.capacity_count,
    overnightCapacityCount: f.overnight_capacity_count,
    stayCapacityCount: f.stay_capacity_count,
    companionCapacityCount: f.companion_capacity_count,
    firstRegisteredDate: f.first_registered_date,
    referenceDate: f.reference_date,
    isExposed: f.is_exposed,
    remarks: f.remarks,
    syncedAt: f.synced_at,
  }));
}
