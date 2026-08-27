// 산출내역 인쇄용 레터헤드에 쓰는 공급자(에어패스) 정보. WHIZZUP 레퍼런스 사이트가
// 에어패스 제품 견적을 대행 발급할 때 쓰던 실제 등록 정보를 그대로 가져왔다
// (사업자번호·대표자·주소 — 우리 자신의 회사 정보라 그대로 재사용, 2026-08-27).
export const QUOTATION_SUPPLIER = {
  name: "(주)에어패스",
  businessNumber: "220-86-23479",
  representative: "임종호",
  address: "경기도 하남시 하남대로 947, 제디-15층(풍산동, 하남테크노밸리 U1 CENTER)",
  businessType: "서비스 · 제조업",
  businessItems: "멀티미디어학습장치 · 소프트웨어개발 · 스크린스포츠 시뮬레이터 설치",
  phone: "02-561-1511",
} as const;
