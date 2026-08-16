// 손으로 작성한 임시 타입입니다.
// Supabase 프로젝트가 준비되면 아래 명령으로 교체하세요:
//   npx supabase gen types typescript --project-id <project-ref> > lib/types/database.types.ts
//
// 주의 1: 반드시 `type` 객체 리터럴로 선언할 것 — `interface`로 선언하면
// 암묵적 인덱스 시그니처가 없어 `extends Record<string, unknown>` 검사를
// 통과하지 못하고 Supabase 제네릭 쿼리 결과가 전부 `never`로 추론된다.
// 주의 2: 각 테이블에 `Relationships: []`(빈 배열이라도)를 반드시 넣을 것 —
// 이 필드가 없으면 postgrest-js의 GenericTable 제약을 만족하지 못해
// 역시 쿼리 결과가 전부 `never`로 추론된다. (`supabase gen types`가 생성하는
// 출력에는 항상 이 필드가 포함된다.)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          role: "admin" | "member";
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: "admin" | "member";
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: "admin" | "member";
          created_at?: string;
        };
        Relationships: [];
      };
      keywords: {
        Row: {
          id: string;
          naver_keyword_id: string;
          keyword: string;
          campaign_id: string | null;
          adgroup_id: string | null;
          status: string;
          is_excluded: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          naver_keyword_id: string;
          keyword: string;
          campaign_id?: string | null;
          adgroup_id?: string | null;
          status?: string;
          is_excluded?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          naver_keyword_id?: string;
          keyword?: string;
          campaign_id?: string | null;
          adgroup_id?: string | null;
          status?: string;
          is_excluded?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      keyword_daily_metrics: {
        Row: {
          id: string;
          date: string;
          keyword_id: string;
          monthly_search_pc: number | null;
          monthly_search_mobile: number | null;
          avg_cpc: number | null;
          competition_level: string | null;
          our_rank: number | null;
          monthly_click_pc: number | null;
          monthly_click_mobile: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          keyword_id: string;
          monthly_search_pc?: number | null;
          monthly_search_mobile?: number | null;
          avg_cpc?: number | null;
          competition_level?: string | null;
          our_rank?: number | null;
          monthly_click_pc?: number | null;
          monthly_click_mobile?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          keyword_id?: string;
          monthly_search_pc?: number | null;
          monthly_search_mobile?: number | null;
          avg_cpc?: number | null;
          competition_level?: string | null;
          our_rank?: number | null;
          monthly_click_pc?: number | null;
          monthly_click_mobile?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      competitors: {
        Row: {
          id: string;
          name: string;
          domain: string | null;
          blog_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          domain?: string | null;
          blog_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          domain?: string | null;
          blog_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      ad_spend_estimates: {
        Row: {
          id: string;
          date: string;
          competitor_id: string;
          keyword_id: string;
          estimated_monthly_spend: number;
          calc_basis: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          competitor_id: string;
          keyword_id: string;
          estimated_monthly_spend: number;
          calc_basis?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          competitor_id?: string;
          keyword_id?: string;
          estimated_monthly_spend?: number;
          calc_basis?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      blog_posts: {
        Row: {
          id: string;
          competitor_id: string;
          url: string;
          title: string | null;
          published_at: string | null;
          collected_at: string;
        };
        Insert: {
          id?: string;
          competitor_id: string;
          url: string;
          title?: string | null;
          published_at?: string | null;
          collected_at?: string;
        };
        Update: {
          id?: string;
          competitor_id?: string;
          url?: string;
          title?: string | null;
          published_at?: string | null;
          collected_at?: string;
        };
        Relationships: [];
      };
      blog_sov_daily: {
        Row: {
          id: string;
          date: string;
          keyword_id: string;
          competitor_id: string;
          share_pct: number;
        };
        Insert: {
          id?: string;
          date: string;
          keyword_id: string;
          competitor_id: string;
          share_pct: number;
        };
        Update: {
          id?: string;
          date?: string;
          keyword_id?: string;
          competitor_id?: string;
          share_pct?: number;
        };
        Relationships: [];
      };
      posting_cadence: {
        Row: {
          id: string;
          date: string;
          competitor_id: string;
          avg_interval_days: number | null;
          last_post_at: string | null;
          post_count_30d: number | null;
        };
        Insert: {
          id?: string;
          date: string;
          competitor_id: string;
          avg_interval_days?: number | null;
          last_post_at?: string | null;
          post_count_30d?: number | null;
        };
        Update: {
          id?: string;
          date?: string;
          competitor_id?: string;
          avg_interval_days?: number | null;
          last_post_at?: string | null;
          post_count_30d?: number | null;
        };
        Relationships: [];
      };
      pipeline_runs: {
        Row: {
          id: string;
          date: string;
          track: "ad" | "blog";
          status: "success" | "partial" | "failed";
          message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          track: "ad" | "blog";
          status: "success" | "partial" | "failed";
          message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          track?: "ad" | "blog";
          status?: "success" | "partial" | "failed";
          message?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      daily_reports: {
        Row: {
          id: string;
          date: string;
          report_type: "daily" | "weekly" | "monthly";
          track: "ad" | "blog" | "combined";
          title: string;
          content_md: string;
          source_refs: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          report_type: "daily" | "weekly" | "monthly";
          track: "ad" | "blog" | "combined";
          title: string;
          content_md: string;
          source_refs?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          report_type?: "daily" | "weekly" | "monthly";
          track?: "ad" | "blog" | "combined";
          title?: string;
          content_md?: string;
          source_refs?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      alerts: {
        Row: {
          id: string;
          date: string;
          severity: "info" | "warning" | "critical";
          category: string;
          message: string;
          evidence_ref: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          severity: "info" | "warning" | "critical";
          category: string;
          message: string;
          evidence_ref?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          severity?: "info" | "warning" | "critical";
          category?: string;
          message?: string;
          evidence_ref?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
