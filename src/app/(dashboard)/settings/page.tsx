import { requireSuperAdmin } from "@/lib/auth-utils";

export const metadata = { title: "Settings | HR Recruitment System" };

export default async function SettingsPage() {
  await requireSuperAdmin();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <p className="text-muted-foreground">User management and system settings will be built in Phase 6.</p>
    </div>
  );
}
