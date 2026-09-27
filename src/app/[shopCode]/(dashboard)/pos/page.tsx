import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { POSTerminal } from "@/components/pos/POSTerminal";
import { Product, Category } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  const [productsRes, categoriesRes] = await Promise.all([
    supabase
      .from("products")
      .select("*, categories(*)")
      .eq("tenant_id", tenant.id)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("categories")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("name", { ascending: true }),
  ]);

  const products = productsRes.data || [];
  const categories = categoriesRes.data || [];

  return (
    <POSTerminal
      products={(products || []) as unknown as Product[]}
      categories={(categories || []) as Category[]}
      shopCode={shopCode}
    />
  );
}
