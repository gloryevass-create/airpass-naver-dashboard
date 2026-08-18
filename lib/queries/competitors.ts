import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

export type Competitor = {
  id: string;
  name: string;
  domain: string | null;
  blogId: string | null;
  isActive: boolean;
};

export async function getActiveCompetitors(supabase: Client): Promise<Competitor[]> {
  const { data } = await supabase
    .from("competitors")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    domain: c.domain,
    blogId: c.blog_id,
    isActive: c.is_active,
  }));
}
