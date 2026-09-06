import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { formatMember } from "@/lib/formatMember";

type Client = SupabaseClient<Database>;

export type AiTool = {
  id: string;
  authorId: string;
  authorDisplay: string;
  title: string;
  url: string;
  description: string | null;
  createdAt: string;
};

export async function getAiTools(supabase: Client): Promise<AiTool[]> {
  const [{ data: tools }, { data: profiles }] = await Promise.all([
    supabase.from("ai_tools").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, email, name, title"),
  ]);

  const authorDisplayById = new Map<string, string>();
  for (const p of profiles ?? []) authorDisplayById.set(p.id, formatMember(p.name, p.title, p.email));

  return (tools ?? []).map((t) => ({
    id: t.id,
    authorId: t.author_id,
    authorDisplay: authorDisplayById.get(t.author_id) ?? t.author_email,
    title: t.title,
    url: t.url,
    description: t.description,
    createdAt: t.created_at,
  }));
}
