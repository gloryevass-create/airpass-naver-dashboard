-- ============================================================================
-- 영업지원 — 제품 카탈로그 / 협력사 관리
--
-- 참고 저장소(WHIZZUP Sales Hub)의 기능 컨셉을 우리 스택(Supabase RLS +
-- authenticated 직접 접근, 사이트 콜라보레이션용 D1/서버API 계층 없음)으로 다시
-- 구현한다. 원본 저장소의 회원별 정렬순서·즐겨찾기·equipment_items 캐스케이드
-- 갱신 같은, 우리 프로젝트에 대응 개념이 없는 부가 기능은 가져오지 않는다
-- (사용자 확인, 2026-08-22).
--
-- 광고전략메모(0005)와 동일하게 팀 전체가 함께 쓰는 데이터라 authenticated
-- 세션이면 누구나 CRUD 가능하게 한다(service_role 전용이 아님).
-- ============================================================================

create table if not exists public.product_catalog (
  id uuid primary key default gen_random_uuid(),
  source_row integer,
  name text not null,
  specification text,
  unit_price numeric,
  note text,
  commission_rate numeric,
  margin_rate numeric,
  supply_type text not null default 'partner' check (supply_type in ('partner', 'direct')),
  reference text,
  procurement boolean not null default false,
  procurement_channel text,
  procurement_number text,
  procurement_fee_rate numeric,
  needs_review boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_row)
);

create index if not exists idx_product_catalog_name on public.product_catalog (name);

alter table public.product_catalog enable row level security;

create policy "authenticated can select product catalog"
  on public.product_catalog for select
  using (auth.role() = 'authenticated');

create policy "authenticated can insert product catalog"
  on public.product_catalog for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated can update product catalog"
  on public.product_catalog for update
  using (auth.role() = 'authenticated');

create policy "authenticated can delete product catalog"
  on public.product_catalog for delete
  using (auth.role() = 'authenticated');

create table if not exists public.partner_vendors (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  business_number text,
  representative_name text,
  business_type text,
  business_item text,
  address text,
  phone text,
  email text,
  bank_name text,
  account_number text,
  account_holder text,
  contact_name text,
  contact_title text,
  contact_phone text,
  contact_email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_partner_vendors_company_name on public.partner_vendors (company_name);

alter table public.partner_vendors enable row level security;

create policy "authenticated can select vendors"
  on public.partner_vendors for select
  using (auth.role() = 'authenticated');

create policy "authenticated can insert vendors"
  on public.partner_vendors for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated can update vendors"
  on public.partner_vendors for update
  using (auth.role() = 'authenticated');

create policy "authenticated can delete vendors"
  on public.partner_vendors for delete
  using (auth.role() = 'authenticated');

create table if not exists public.vendor_documents (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.partner_vendors (id) on delete cascade,
  document_type text not null check (document_type in ('business_registration', 'bankbook', 'business_card')),
  original_name text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_vendor_documents_vendor on public.vendor_documents (vendor_id);

alter table public.vendor_documents enable row level security;

create policy "authenticated can select vendor documents"
  on public.vendor_documents for select
  using (auth.role() = 'authenticated');

create policy "authenticated can insert vendor documents"
  on public.vendor_documents for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated can delete vendor documents"
  on public.vendor_documents for delete
  using (auth.role() = 'authenticated');

-- 협력사 문서 저장용 Storage 버킷 — 비공개(public=false), signed URL로만 다운로드 허용
-- (ad_strategy_memo_attachments의 memo-attachments 버킷과 동일한 패턴, 0005 참고)
insert into storage.buckets (id, name, public)
values ('vendor-documents', 'vendor-documents', false)
on conflict (id) do nothing;

create policy "authenticated can upload vendor documents"
  on storage.objects for insert
  with check (bucket_id = 'vendor-documents' and auth.role() = 'authenticated');

create policy "authenticated can read vendor documents"
  on storage.objects for select
  using (bucket_id = 'vendor-documents' and auth.role() = 'authenticated');

create policy "authenticated can delete vendor documents in storage"
  on storage.objects for delete
  using (bucket_id = 'vendor-documents' and auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- 제품 카탈로그 초기 데이터 — 참고 저장소(WHIZZUP)의 lib/product-catalog.ts에
-- 있던 실제 에어패스 제품 목록(98건)을 그대로 시딩한다. supply_type/procurement*
-- 필드는 원본의 note 텍스트 기반 자동판별 로직(G2B/S2B/디지털서비스몰/혁신장터
-- 패턴 매칭)을 그대로 재현해 미리 계산해 넣었다.
-- ----------------------------------------------------------------------------
insert into public.product_catalog (source_row, name, specification, unit_price, note, commission_rate, margin_rate, supply_type, procurement, procurement_channel, procurement_number, procurement_fee_rate, needs_review) values
(15, '가상스포츠시스템 (터치스크린)', '멀티미디어학습장치, 에어패스 AP-EDUVR-01, 가상체육시스템', 27000000, '㈜에어패스 G2B : 24563902', 0.25, null, 'partner', true, 'G2B', '24563902', 0.0054, false),
(16, '가상스포츠시스템 (3X 비전)', '멀티미디어학습장치 AP-EDUVR-M1, 가상체육시스템', 18000000, '㈜에어패스 G2B : 23592730', 0.25, null, 'partner', true, 'G2B', '23592730', 0.0054, false),
(17, '가상스포츠시스템 (3면형 스크린)', '멀티미디어학습장치, 에어패스 AP-EDUVR-Tri, 가상체험형시스템', 69000000, '㈜에어패스 G2B : 25192743', 0.25, null, 'partner', true, 'G2B', '25192743', 0.0054, false),
(18, '가상스포츠시스템 (터치스크린)', '멀티미디어학습장치, 에어패스 AP-EDUVR-03, 가상체육시스템', 14900000, '㈜에어패스 G2B : 25611679', 0.25, null, 'partner', true, 'G2B', '25611679', 0.0054, false),
(19, '라이더센서', '라이더센서(케이스 포함)', 3900000, '물품수의계약', 0.2, null, 'partner', false, null, null, null, false),
(20, '3X비전센서', '3X VISION 시스템 센서 / XR스크린 스포츠용', 5500000, '㈜에어패스 S2B : 202507143379297', 0.2, null, 'partner', true, 'S2B', '202507143379297', 0.0054, false),
(21, '에어패스 가상사격시스템', '가상사격용 카메라센서 세트 / 카메라센서, 총, 콘텐츠 포함', 7000000, '㈜에어패스 G2B : 25221033', 0.3, null, 'partner', true, 'G2B', '25221033', 0.0054, false),
(22, '에어패스 가상사격시스템', '멀티미디어학습장치, 에어패스 AP-EDUVR-02(S), 가상사격학습시스템', 14900000, '㈜에어패스 G2B : 25200804', 0.3, null, 'partner', true, 'G2B', '25200804', 0.0054, false),
(23, '교구 세트', '전면 스크린형 전용 교구 세트', 2100000, '물품수의계약', 0.15, null, 'partner', false, null, null, null, false),
(24, '콘텐츠', '교육용소프트웨어, 에어패스 EDUVR마스터', 15000000, '㈜에어패스 디지털서비스몰 G2B : 23804642', 0.5, null, 'partner', true, '디지털서비스몰', '23804642', 0.0054, false),
(25, '콘텐츠', '교육용소프트웨어, 에어패스 AP-EDU-CNTS1, 교육용콘텐츠', 2700000, '㈜에어패스 G2B : 23674376', 0.5, null, 'partner', true, 'G2B', '23674376', 0.0054, false),
(26, '콘텐츠', '교육용소프트웨어, 에어패스 AP-EDU-CNTS2, 교육용콘텐츠', 2700000, 'G2B 23674375', 0.5, null, 'partner', true, 'G2B', '23674375', 0.0054, false),
(27, '콘텐츠', '교육용소프트웨어, 에어패스 AP-EDU-CNTS3, 체육', 2700000, 'G2B 23674377', 0.5, null, 'partner', true, 'G2B', '23674377', 0.0054, false),
(28, '콘텐츠', '교육용소프트웨어, 에어패스 AP-EDU-CNTS4, 체육', 2700000, 'G2B 23674378', 0.5, null, 'partner', true, 'G2B', '23674378', 0.0054, false),
(29, '콘텐츠', '교육용소프트웨어, 에어패스 AP-EDU-CNTS5, 체육', 2700000, 'G2B 23674379', 0.5, null, 'partner', true, 'G2B', '23674379', 0.0054, false),
(30, '콘텐츠', '교육용소프트웨어, 에어패스 AIFIT-CNTS1, 멀티미디어교육컨텐츠, 체육/실내놀이', 2500000, 'G2B 25946271', 0.5, null, 'partner', true, 'G2B', '25946271', 0.0054, false),
(31, '콘텐츠', '교육용소프트웨어, 에어패스 AIFIT-CNTS2, 멀티미디어교육컨텐츠, 체육/실내놀이', 4900000, 'G2B 25946272', 0.5, null, 'partner', true, 'G2B', '25946272', 0.0054, false),
(32, '콘텐츠', '교육용소프트웨어, 에어패스 AIFIT-CNTS3, 멀티미디어교육컨텐츠, 체육/실내놀이', 2500000, 'G2B 25946273', 0.5, null, 'partner', true, 'G2B', '25946273', 0.0054, false),
(33, '콘텐츠', '교육용소프트웨어, 에어패스 AIFIT-CNTS4, 멀티미디어교육컨텐츠, 체육/인지기능', 4900000, 'G2B 25946274', 0.5, null, 'partner', true, 'G2B', '25946274', 0.0054, false),
(34, '콘텐츠', '교육용소프트웨어, 에어패스 AIFIT-SHOT1, 멀티미디어교육컨텐츠, 사격', 12000000, 'G2B 25954568', 0.5, null, 'partner', true, 'G2B', '25954568', 0.0054, false),
(35, '콘텐츠', '교육용소프트웨어, 에어패스 AIFIT-SHOT2, 멀티미디어교육컨텐츠, 사격', 18000000, 'G2B 25954569', 0.5, null, 'partner', true, 'G2B', '25954569', 0.0054, false),
(36, '콘텐츠', '교육용소프트웨어, 에어패스 인터랙티브 미디어 월, 미디어아트, 가상전시관', 21600000, 'G2B 25954846', 0.5, null, 'partner', true, 'G2B', '25954846', 0.0054, false),
(37, '디지털스케치', '디지털 스케치(컬러링) 스크린, 콘텐츠', 22000000, '㈜에어패스 G2B 25441648', 0.25, null, 'partner', true, 'G2B', '25441648', 0.0054, false),
(38, '디지털스케치', '디지털 스케치(컬러링) 콘텐츠, 함체', 12000000, '㈜에어패스 디지털서비스몰 G2B 25210590', 0.5, null, 'partner', true, '디지털서비스몰', '25210590', 0.0054, false),
(39, '빔프로젝터', '비디오프로젝터, Epson (PH)EB-L260F, 4600ANSI lm', 2310000, '주식회사 트리엠 G2B 25011241', 0.3, null, 'partner', true, 'G2B', '25011241', 0.0054, false),
(40, '빔프로젝터', 'Epson (PH)EB-L530U, 5200ANSI lm', 3630000, '트리엠 G2B 24271634', 0.35, null, 'partner', true, 'G2B', '24271634', 0.0054, false),
(41, '빔프로젝터', 'Shenzhen Colorwin CN/LU-500UST, 5000ANSI lm', 3905000, '㈜단테크 G2B 23886324', 0.31, null, 'partner', true, 'G2B', '23886324', 0.0054, false),
(42, '빔프로젝터', 'Shenzhen Colorwin CN/LU-600UST, 6000ANSI lm', 5170000, '㈜단테크 G2B 23886323', 0.31, null, 'partner', true, 'G2B', '23886323', 0.0054, false),
(43, '빔프로젝터', '비디오프로젝터 보호함체', 2000000, '물품수의계약', 0, null, 'partner', false, null, null, null, false),
(44, '가상체육시스템', '모션 가상체육시스템 SMR 7500 / 75Inch 전자칠판 기능 가능', 8780000, '㈜컴버스테크 G2B 24167367', 0.25, null, 'partner', true, 'G2B', '24167367', 0.0054, false),
(45, '멀티미디어학습장치 3D motion sports', '에어패스 AIFIT-3D MOTION, 가상체육시스템', 9900000, '㈜에어패스 G2B 25816875', 0.3, null, 'partner', true, 'G2B', '25816875', 0.0054, false),
(46, '아이핏 전자칠판형 (AiFit)', '멀티미디어학습장치, 에어패스 AIFIT-PREMIUM, 가상체육시스템', 24900000, 'G2B 25815808', 0.3, null, 'partner', true, 'G2B', '25815808', 0.0054, false),
(47, '아이핏 (AiFit)', '멀티미디어학습장치, 에어패스 APM-002, 가상체육시스템', 18400000, 'G2B 24435683', 0.25, null, 'partner', true, 'G2B', '24435683', 0.0054, false),
(48, '빔프로젝터', null, null, null, null, null, 'partner', false, null, null, null, true),
(49, '아이핏 슬림형 (AiFit)', '멀티미디어학습장치, 에어패스 AIFIT-FLOOR, 가상체육시스템', 19500000, 'G2B 25814005', 0.3, null, 'partner', true, 'G2B', '25814005', 0.0054, false),
(50, '바닥형 스크린 (디딤)', '멀티미디어학습장치, 투핸즈인터랙티브 DIDIM-KA19PL', 22000000, '㈜디딤 G2B 24425235', 0.25, null, 'partner', true, 'G2B', '24425235', 0.0054, false),
(51, '바닥형 스크린 (디딤)', '멀티미디어학습장치, 투핸즈인터랙티브 DIDIM-MINI', 16500000, 'G2B 25844844', 0.25, null, 'partner', true, 'G2B', '25844844', 0.0054, false),
(52, '바닥형 스크린 (아이터치)', 'GS11GM', 5500000, 'G2B 25793098', 0.15, null, 'partner', true, 'G2B', '25793098', 0.0054, false),
(53, '바닥형 스크린 (아이터치)', 'GS11G', 7700000, 'G2B 25671632', 0.25, null, 'partner', true, 'G2B', '25671632', 0.0054, false),
(54, '바닥형 스크린 (아이터치)', 'GS11C', 8800000, 'G2B 25667197', 0.25, null, 'partner', true, 'G2B', '25667197', 0.0054, false),
(55, '바닥형 스크린 (아이터치)', 'GS12G', 11000000, 'G2B 25667195', 0.3, null, 'partner', true, 'G2B', '25667195', 0.0054, false),
(56, '바닥형 스크린 (아이터치)', 'GS12C', 12100000, 'G2B 25667198', 0.3, null, 'partner', true, 'G2B', '25667198', 0.0054, false),
(57, '바닥형 스크린 (아이터치)', 'GS13G', 14300000, 'G2B 25667196', 0.3, null, 'partner', true, 'G2B', '25667196', 0.0054, false),
(58, '바닥형 스크린 (아이터치)', 'GS13C', 16500000, 'G2B 25667199', 0.35, null, 'partner', true, 'G2B', '25667199', 0.0054, false),
(59, '멀티미디어학습장치 (바닥형인터랙티브)', '하다퓨처스 HD-FL-SC-(FS01)', 19990000, '㈜하다퓨처스 G2B 25620220', 0.3, null, 'partner', true, 'G2B', '25620220', 0.0054, false),
(60, '스마트짐', '교육용소프트웨어, 에어패스 아이핏 스마트짐, 교육용콘텐츠, 체육', 9990000, '디지털서비스몰 G2B 25946256', 0.3, null, 'partner', true, '디지털서비스몰', '25946256', 0.0054, false),
(61, '아이핏 PAPS 콘텐츠', '교육용소프트웨어, 에어패스 AIFIT PAPS', 8500000, 'G2B 25569293', 0.5, null, 'partner', true, 'G2B', '25569293', 0.0054, false),
(62, '터치테이블', '위즈업, 멀티미디어학습장치', 5500000, '주식회사 위즈업 물품수의', null, 0.5545454545454546, 'direct', false, null, null, null, false),
(63, '터치테이블', '에어패스 APM-003', 5500000, 'G2B 24533259', 0.3, null, 'partner', true, 'G2B', '24533259', 0.0054, false),
(64, '터치테이블', '아바비젼 ATT-320N', 3960000, 'G2B 24157055', 0.25, null, 'partner', true, 'G2B', '24157055', 0.0054, false),
(65, '터치테이블', '아바비젼 ATT-320PN', 4950000, 'G2B 24157053', 0.25, null, 'partner', true, 'G2B', '24157053', 0.0054, false),
(66, '터치테이블', '아바비젼 ATT-430-G', 5610000, 'G2B 24707585', 0.25, null, 'partner', true, 'G2B', '24707585', 0.0054, false),
(67, '홀로그램', 'HoloMagicP32 / 32인치 / 128GB', 9900000, '쓰리디뱅크 혁신장터 G2B 24587056', 0.3, null, 'partner', true, '혁신장터', '24587056', 0.0054, false),
(68, '바리스타 시스템', '운영PC, HMD 포함', 12000000, '에어패스 디지털서비스몰 G2B 25087573', 0.2, null, 'partner', true, '디지털서비스몰', '25087573', 0.0054, false),
(69, '직업훈련시스템', 'VR 사무보조 직업훈련, VR교육', 12000000, '에어패스 디지털서비스몰 G2B 25604846', 0.2, null, 'partner', true, '디지털서비스몰', '25604846', 0.0054, false),
(70, '바이크 시스템', '야핏 바이크 시뮬레이터 (TV, 거치대, 태블릿 포함)', 5900000, '물품수의계약', 0.55, null, 'partner', false, null, null, null, false),
(71, '멀티미디어학습장치', '마이베네핏 VM2', 18000000, '마이베네핏 G2B 25220288', 0.2, null, 'partner', true, 'G2B', '25220288', 0.0054, false),
(72, '스키 시뮬레이터', '에어패스 AP-SKI-001', 14900000, '에어패스 G2B 25229618', 0.25, null, 'partner', true, 'G2B', '25229618', 0.0054, false),
(73, '스키시뮬레이터', null, null, null, null, null, 'partner', false, null, null, null, true),
(74, '휠리엑스', 'AP-WHEELYX-01 / 트레드밀, 태블릿, 거치대, 전용 앱', 14900000, '물품수의계약', 0.2, null, 'partner', false, null, null, null, false),
(75, '휠체어', null, null, null, null, null, 'partner', false, null, null, null, true),
(76, '바닥형 스크린', 'DIDIM-KA19PL', 22000000, '투핸즈인터랙티브 G2B 24425235', 0.25, null, 'partner', true, 'G2B', '24425235', 0.0054, false),
(77, '교육용소프트웨어 (didim)', null, null, null, null, null, 'partner', false, null, null, null, true),
(78, '윗몸일으키기', '올댓비젼 ATV-EDU-SPORTS_008', 13200000, 'G2B 26158545', 0.25, null, 'partner', true, 'G2B', '26158545', 0.0054, false),
(79, '제자리 멀리뛰기', '올댓비젼 ATV-EDU-SPORTS_009', 13200000, 'G2B 26158546', 0.25, null, 'partner', true, 'G2B', '26158546', 0.0054, false),
(80, '앉아윗몸앞으로굽히기', '올댓비젼 ATV-EDU-SPORTS_010', 13200000, 'G2B 26158544', 0.25, null, 'partner', true, 'G2B', '26158544', 0.0054, false),
(81, '스마트미러', '올댓비젼 ATV-EDU-SPORTS_001', 9900000, 'G2B 25735436', 0.25, null, 'partner', true, 'G2B', '25735436', 0.0054, false),
(82, '스마트 피트니스 학생 운동 초급 패키지', null, null, null, null, null, 'partner', false, null, null, null, true),
(83, '스마트 피트니스 학생 운동 중급 패키지', null, null, null, null, null, 'partner', false, null, null, null, true),
(84, '왕복달리기', '올댓비젼 ATV-EDU-SPORTS_004', 17600000, 'G2B 25739474', 0.25, null, 'partner', true, 'G2B', '25739474', 0.0054, false),
(85, '사이드스탭', '올댓비젼 ATV-EDU-SPORTS_002', 17600000, 'G2B 25735438', 0.25, null, 'partner', true, 'G2B', '25735438', 0.0054, false),
(86, 'ATV-EDU-S2 PLUS PACK', null, null, null, null, null, 'partner', false, null, null, null, true),
(87, '철봉', '올댓비젼 ATV-EDU-SPORTS_003', 17600000, 'G2B 25735439', 0.25, null, 'partner', true, 'G2B', '25735439', 0.0054, false),
(88, 'ATV-EDU-S3 PLUS PACK', null, null, null, null, null, 'partner', false, null, null, null, true),
(89, '테이블 축구', '올댓비젼 ATV-EDU-SPORTS_006', 24750000, 'G2B 25739473', 0.25, null, 'partner', true, 'G2B', '25739473', 0.0054, false),
(90, '스크린 피칭 / 축구', '올댓비젼 ATV-EDU-SPORTS_006', 33000000, 'G2B 25735441', 0.25, null, 'partner', true, 'G2B', '25735441', 0.0054, false),
(91, '농구 (부스형 / 벽면형)', '올댓비젼 ATV-EDU-SPORTS_012', 33000000, 'G2B 26172954', 0.25, null, 'partner', true, 'G2B', '26172954', 0.0054, false),
(92, '축구', '올댓비젼 ATV-EDU-SPORTS_005', 33000000, 'G2B 25735440', 0.25, null, 'partner', true, 'G2B', '25735440', 0.0054, false),
(93, '익스피디언스', '익스피디언스 짐몬', 6990000, '물품수의계약', 0.35, null, 'partner', false, null, null, null, false),
(94, '벤치프레스 의자', null, null, null, null, null, 'partner', false, null, null, null, true),
(95, '로잉 머신', null, null, null, null, null, 'partner', false, null, null, null, true),
(96, '스마트미러 (미트니스)', '에스엠메이커스 MT-SM4300', 5000000, 'G2B 24931446', 0.2, null, 'partner', true, 'G2B', '24931446', 0.0054, false),
(97, 'SM-EDU-CNTS_MASTER', null, null, null, null, null, 'partner', false, null, null, null, true),
(98, '스마트미러+심박계시스템', '에스엠메이커스 SMS-MT4300_CL', 18500000, 'G2B 25465617', 0.3, null, 'partner', true, 'G2B', '25465617', 0.0054, false),
(99, '에스엠팝스', '에스엠메이커스 SMS-MT4300_CL', 15000000, '물품수의계약', 0.2, null, 'partner', false, null, null, null, false),
(100, '바이크 시뮬레이터 1', '컨셉트2 바이크', 2500000, '물품수의계약', 0.25, null, 'partner', false, null, null, null, false),
(101, '바이크 시뮬레이터', null, null, null, null, null, 'partner', false, null, null, null, true),
(102, 'VR기기', '메타에듀시스 AI융합 스포츠 VR솔루션', 2450000, 'G2B 26227765', 0.25, null, 'partner', true, 'G2B', '26227765', 0.0054, false),
(103, '암벽등반', '단테크 AREX CLIMB', 40040000, '단테크 G2B 25871177', 0.25, null, 'partner', true, 'G2B', '25871177', 0.0054, false),
(104, '빔프로젝터', null, null, null, null, null, 'partner', false, null, null, null, true),
(105, '인공지능 및 코딩교육', '럭스로보 Let''s MODI', 620000, '에어패스 디지털서비스몰 S2B 24949317', 0.3, null, 'partner', true, 'S2B', '24949317', 0.0054, false),
(106, '전자칠판', '컴버스테크 IG75ZG', 2900000, 'G2B 25148359', 0.25, null, 'partner', true, 'G2B', '25148359', 0.0054, false),
(107, '파크골프', 'MKT-GF-01', 19800000, '메이커스테크놀로지 G2B 25800875', 0.25, null, 'partner', true, 'G2B', '25800875', 0.0054, false),
(108, '파크골프', 'LEZURO-01', 24750000, '국제파크골프 G2B 25443738', 0.27, null, 'partner', true, 'G2B', '25443738', 0.0054, false),
(110, '파크골프', '가이드삼정 GSG-FPG', 24700000, 'G2B 25796066', 0.3, null, 'partner', true, 'G2B', '25796066', 0.0054, false),
(111, '파크골프', 'GSG-FPG1, 전용부스 포함', 29000000, 'G2B 25813952', 0.25, null, 'partner', true, 'G2B', '25813952', 0.0054, false),
(112, '파크골프', '다해씨엔씨 DH-GTR2000', 18150000, '다해씨앤씨 G2B 24457879', 0.25, null, 'partner', true, 'G2B', '24457879', 0.0054, false),
(113, '파크골프', '에어패스 AIFIT-PARKGOLF', 24900000, '에어패스 G2B 25814006', 0.25, null, 'partner', true, 'G2B', '25814006', 0.0054, false)
on conflict (source_row) do nothing;
