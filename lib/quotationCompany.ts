// 산출내역 인쇄용 레터헤드에 쓰는 공급자(에어패스) 정보. 사업자번호·대표자는
// WHIZZUP 레퍼런스 사이트가 에어패스 제품 견적을 대행 발급할 때 쓰던 실제
// 등록 정보를 그대로 가져왔다(2026-08-27). 주소·전화번호·팩스번호·업태·종목은
// 사용자가 제공한 실제 최신 정보로 갱신했다(2026-09-07).
export const QUOTATION_SUPPLIER = {
  name: "(주)에어패스",
  businessNumber: "220-86-23479",
  representative: "임종호",
  address: "경기도 하남시 하남대로 947, D동 15층(풍산동)",
  businessType: "서비스",
  businessItems: "소프트웨어개발외",
  phone: "1577-2750",
  fax: "070-5180-7446",
} as const;
