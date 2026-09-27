import { redirect } from "next/navigation";

export default async function DashboardRedirectPage({
  params,
}: {
  params: Promise<{ shopCode: string }>;
}) {
  const { shopCode } = await params;
  redirect(`/${shopCode}/dashboard`);
}
