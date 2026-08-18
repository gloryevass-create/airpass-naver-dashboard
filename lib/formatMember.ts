/** 이름/직함이 등록돼 있으면 "이름(직함)"으로, 이름만 있으면 이름만, 아직 등록 전이면
 * 이메일로 표시한다 — 초대 수락 전이거나 트리거 실행 이전의 레거시 계정 대응. */
export function formatMember(
  name: string | null | undefined,
  title: string | null | undefined,
  email: string
): string {
  if (!name) return email;
  return title ? `${name}(${title})` : name;
}
