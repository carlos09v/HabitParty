import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { RootShell } from "@/components/layout/RootShell";
import { getLocaleMode, getSitePolarity, getThemeMode } from "@/utils/cookies";

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
  const headerStore = await headers();
  const allowCustomThemes =
    headerStore.get("x-habitparty-theme-scope") !== "default";
  const [locale, theme] = await Promise.all([
    getLocaleMode(),
    allowCustomThemes ? getThemeMode() : getSitePolarity(),
  ]);

  return (
    <RootShell
      locale={locale}
      theme={theme}
      allowCustomThemes={allowCustomThemes}
      scope="base"
    >
      {children}
    </RootShell>
  );
}
