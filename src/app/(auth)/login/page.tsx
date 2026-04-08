import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { Briefcase } from "lucide-react";
import { getTranslations } from "next-intl/server";

export const metadata = {
  title: "Login | HR Recruitment System",
};

export default async function LoginPage() {
  const t = await getTranslations("auth");

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-24">
      <div className="w-full max-w-md">
        <div className="mb-12 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-accent-premium flex items-center justify-center text-accent-premium-foreground shadow-lg shadow-accent-premium/20">
            <Briefcase className="h-6 w-6" />
          </div>
          <h1 className="text-4xl font-bold tracking-tighter text-foreground">
            HR Recruitment
          </h1>
          <p className="text-muted-foreground max-w-[280px] mx-auto text-balance">
            {t("loginDescription")}
          </p>
        </div>
        
        <div className="relative p-2 rounded-[2rem] bg-accent/50 border border-border ring-1 ring-border/50 shadow-2xl shadow-accent-premium/5">
          <div className="bg-card rounded-[calc(2rem-0.5rem)] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
            <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-muted" />}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}