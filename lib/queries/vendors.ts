import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { driveFileViewUrl } from "@/lib/googleDriveAttachments";

type Client = SupabaseClient<Database>;

export type VendorDocumentType = "business_registration" | "bankbook" | "business_card" | "product_material";

export type VendorDocument = {
  id: string;
  documentType: VendorDocumentType;
  originalName: string;
  storagePath: string | null;
  driveFileId: string | null;
  signedUrl: string | null;
  createdAt: string;
};

export type Vendor = {
  id: string;
  companyName: string;
  businessNumber: string | null;
  representativeName: string | null;
  businessType: string | null;
  businessItem: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  bankName: string | null;
  accountNumber: string | null;
  accountHolder: string | null;
  contactName: string | null;
  contactTitle: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  notes: string | null;
  documents: VendorDocument[];
  updatedAt: string;
};

const SIGNED_URL_TTL_SECONDS = 60 * 60;

type VendorDocumentRow = Database["public"]["Tables"]["vendor_documents"]["Row"];

export async function getVendors(supabase: Client): Promise<Vendor[]> {
  const [{ data: vendors }, { data: documents }] = await Promise.all([
    supabase.from("partner_vendors").select("*").order("company_name", { ascending: true }),
    supabase.from("vendor_documents").select("*").order("created_at", { ascending: false }),
  ]);

  const docsByVendor = new Map<string, VendorDocumentRow[]>();
  for (const doc of documents ?? []) {
    const list = docsByVendor.get(doc.vendor_id) ?? [];
    list.push(doc);
    docsByVendor.set(doc.vendor_id, list);
  }

  const legacyDocs = (documents ?? []).filter((doc) => doc.storage_path);
  const signedUrls = await Promise.all(
    legacyDocs.map((doc) =>
      supabase.storage.from("vendor-documents").createSignedUrl(doc.storage_path as string, SIGNED_URL_TTL_SECONDS)
    )
  );
  const signedUrlByPath = new Map(
    legacyDocs.map((doc, i) => [doc.storage_path as string, signedUrls[i].data?.signedUrl ?? null])
  );

  return (vendors ?? []).map((v) => ({
    id: v.id,
    companyName: v.company_name,
    businessNumber: v.business_number,
    representativeName: v.representative_name,
    businessType: v.business_type,
    businessItem: v.business_item,
    address: v.address,
    phone: v.phone,
    email: v.email,
    bankName: v.bank_name,
    accountNumber: v.account_number,
    accountHolder: v.account_holder,
    contactName: v.contact_name,
    contactTitle: v.contact_title,
    contactPhone: v.contact_phone,
    contactEmail: v.contact_email,
    notes: v.notes,
    updatedAt: v.updated_at,
    documents: (docsByVendor.get(v.id) ?? []).map((d) => ({
      id: d.id,
      documentType: d.document_type,
      originalName: d.original_name,
      storagePath: d.storage_path,
      driveFileId: d.drive_file_id,
      signedUrl: d.drive_file_id
        ? driveFileViewUrl(d.drive_file_id)
        : d.storage_path
          ? (signedUrlByPath.get(d.storage_path) ?? null)
          : null,
      createdAt: d.created_at,
    })),
  }));
}
