import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${plusJakarta.variable} font-sans antialiased overflow-x-hidden`}
      >
        {children}
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            classNames: {
              toast: "shadow-xl rounded-lg border text-sm font-medium",
              title: "text-neutral-50 font-bold text-sm",
              description: "text-neutral-300 text-xs",
              actionButton:
                "bg-primary hover:bg-primary-dark text-neutral-50 transition-colors",
              cancelButton:
                "bg-surface hover:bg-surface-hover text-neutral-300 transition-colors",
              error: "!bg-danger-500 !text-white !border-danger-hover",
              success: "!bg-success-500 !text-white !border-success-hover",
              warning: "!bg-warning-500 !text-white !border-warning-hover",
              info: "!bg-info !text-white !border-info",
            },
          }}
        />
      </body>
    </html>
  );
}
