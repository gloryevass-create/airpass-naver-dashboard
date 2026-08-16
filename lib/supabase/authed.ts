import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { createClient } from "./server";
import { isSupabaseConfigured } from "./env";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

/** 로그인 여부만 확인. 미설정/미로그인이면 /login으로 리다이렉트. */
export async function requireAuthedClient() {
  if (!isSupabaseConfigured) redirect("/login");

  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return { supabase, user: user as User };
}

/** 로그인 + profiles.role === 'admin' 확인. 비관리자는 /dashboard로 리다이렉트. */
export async function requireAdminClient() {
  const { supabase, user } = await requireAuthedClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<ProfileRow>();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  return { supabase, user, profile };
}
