import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

export type MonitorTrack = "news" | "budget";

export type MonitorKeyword = { id: string; keyword: string };

export async function getMonitorKeywords(supabase: Client, track: MonitorTrack): Promise<MonitorKeyword[]> {
  const { data } = await supabase
    .from("monitor_keywords")
    .select("*")
    .eq("track", track)
    .order("keyword", { ascending: true });

  return (data ?? []).map((k) => ({ id: k.id, keyword: k.keyword }));
}
