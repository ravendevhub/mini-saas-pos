import { createClient } from "@/lib/supabase/server";
import { POSTerminal } from "@/components/pos/POSTerminal";
import { Product } from "@/types";

export default async function POSPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  return <POSTerminal products={(products || []) as Product[]} />;
}
