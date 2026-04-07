import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CampaignWidget } from "@/components/campaign/campaign-widget";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-[100dvh] overflow-hidden">
      <Sidebar role={session.user.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
         <main className="flex-1 overflow-y-auto p-6 lg:p-12">{children}</main>
      </div>
      <CampaignWidget />
    </div>
  );
}
