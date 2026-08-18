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
          spend_7d: number | null;
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
          spend_7d?: number | null;
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
          spend_7d?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      ad_account_daily_stats: {
        Row: {
          id: string;
          date: string;
          imp_cnt: number;
          clk_cnt: number;
          ccnt: number;
          sales_amt: number;
          ctr: number | null;
          cpc: number | null;
          bizmoney: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          imp_cnt?: number;
          clk_cnt?: number;
          ccnt?: number;
          sales_amt?: number;
          ctr?: number | null;
          cpc?: number | null;
          bizmoney?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          imp_cnt?: number;
          clk_cnt?: number;
          ccnt?: number;
          sales_amt?: number;
          ctr?: number | null;
          cpc?: number | null;
          bizmoney?: number | null;
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
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          domain?: string | null;
          blog_id?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          domain?: string | null;
          blog_id?: string | null;
          is_active?: boolean;
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
      ad_strategy_memos: {
        Row: {
          id: string;
          author_id: string;
          author_email: string;
          category: "keyword" | "blog" | "etc";
          title: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          author_email: string;
          category: "keyword" | "blog" | "etc";
          title: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          author_email?: string;
          category?: "keyword" | "blog" | "etc";
          title?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      ad_strategy_memo_attachments: {
        Row: {
          id: string;
          memo_id: string;
          file_name: string;
          storage_path: string;
          file_size: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          memo_id: string;
          file_name: string;
          storage_path: string;
          file_size?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          memo_id?: string;
          file_name?: string;
          storage_path?: string;
          file_size?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      ad_strategy_memo_comments: {
        Row: {
          id: string;
          memo_id: string;
          author_id: string;
          author_email: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          memo_id: string;
          author_id: string;
          author_email: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          memo_id?: string;
          author_id?: string;
          author_email?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      news_articles: {
        Row: {
          id: string;
          keyword: string;
          title: string;
          link: string;
          description: string | null;
          published_at: string | null;
          collected_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          keyword: string;
          title: string;
          link: string;
          description?: string | null;
          published_at?: string | null;
          collected_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          keyword?: string;
          title?: string;
          link?: string;
          description?: string | null;
          published_at?: string | null;
          collected_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      budget_bids: {
        Row: {
          id: string;
          keyword: string;
          business_type: "cnstwk" | "servc" | "thng";
          bid_no: string;
          bid_ord: string;
          title: string;
          notice_inst: string | null;
          demand_inst: string | null;
          budget_amount: number | null;
          presmpt_price: number | null;
          notice_date: string | null;
          opening_date: string | null;
          detail_url: string | null;
          collected_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          keyword: string;
          business_type: "cnstwk" | "servc" | "thng";
          bid_no: string;
          bid_ord?: string;
          title: string;
          notice_inst?: string | null;
          demand_inst?: string | null;
          budget_amount?: number | null;
          presmpt_price?: number | null;
          notice_date?: string | null;
          opening_date?: string | null;
          detail_url?: string | null;
          collected_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          keyword?: string;
          business_type?: "cnstwk" | "servc" | "thng";
          bid_no?: string;
          bid_ord?: string;
          title?: string;
          notice_inst?: string | null;
          demand_inst?: string | null;
          budget_amount?: number | null;
          presmpt_price?: number | null;
          notice_date?: string | null;
          opening_date?: string | null;
          detail_url?: string | null;
          collected_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      monitor_keywords: {
        Row: {
          id: string;
          track: "news" | "budget";
          keyword: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          track: "news" | "budget";
          keyword: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          track?: "news" | "budget";
          keyword?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      youtube_channel_stats: {
        Row: {
          id: string;
          date: string;
          subscriber_count: number;
          view_count: number;
          video_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          subscriber_count?: number;
          view_count?: number;
          video_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          subscriber_count?: number;
          view_count?: number;
          video_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      youtube_videos: {
        Row: {
          id: string;
          video_id: string;
          title: string;
          published_at: string | null;
          view_count: number;
          like_count: number;
          comment_count: number;
          duration_seconds: number | null;
          thumbnail_url: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          video_id: string;
          title: string;
          published_at?: string | null;
          view_count?: number;
          like_count?: number;
          comment_count?: number;
          duration_seconds?: number | null;
          thumbnail_url?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          video_id?: string;
          title?: string;
          published_at?: string | null;
          view_count?: number;
          like_count?: number;
          comment_count?: number;
          duration_seconds?: number | null;
          thumbnail_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      team_events: {
        Row: {
          id: string;
          notion_page_id: string;
          title: string;
          date_start: string;
          date_end: string | null;
          is_datetime: boolean;
          category: string | null;
          tags: string[];
          target: string | null;
          location: string | null;
          content: string | null;
          assignees: string[];
          attendees: string[];
          notion_url: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          notion_page_id: string;
          title: string;
          date_start: string;
          date_end?: string | null;
          is_datetime?: boolean;
          category?: string | null;
          tags?: string[];
          target?: string | null;
          location?: string | null;
          content?: string | null;
          assignees?: string[];
          attendees?: string[];
          notion_url: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          notion_page_id?: string;
          title?: string;
          date_start?: string;
          date_end?: string | null;
          is_datetime?: boolean;
          category?: string | null;
          tags?: string[];
          target?: string | null;
          location?: string | null;
          content?: string | null;
          assignees?: string[];
          attendees?: string[];
          notion_url?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      youth_facilities: {
        Row: {
          id: string;
          facility_name: string;
          representative_name: string | null;
          operating_body: string | null;
          operation_mode: string | null;
          foundation_subject: string | null;
          foundation_org_detail: string | null;
          installation_type: string | null;
          facility_type: string | null;
          province_name: string | null;
          district_name: string | null;
          road_address: string | null;
          lot_address: string | null;
          latitude: number | null;
          longitude: number | null;
          homepage_url: string | null;
          phone_number: string | null;
          fax_number: string | null;
          email: string | null;
          operating_hours: string | null;
          holiday_info: string | null;
          has_parking: boolean | null;
          capacity_count: number | null;
          overnight_capacity_count: number | null;
          stay_capacity_count: number | null;
          companion_capacity_count: number | null;
          first_registered_date: string | null;
          reference_date: string | null;
          is_exposed: boolean | null;
          remarks: string | null;
          synced_at: string;
        };
        Insert: {
          id?: string;
          facility_name: string;
          representative_name?: string | null;
          operating_body?: string | null;
          operation_mode?: string | null;
          foundation_subject?: string | null;
          foundation_org_detail?: string | null;
          installation_type?: string | null;
          facility_type?: string | null;
          province_name?: string | null;
          district_name?: string | null;
          road_address?: string | null;
          lot_address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          homepage_url?: string | null;
          phone_number?: string | null;
          fax_number?: string | null;
          email?: string | null;
          operating_hours?: string | null;
          holiday_info?: string | null;
          has_parking?: boolean | null;
          capacity_count?: number | null;
          overnight_capacity_count?: number | null;
          stay_capacity_count?: number | null;
          companion_capacity_count?: number | null;
          first_registered_date?: string | null;
          reference_date?: string | null;
          is_exposed?: boolean | null;
          remarks?: string | null;
          synced_at?: string;
        };
        Update: {
          id?: string;
          facility_name?: string;
          representative_name?: string | null;
          operating_body?: string | null;
          operation_mode?: string | null;
          foundation_subject?: string | null;
          foundation_org_detail?: string | null;
          installation_type?: string | null;
          facility_type?: string | null;
          province_name?: string | null;
          district_name?: string | null;
          road_address?: string | null;
          lot_address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          homepage_url?: string | null;
          phone_number?: string | null;
          fax_number?: string | null;
          email?: string | null;
          operating_hours?: string | null;
          holiday_info?: string | null;
          has_parking?: boolean | null;
          capacity_count?: number | null;
          overnight_capacity_count?: number | null;
          stay_capacity_count?: number | null;
          companion_capacity_count?: number | null;
          first_registered_date?: string | null;
          reference_date?: string | null;
          is_exposed?: boolean | null;
          remarks?: string | null;
          synced_at?: string;
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
