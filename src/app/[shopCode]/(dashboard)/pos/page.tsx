import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { POSTerminal } from "@/components/pos/POSTerminal";
import { Product } from "@/types";

export default async function POSPage({
  params,
}: {
  params: Promise<{ shopCode: string }>;
}) {
  const { shopCode } = await params;
  const supabase = await createClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("shop_code", shopCode)
    .single();

  if (!tenant) {
    notFound();
  }

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("is_active", true)
    .order("name", { ascending: true });

  return <POSTerminal products={(products || []) as Product[]} />;
}
