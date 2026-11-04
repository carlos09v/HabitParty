import type { Metadata, Viewport } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { RootShell } from "@/components/layout/RootShell";
import { getLocaleMode, getThemeMode } from "@/utils/cookies";

export const instant = false;

export const viewport: Viewport = {
  colorScheme: "dark light",
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function AppRootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const [locale, theme] = await Promise.all([getLocaleMode(), getThemeMode()]);

  return (
    <RootShell locale={locale} theme={theme} scope="base">
      {children}
    </RootShell>
  );
}
