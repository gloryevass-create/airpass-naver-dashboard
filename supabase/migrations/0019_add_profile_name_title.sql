-- ============================================================================
-- profiles에 이름/직함 추가 — 관리자 초대 시 이름·직함을 함께 등록하고,
-- 이메일이 노출되던 자리(헤더, 관리자 목록, 메모 작성자)에 "이름(직함)"으로
-- 표시하기 위함이다. 초대 메일 수락 시 auth.users.raw_user_meta_data에 담긴
-- name/title을 handle_new_user() 트리거가 profiles로 그대로 옮겨 담는다.
-- ============================================================================

alter table public.profiles add column if not exists name text;
alter table public.profiles add column if not exists title text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, title)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'title'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 기존 admin 계정(looney@airpass.co.kr)에 이름/직함을 채워 넣는다.
update public.profiles
set name = '정윤강', title = '본부장'
where email = 'looney@airpass.co.kr';
