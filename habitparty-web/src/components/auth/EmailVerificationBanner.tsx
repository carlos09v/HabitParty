import { MailWarning } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ResendVerificationButton } from "@/components/auth/ResendVerificationButton";
import type { UserResponseDTO } from "@/types/user";

interface EmailVerificationBannerProps {
  initialUser: UserResponseDTO | null;
}

export async function EmailVerificationBanner({
  initialUser: user,
}: EmailVerificationBannerProps) {
  // Só renderiza no servidor para contas com emailVerified explicitamente false (pós-criação com e-mail e senha)
  if (!user || user.emailVerified !== false) {
    return null;
  }

  const t = await getTranslations("emailVerificationBanner");

  return (
    <aside
      aria-label={t("ariaLabel")}
      aria-live="polite"
      className="w-full shrink-0 border-b border-gold/30 bg-gold/10 backdrop-blur-md px-4 py-2.5 z-20"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gold/20 border border-gold/40 flex items-center justify-center text-gold shrink-0">
            <MailWarning size={15} />
          </div>
          <p className="text-xs sm:text-sm text-neutral-100 leading-snug">
            <strong className="text-gold font-bold">{t("title")}</strong>{" "}
            <span className="text-neutral-300">
              {t("sentTo")}{" "}
              <span className="font-semibold text-neutral-100">
                {user.email}
              </span>
              {t("restrictions")}
            </span>
          </p>
        </div>

        <ResendVerificationButton email={user.email} />
      </div>
    </aside>
  );
}
