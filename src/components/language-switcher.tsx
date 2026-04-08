"use client";

import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { Select } from "@/components/ui/select";
import { Globe } from "lucide-react";

const LOCALES = [
  { code: "en", name: "English" },
  { code: "ar", name: "العربية" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
];

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  function onLocaleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newLocale = e.target.value;
    const segments = pathname.split("/");
    segments[1] = newLocale;
    const newPath = segments.join("/");
    router.push(newPath);
  }

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={currentLocale} onChange={onLocaleChange}>
        {LOCALES.map((locale) => (
          <option key={locale.code} value={locale.code}>
            {locale.name}
          </option>
        ))}
      </Select>
    </div>
  );
}