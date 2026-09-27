import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin, tenants:tenant_id (shop_code)")
    .eq("id", user.id)
    .single();

  if (profile?.is_super_admin) {
    redirect("/founder");
  }

  const tenant = profile?.tenants as unknown as { shop_code?: string } | null;
  if (tenant?.shop_code) {
    redirect(`/${tenant.shop_code}/dashboard`);
  }

  redirect("/login");
}
