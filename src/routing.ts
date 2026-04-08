import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ar", "fr", "de"],
  defaultLocale: "en",
  localePrefix: "never",
});