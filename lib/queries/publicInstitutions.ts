import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

export type PublicInstitution = {
  id: string;
  siteName: string;
  institutionType: string | null;
  institutionCategory: string | null;
  detailCategory: string | null;
  siteType: string | null;
  url: string | null;
  syncedAt: string;
};

export async function getPublicInstitutions(supabase: Client): Promise<PublicInstitution[]> {
  const { data } = await supabase
    .from("public_institutions")
    .select("*")
    .order("institution_type", { ascending: true })
    .order("site_name", { ascending: true });

  return (data ?? []).map((i) => ({
    id: i.id,
    siteName: i.site_name,
    institutionType: i.institution_type,
    institutionCategory: i.institution_category,
    detailCategory: i.detail_category,
    siteType: i.site_type,
    url: i.url,
    syncedAt: i.synced_at,
  }));
}
