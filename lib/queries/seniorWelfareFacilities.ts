import { unstable_cache } from "next/cache";
import type { Database } from "@/lib/types/database.types";
import { createAdminClient } from "@/lib/supabase/admin";

export type SeniorWelfareFacility = {
  id: string;
  facilityName: string;
  facilityType: string | null;
  provinceName: string | null;
  roadAddress: string | null;
  lotAddress: string | null;
  businessStatus: string | null;
  phoneNumber: string | null;
  managingOrgName: string | null;
  providingInstName: string | null;
  referenceDate: string | null;
  syncedAt: string;
};

// 전국 약 3.5만 건 규모라 몇 가지 성능 문제가 있었다(실측 확인, 2026-08-20):
// 1) Supabase/PostgREST 기본 응답 상한(1000행) 때문에 range() 페이지네이션이 필수 —
//    안 하면 province_name 정렬 순서상 사전순 첫 지역(강원)만 채워지고 나머지가 안 보인다.
// 2) 36페이지를 순차로 받으면 약 9초, 병렬로 받으면 약 3초로 줄어든다.
// 3) 화면에서 안 쓰는 latitude/longitude까지 select("*")로 받으면 페이로드가 더 커진다
//    (화면 표시·CSV 내보내기 어디에도 위경도를 쓰지 않는다 — 필요해지면 다시 추가).
// 4) 이 테이블은 하루 한 번 파이프라인이 통째로 교체하는 참고용 스냅샷이라 요청마다
//    새로 조회할 필요가 없다 — unstable_cache로 감싸서 재검증 주기(1시간) 안에는
//    재방문 시 Supabase 왕복 없이 즉시 응답한다. 캐시된 조회는 요청자별 RLS 세션과
//    무관한 공용 데이터라 admin(service_role) 클라이언트로 수행한다(페이지 자체는
//    이미 requireAuthedClient()로 인증 게이트를 거친 뒤에만 이 함수를 호출한다).
const PAGE_SIZE = 1000;
const SELECT_COLUMNS =
  "id,facility_name,facility_type,province_name,road_address,lot_address,business_status,phone_number,managing_org_name,providing_inst_name,reference_date,synced_at";

type Row = Pick<
  Database["public"]["Tables"]["senior_welfare_facilities"]["Row"],
  | "id"
  | "facility_name"
  | "facility_type"
  | "province_name"
  | "road_address"
  | "lot_address"
  | "business_status"
  | "phone_number"
  | "managing_org_name"
  | "providing_inst_name"
  | "reference_date"
  | "synced_at"
>;

async function fetchAllRows(): Promise<Row[]> {
  const admin = createAdminClient();

  const { count } = await admin
    .from("senior_welfare_facilities")
    .select("*", { count: "exact", head: true });
  const total = count ?? 0;
  const pages = Math.ceil(total / PAGE_SIZE);

  const results = await Promise.all(
    Array.from({ length: pages }, (_, p) => {
      const from = p * PAGE_SIZE;
      return admin
        .from("senior_welfare_facilities")
        .select(SELECT_COLUMNS)
        .order("province_name", { ascending: true })
        .order("facility_name", { ascending: true })
        .range(from, from + PAGE_SIZE - 1);
    })
  );

  return results.flatMap((r) => (r.data ?? []) as Row[]);
}

const getCachedRows = unstable_cache(fetchAllRows, ["senior-welfare-facilities"], {
  revalidate: 3600,
});

// 인증 게이트는 호출부(app/dashboard/db/senior-welfare-facilities/page.tsx)의
// requireAuthedClient()가 담당한다 — 이 함수는 그 이후에만 호출되므로 별도의
// supabase 클라이언트 인자를 받지 않는다(캐시된 조회가 admin 클라이언트를 쓰기 때문에
// 어차피 요청자별 세션은 쓰이지 않는다).
export async function getSeniorWelfareFacilities(): Promise<SeniorWelfareFacility[]> {
  const rows = await getCachedRows();

  return rows.map((f) => ({
    id: f.id,
    facilityName: f.facility_name,
    facilityType: f.facility_type,
    provinceName: f.province_name,
    roadAddress: f.road_address,
    lotAddress: f.lot_address,
    businessStatus: f.business_status,
    phoneNumber: f.phone_number,
    managingOrgName: f.managing_org_name,
    providingInstName: f.providing_inst_name,
    referenceDate: f.reference_date,
    syncedAt: f.synced_at,
  }));
}
