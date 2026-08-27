import { notFound } from "next/navigation";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { getQuotation } from "@/lib/queries/quotations";
import { QuotationPrintView } from "@/components/dashboard/QuotationPrintView";

type Params = Promise<{ id: string }>;

export default async function QuotationPrintPage({ params }: { params: Params }) {
  const { id } = await params;
  const { supabase } = await requireAuthedClient();
  const quotation = await getQuotation(supabase, id);
  if (!quotation) notFound();

  return <QuotationPrintView quotation={quotation} />;
}
