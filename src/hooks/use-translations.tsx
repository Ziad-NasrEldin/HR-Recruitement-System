"use client";

import { useTranslations as useTranslationsClient } from "next-intl";

export function useTranslations(namespace?: string) {
  return useTranslationsClient(namespace);
}