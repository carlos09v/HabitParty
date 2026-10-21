import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  XCircle,
} from "lucide-react";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { CookieConsentBanner } from "@/components/layout/CookieConsentBanner";
import { ThemeInitializer } from "@/components/layout/ThemeInitializer";
import { getThemeMode } from "@/utils/cookies";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HabitParty",
  description: "Gerencie suas tarefas com gamificação.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getThemeMode();

  return (
    <html lang="pt-BR" className={theme} suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} font-sans antialiased overflow-x-hidden`}
      >
        <ThemeInitializer theme={theme} />
        {children}
        <Toaster
          theme={theme}
          position="top-right"
          icons={{
            success: (
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.25)]">
                <CheckCircle2 size={15} />
              </div>
            ),
            error: (
              <div className="w-6 h-6 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0 shadow-[0_0_10px_rgba(239,68,68,0.25)]">
                <XCircle size={15} />
              </div>
            ),
            warning: (
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.25)]">
                <AlertTriangle size={15} />
              </div>
            ),
            info: (
              <div className="w-6 h-6 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0 shadow-[0_0_10px_rgba(56,189,248,0.25)]">
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
                "!bg-surface/95 !border-primary/35 !text-neutral-50 shadow-2xl rounded-2xl border backdrop-blur-xl text-sm font-medium !py-3.5 !px-4 !gap-3",
              title: "!text-neutral-50 font-bold text-sm leading-tight",
              description: "!text-neutral-300 text-xs mt-0.5 leading-snug",
              actionButton:
                "bg-gold hover:bg-gold-hover text-neutral-900 font-bold transition-colors rounded-lg",
              cancelButton:
                "bg-white/10 hover:bg-white/15 text-neutral-300 transition-colors rounded-lg",
              error:
                "!bg-gradient-to-r !from-surface/98 !to-red-950/40 !border-danger-500/60 !text-neutral-50 shadow-[0_0_24px_rgba(239,68,68,0.22)]",
              success:
                "!bg-gradient-to-r !from-surface/98 !to-emerald-950/35 !border-emerald-500/50 !text-neutral-50 shadow-[0_0_24px_rgba(16,185,129,0.2)]",
              warning:
                "!bg-gradient-to-r !from-surface/98 !to-amber-950/35 !border-warning-500/60 !text-neutral-50 shadow-[0_0_24px_rgba(245,158,11,0.2)]",
              info: "!bg-gradient-to-r !from-surface/98 !to-sky-950/35 !border-info/60 !text-neutral-50 shadow-[0_0_24px_rgba(56,189,248,0.2)]",
            },
          }}
        />
        <CookieConsentBanner />
      </body>
    </html>
  );
}
