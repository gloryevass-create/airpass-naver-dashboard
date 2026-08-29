"use server";

import { revalidatePath } from "next/cache";
import { requireAuthedClient } from "@/lib/supabase/authed";

export async function disconnectGoogleCalendar(): Promise<void> {
  const { supabase, user } = await requireAuthedClient();
  await supabase.from("google_calendar_connections").delete().eq("user_id", user.id);
  revalidatePath("/dashboard/events2");
}
