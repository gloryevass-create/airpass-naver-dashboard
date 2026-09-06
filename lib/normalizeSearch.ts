// macOS(파인더)에서 올린 한글 파일명·텍스트는 자모가 분리된 NFD로 저장되는
// 경우가 많아, 검색창에 입력한 NFC 문자열과 바이트 단위로 달라 .includes()가
// 실패하는 문제가 있다(components/dashboard/MaterialEmailForm.tsx에서 처음
// 발견·수정, 2026-08-28) — AI HUB 검색(2026-09-06)부터는 이 정규화를 공용
// 유틸로 뽑아 재사용한다.
export function normalizeSearch(text: string): string {
  return text.normalize("NFC").toLowerCase();
}
