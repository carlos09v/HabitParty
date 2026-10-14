"use client";

import { Camera, Crown, Shield, Sparkles } from "lucide-react";
import { type ChangeEvent, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { updateUserProfilePhotoAction } from "@/actions/userActions";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useUserStore } from "@/store/userStore";
import type { ProfileHeaderCardProps } from "@/types/user";
import { cn } from "@/utils";

export function ProfileHeaderCard({
  initialUser,
  isCompact,
}: ProfileHeaderCardProps) {
  const storeUser = useUserStore((s) => s.user);
  const user = storeUser || initialUser;
  const updateUserPartial = useUserStore((s) => s.updateUserPartial);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem válido.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      const res = await updateUserProfilePhotoAction(formData);
      if (res.success) {
        toast.success("Foto de perfil atualizada com sucesso!");
        updateUserPartial({ profilePhotoUrl: objectUrl });
      } else {
        toast.error(res.error || "Erro ao atualizar foto.");
        setPreviewUrl(null);
      }
    });
  };

  const displayName = user?.fullName || user?.username || "Aventureiro";
  const displayPhoto = previewUrl || user?.profilePhotoUrl;
  const levelTitle =
    user?.currentLevelTitle || (user?.isPremium ? "Membro Premium" : "Novato");

  return (
    <div
      className={cn(
        "rounded-2xl border border-primary/25 bg-surface/30 backdrop-blur-md flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 sm:gap-8 transition-all",
        isCompact ? "p-4 sm:p-5" : "p-6 sm:p-7",
      )}
    >
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 min-w-0 flex-1">
        {/* AVATAR + BOTÃO DE UPLOAD */}
        <div className="relative group shrink-0">
          <UserAvatar
            src={displayPhoto}
            name={displayName}
            size="xl"
            hasRing={Boolean(user?.isPremium)}
            className="ring-4 ring-primary/40 shadow-xl"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
            className={cn(
              "absolute bottom-0 right-0 p-2 rounded-full bg-gold text-neutral-900 border-2 border-background shadow-lg transition-transform cursor-pointer",
              "hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
            )}
            title="Alterar foto de perfil"
            aria-label="Alterar foto de perfil"
          >
            <Camera size={16} className={isPending ? "animate-spin" : ""} />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            tabIndex={-1}
            onChange={handleFileChange}
          />
        </div>

        {/* INFORMAÇÕES DE TEXTO E STATUS */}
        <div className="flex flex-col items-center sm:items-start gap-2 text-center sm:text-left min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-50 truncate">
              {displayName}
            </h2>

            {user?.isPremium ? (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-tiny font-bold bg-gold/20 text-gold border border-gold/40 shadow-xs">
                <Crown size={12} className="stroke-2" />
                PREMIUM
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-tiny font-bold bg-white/10 text-neutral-300 border border-white/15 shadow-xs">
                <Sparkles size={12} className="text-neutral-400" />
                GRATUITO
              </span>
            )}

            {user?.role === "ADMIN" && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-tiny font-bold bg-magenta/20 text-magenta border border-magenta/40">
                <Shield size={12} />
                ADMIN
              </span>
            )}
          </div>

          {user?.username && (
            <p className="text-body-s text-neutral-300 font-medium">
              @{user.username}
            </p>
          )}

          {user?.email && (
            <p className="text-tiny text-neutral-400">{user.email}</p>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap justify-center sm:justify-start">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-neutral-200">
              <Sparkles size={14} className="text-gold" />
              <span>{levelTitle}</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-neutral-200">
              <span className="text-gold font-bold">
                {user?.currentCoins ?? 0}
              </span>
              <span>moedas</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-neutral-200">
              <span className="text-magenta font-bold">
                {user?.totalXp ?? 0}
              </span>
              <span>XP acumulado</span>
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 self-center sm:self-start sm:ml-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending}
          className={cn(
            "rounded-xl border border-white/15 bg-surface/50 text-neutral-200 hover:text-neutral-50 hover:border-gold/50 transition-all font-semibold cursor-pointer",
            isCompact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
          )}
        >
          {isPending ? "Enviando..." : "Alterar foto"}
        </button>
      </div>
    </div>
  );
}
