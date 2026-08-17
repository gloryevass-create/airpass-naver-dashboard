import "server-only";

// airpass-naver-monitor의 scripts/lib/g2b-client.ts와 동일한 스펙(나라장터 입찰공고정보서비스,
// 실측으로 확인한 정확한 경로) — 새 키워드를 등록하는 즉시 그 자리에서 백필하기 위해
// 대시보드 서버에도 같은 클라이언트를 둔다.
const BASE_URL = "https://apis.data.go.kr/1230000/ad/BidPublicInfoService";

export type BusinessType = "cnstwk" | "servc" | "thng";

const OPERATION: Record<BusinessType, string> = {
  cnstwk: "getBidPblancListInfoCnstwkPPSSrch",
  servc: "getBidPblancListInfoServcPPSSrch",
  thng: "getBidPblancListInfoThngPPSSrch",
};

export type BidItem = {
  bidNtceNo: string;
  bidNtceOrd: string;
  bidNtceNm: string;
  ntceInsttNm?: string;
  dminsttNm?: string;
  bdgtAmt?: string;
  presmptPrce?: string;
  bidNtceDt?: string;
  opengDt?: string;
  bidNtceDtlUrl?: string;
};

type SuccessResponse = {
  response: { header: { resultCode: string; resultMsg: string }; body: { items: BidItem[]; totalCount: number } };
};

async function searchBids(
  businessType: BusinessType,
  keyword: string,
  sinceYmd: string,
  untilYmd: string,
  numOfRows = 50
): Promise<BidItem[]> {
  const serviceKey = process.env.G2B_SERVICE_KEY;
  if (!serviceKey) throw new Error("G2B_SERVICE_KEY 환경변수가 설정되지 않았습니다.");

  const operation = OPERATION[businessType];
  const qs = [
    `serviceKey=${serviceKey}`,
    `pageNo=1`,
    `numOfRows=${numOfRows}`,
    `inqryDiv=1`,
    `inqryBgnDt=${sinceYmd}0000`,
    `inqryEndDt=${untilYmd}2359`,
    `bidNtceNm=${encodeURIComponent(keyword)}`,
    `type=json`,
  ].join("&");
  const url = `${BASE_URL}/${operation}?${qs}`;

  const res = await fetch(url);
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`나라장터 API 응답 파싱 실패(${businessType}/${keyword}): ${text.slice(0, 300)}`);
  }

  const success = json as Partial<SuccessResponse>;
  if (success.response?.header?.resultCode === "00") {
    return success.response.body?.items ?? [];
  }
  if (success.response?.header) {
    throw new Error(
      `나라장터 API 오류(${businessType}/${keyword}, ${success.response.header.resultCode}): ${success.response.header.resultMsg}`
    );
  }
  throw new Error(`나라장터 API 게이트웨이 오류(${businessType}/${keyword}): ${text.slice(0, 300)}`);
}

function toIso(ymdHm: string | undefined): string | null {
  if (!ymdHm) return null;
  const normalized = ymdHm.trim().replace(" ", "T");
  const withSeconds = normalized.length === 16 ? `${normalized}:00` : normalized;
  const d = new Date(`${withSeconds}+09:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function toNumberOrNull(v: string | undefined): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export type BudgetBidRow = {
  keyword: string;
  business_type: BusinessType;
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
};

const BUSINESS_TYPES: BusinessType[] = ["cnstwk", "servc", "thng"];
const WINDOW_DAYS = 30; // g2b-budget-fetch.ts와 동일 — API 조회 기간 최대 한도

function daysBeforeYmd(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

/** 키워드 하나를 업무구분(공사/용역/물품) 3종 모두 검색해 budget_bids upsert용 행으로
 * 바로 매핑한다(g2b-budget-fetch.ts와 동일한 정제 로직, 최근 30일 고정). */
export async function fetchBudgetBidsForKeyword(keyword: string): Promise<BudgetBidRow[]> {
  const since = daysBeforeYmd(WINDOW_DAYS - 1);
  const until = todayYmd();
  const seen = new Set<string>();
  const rows: BudgetBidRow[] = [];

  for (const businessType of BUSINESS_TYPES) {
    const items = await searchBids(businessType, keyword, since, until);
    for (const item of items) {
      const key = `${item.bidNtceNo}:${item.bidNtceOrd || "000"}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({
        keyword,
        business_type: businessType,
        bid_no: item.bidNtceNo,
        bid_ord: item.bidNtceOrd || "000",
        title: item.bidNtceNm,
        notice_inst: item.ntceInsttNm ?? null,
        demand_inst: item.dminsttNm ?? null,
        budget_amount: toNumberOrNull(item.bdgtAmt),
        presmpt_price: toNumberOrNull(item.presmptPrce),
        notice_date: toIso(item.bidNtceDt),
        opening_date: toIso(item.opengDt),
        detail_url: item.bidNtceDtlUrl || null,
      });
    }
  }
  return rows;
}
