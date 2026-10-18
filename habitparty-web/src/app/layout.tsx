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
          toastOptions={{
            classNames: {
              toast:
                "!bg-surface/95 !border-white/15 !text-neutral-50 shadow-2xl rounded-xl border backdrop-blur-md text-sm font-medium",
              title: "!text-neutral-50 font-bold text-sm",
              description: "!text-neutral-300 text-xs",
              actionButton:
                "bg-gold hover:bg-gold-hover text-neutral-900 font-bold transition-colors",
              cancelButton:
                "bg-white/10 hover:bg-white/15 text-neutral-300 transition-colors",
              error:
                "!bg-surface/95 !border-danger-500/60 !text-neutral-50 shadow-[0_0_20px_rgba(239,68,68,0.18)]",
              success:
                "!bg-surface/95 !border-success-500/60 !text-neutral-50 shadow-[0_0_20px_rgba(34,197,94,0.18)]",
              warning:
                "!bg-surface/95 !border-warning-500/60 !text-neutral-50 shadow-[0_0_20px_rgba(245,158,11,0.18)]",
              info: "!bg-surface/95 !border-info/60 !text-neutral-50 shadow-[0_0_20px_rgba(56,189,248,0.18)]",
            },
          }}
        />
        <CookieConsentBanner />
      </body>
    </html>
  );
}
