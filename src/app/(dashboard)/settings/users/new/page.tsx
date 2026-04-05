import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth-utils";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";
import { UserForm } from "@/components/users/user-form";

export const metadata = { title: "New User | HR Recruitment System" };

export default async function NewUserPage() {
  await requireSuperAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create User</h1>
          <p className="text-sm text-muted-foreground">Add a new recruiter or admin account</p>
        </div>
      </div>

      <UserForm />
    </div>
  );
}
