import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  XCircle,
} from "lucide-react";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Toaster } from "sonner";
import { CookieConsentBanner } from "@/components/layout/CookieConsentBanner";
import { ThemeInitializer } from "@/components/layout/ThemeInitializer";
import { pickClientMessages } from "@/i18n/request";
import { getLocaleMode, getThemeMode } from "@/utils/cookies";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [theme, locale, messages] = await Promise.all([
    getThemeMode(),
    getLocaleMode(),
    getMessages(),
  ]);
  const clientMessages = pickClientMessages(messages);

  return (
    <html lang={locale} className={theme} suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} font-sans antialiased overflow-x-hidden`}
      >
        <NextIntlClientProvider locale={locale} messages={clientMessages}>
          <ThemeInitializer theme={theme} locale={locale} />
          {children}
          <Toaster
            theme={theme}
            position="top-right"
            icons={{
              success: (
                <div className="w-6 h-6 rounded-lg bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/35 dark:border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-2xs dark:shadow-[0_0_10px_rgba(16,185,129,0.25)]">
                  <CheckCircle2 size={15} />
                </div>
              ),
              error: (
                <div className="w-6 h-6 rounded-lg bg-red-500/15 dark:bg-red-500/20 border border-red-500/35 dark:border-red-500/40 flex items-center justify-center text-red-400 shrink-0 shadow-2xs dark:shadow-[0_0_10px_rgba(239,68,68,0.25)]">
                  <XCircle size={15} />
                </div>
              ),
              warning: (
                <div className="w-6 h-6 rounded-lg bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/35 dark:border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-2xs dark:shadow-[0_0_10px_rgba(245,158,11,0.25)]">
                  <AlertTriangle size={15} />
                </div>
              ),
              info: (
                <div className="w-6 h-6 rounded-lg bg-sky-500/15 dark:bg-sky-500/20 border border-sky-500/35 dark:border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0 shadow-2xs dark:shadow-[0_0_10px_rgba(56,189,248,0.25)]">
                  <Info size={15} />
                </div>
              ),
              loading: (
                <div className="w-6 h-6 rounded-lg bg-gold/20 border border-gold/40 flex items-center justify-center text-gold shrink-0">
                  <Loader2 size={15} className="animate-spin" />
                </div>
              ),
            }}
            toastOptions={{
              classNames: {
                toast:
                  "!bg-card dark:!bg-surface/95 !border-neutral-700 dark:!border-primary/35 !text-neutral-50 shadow-card-active dark:shadow-2xl rounded-2xl border backdrop-blur-xl text-sm font-medium !py-3.5 !px-4 !gap-3",
                title: "!text-neutral-50 font-bold text-sm leading-tight",
                description: "!text-neutral-300 text-xs mt-0.5 leading-snug",
                actionButton:
                  "bg-gold hover:bg-gold-hover text-on-gold font-bold transition-colors rounded-lg",
                cancelButton:
                  "bg-surface hover:bg-surface-hover dark:bg-white/10 dark:hover:bg-white/15 text-neutral-300 transition-colors rounded-lg",
                error:
                  "!bg-card dark:!bg-gradient-to-r dark:!from-surface/98 dark:!to-red-950/40 !border-danger-500/50 dark:!border-danger-500/60 !text-neutral-50 shadow-card-active dark:shadow-[0_0_24px_rgba(239,68,68,0.22)]",
                success:
                  "!bg-card dark:!bg-gradient-to-r dark:!from-surface/98 dark:!to-emerald-950/35 !border-success-500/50 dark:!border-emerald-500/50 !text-neutral-50 shadow-card-active dark:shadow-[0_0_24px_rgba(16,185,129,0.2)]",
                warning:
                  "!bg-card dark:!bg-gradient-to-r dark:!from-surface/98 dark:!to-amber-950/35 !border-warning-500/50 dark:!border-warning-500/60 !text-neutral-50 shadow-card-active dark:shadow-[0_0_24px_rgba(245,158,11,0.2)]",
                info: "!bg-card dark:!bg-gradient-to-r dark:!from-surface/98 dark:!to-sky-950/35 !border-info/50 dark:!border-info/60 !text-neutral-50 shadow-card-active dark:shadow-[0_0_24px_rgba(56,189,248,0.2)]",
              },
            }}
          />
          <CookieConsentBanner />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
