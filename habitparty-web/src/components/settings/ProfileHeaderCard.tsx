"use client";

import { Camera, Crown, Shield, Sparkles, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type DragEvent,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import { updateUserProfilePhotoAction } from "@/actions/userActions";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useUserStore } from "@/store/userStore";
import type { ProfileHeaderCardProps } from "@/types/settings";
import { cn, formatCoins, getCurrentLevel } from "@/utils";

export function ProfileHeaderCard({
  initialUser,
  isCompact,
}: ProfileHeaderCardProps) {
  const router = useRouter();
  const storeUser = useUserStore((s) => s.user);
  const user = storeUser || initialUser;
  const updateUserPartial = useUserStore((s) => s.updateUserPartial);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem válido.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl((prev) => {
      if (prev?.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return objectUrl;
    });

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      const res = await updateUserProfilePhotoAction(formData);
      if (res.success) {
        toast.success("Foto de perfil atualizada com sucesso!");
        updateUserPartial({ profilePhotoUrl: objectUrl });
        router.refresh();
      } else {
        toast.error(res.error || "Erro ao atualizar foto.");
        URL.revokeObjectURL(objectUrl);
        setPreviewUrl(null);
      }
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    e.target.value = "";
  };

  const handleDragOver = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isPending) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (isPending) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const displayName = user?.fullName || user?.username || "Aventureiro";
  const displayPhoto = previewUrl || user?.profilePhotoUrl;
  const levelTitle =
    user?.currentLevelTitle ||
    getCurrentLevel(user?.totalXp ?? 0).title ||
    (user?.isPremium ? "Membro Premium" : "Novato");

  return (
    <div
      className={cn(
        "rounded-2xl border border-primary/20 bg-surface/30 backdrop-blur-md flex flex-col md:flex-row items-center md:items-start justify-between gap-6 md:gap-8 transition-all",
        isCompact ? "p-4 sm:p-5" : "p-6 sm:p-7",
      )}
    >
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 min-w-0 flex-1 w-full">
        {/* AVATAR COM OVERLAY ELEGANTE PARA UPLOAD (NÃO CORTA A MOLDURA) */}
        <div className="relative group shrink-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            disabled={isPending}
            className="relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-gold cursor-pointer transition-transform group-hover:scale-[1.02] block disabled:cursor-not-allowed"
            title="Clique ou solte uma imagem aqui para alterar sua foto de perfil"
            aria-label="Alterar foto de perfil"
          >
            <UserAvatar
              src={displayPhoto}
              name={displayName}
              size="xl"
              hasRing={Boolean(user?.isPremium)}
              className="shadow-xl"
            />

            {/* Overlay sutil de câmera no hover (dentro do círculo do avatar, não oculta nem corta a moldura animada externa) */}
            <div
              className={cn(
                "absolute inset-0 rounded-full bg-neutral-950/60 backdrop-blur-xs flex flex-col items-center justify-center text-white transition-opacity z-20",
                isDraggingOver || isPending
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100",
              )}
            >
              <Camera
                size={22}
                className={
                  isPending
                    ? "animate-spin text-gold"
                    : "text-neutral-100 drop-shadow-sm"
                }
              />
              <span className="text-[10px] font-bold mt-1 text-neutral-100 drop-shadow-sm">
                {isPending ? "Enviando..." : "Alterar"}
              </span>
            </div>
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
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-tiny font-bold bg-surface border border-primary/30 text-neutral-300 shadow-xs">
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
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface/60 border border-primary/20 text-xs text-neutral-200">
              <Sparkles size={14} className="text-gold" />
              <span>{levelTitle}</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface/60 border border-primary/20 text-xs text-neutral-200">
              <span className="text-gold font-bold">
                {formatCoins(user?.currentCoins ?? 0)}
              </span>
              <span>moedas</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface/60 border border-primary/20 text-xs text-neutral-200">
              <span className="text-magenta font-bold">
                {user?.totalXp ?? 0}
              </span>
              <span>XP acumulado</span>
            </div>
          </div>
        </div>
      </div>

      {/* DROPZONE INTERATIVA DE UPLOAD DE FOTO (ARRASTAR E SOLTAR OU CLICAR) */}
      <div className="shrink-0 w-full md:w-auto self-stretch md:self-center flex items-center justify-center">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          disabled={isPending}
          className={cn(
            "w-full md:w-56 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center group/drop select-none",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
            isCompact ? "p-3 gap-1" : "p-4 gap-1.5",
            isDraggingOver
              ? "border-gold bg-gold/15 text-gold shadow-glow-gold-xs scale-[1.01]"
              : "border-primary/35 bg-surface/40 hover:bg-surface/70 hover:border-gold/50 text-neutral-300 hover:text-neutral-100",
            isPending && "opacity-60 cursor-not-allowed",
          )}
        >
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
              isDraggingOver
                ? "bg-gold/25 text-gold"
                : "bg-primary-dark/40 text-gold group-hover/drop:bg-gold/20",
            )}
          >
            <UploadCloud
              size={18}
              className={isPending ? "animate-bounce" : ""}
            />
          </div>
          <span className="text-xs font-bold text-neutral-100 group-hover/drop:text-gold transition-colors">
            {isPending
              ? "Enviando foto..."
              : isDraggingOver
                ? "Solte a imagem aqui"
                : "Arraste uma foto aqui"}
          </span>
          <span className="text-[11px] text-neutral-400 leading-tight">
            ou <span className="text-gold underline">clique para anexar</span>{" "}
            (máx. 5MB)
          </span>
        </button>
      </div>
    </div>
  );
}
