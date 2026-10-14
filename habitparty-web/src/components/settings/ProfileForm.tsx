"use client";

import { Calendar, Save, User as UserIcon } from "lucide-react";
import { type FormEvent, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { updateUserProfileAction } from "@/actions/userActions";
import { Input } from "@/components/ui/Input";
import { GENDER_OPTIONS } from "@/constants/settings";
import { useUserStore } from "@/store/userStore";
import type { GenderType, ProfileFormProps, UpdateUserDTO } from "@/types/user";
import { cn } from "@/utils";

export function ProfileForm({ initialUser, isCompact }: ProfileFormProps) {
  const storeUser = useUserStore((s) => s.user);
  const user = storeUser || initialUser;
  const updateUserPartial = useUserStore((s) => s.updateUserPartial);

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [birthday, setBirthday] = useState(user?.birthday || "");
  const [gender, setGender] = useState<GenderType>(user?.gender || undefined);

  const [isPending, startTransition] = useTransition();

  // Sincroniza o formulário sempre que o usuário do store/prop atualizar
  useEffect(() => {
    if (user) {
      if (user.fullName !== undefined) setFullName(user.fullName);
      if (user.birthday !== undefined) setBirthday(user.birthday || "");
      if (user.gender !== undefined) setGender(user.gender);
    }
  }, [user]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error("O nome completo não pode ficar em branco.");
      return;
    }

    if (fullName.length > 30) {
      toast.error("O nome deve ter no máximo 30 caracteres.");
      return;
    }

    const payload: UpdateUserDTO = {
      fullName: fullName.trim(),
      ...(birthday ? { birthday } : {}),
      ...(gender ? { gender } : {}),
    };

    startTransition(async () => {
      const res = await updateUserProfileAction(payload);
      if (res.success) {
        toast.success("Perfil atualizado com sucesso!");
        if (res.data) {
          updateUserPartial(res.data);
        } else {
          updateUserPartial({
            fullName: payload.fullName,
            birthday: payload.birthday,
            gender: payload.gender,
          });
        }
      } else {
        toast.error(res.error || "Erro ao salvar perfil.");
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "rounded-2xl border border-primary/25 bg-surface/30 backdrop-blur-md flex flex-col gap-5 transition-all",
        isCompact ? "p-4 sm:p-5" : "p-6",
      )}
    >
      <div className="flex flex-col gap-1 border-b border-white/10 pb-4">
        <h3 className="text-body-l font-bold text-neutral-50 flex items-center gap-2">
          <UserIcon size={18} className="text-gold" />
          Dados Pessoais
        </h3>
        <p className="text-body-s text-neutral-400">
          Atualize seus dados públicos e identificação no HabitParty.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* NOME COMPLETO */}
        <div className="md:col-span-2">
          <Input
            id="fullName"
            label="Nome Completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Seu nome completo"
            maxLength={30}
            compact={isCompact}
            icon={<UserIcon size={18} />}
            required
          />
          <span className="text-tiny text-neutral-400 mt-1 block text-right">
            {fullName.length}/30 caracteres
          </span>
        </div>

        {/* DATA DE NASCIMENTO */}
        <div>
          <Input
            id="birthday"
            type="date"
            label="Data de Nascimento"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            compact={isCompact}
            icon={<Calendar size={18} />}
          />
        </div>

        {/* GÊNERO */}
        <div className="flex flex-col gap-2 w-full">
          <label
            htmlFor="gender"
            className={cn(
              "text-neutral-100",
              isCompact ? "text-xs" : "text-body-s",
            )}
          >
            Gênero
          </label>
          <div className="relative">
            <select
              id="gender"
              value={gender || ""}
              onChange={(e) =>
                setGender((e.target.value || undefined) as GenderType)
              }
              className={cn(
                "w-full rounded-lg text-neutral-50 outline-none transition-all cursor-pointer",
                isCompact ? "py-2 px-3 text-xs" : "py-3 px-4 text-body-m",
                "bg-primary-dark/20 border border-primary/30",
                "focus:border-primary-light focus:bg-primary-dark/30 focus:shadow-[0_0_8px_rgba(168,99,255,0.3)]",
              )}
            >
              <option value="" className="bg-popover text-neutral-300">
                Selecione o gênero (opcional)
              </option>
              {GENDER_OPTIONS.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="bg-popover text-neutral-100"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md",
            "bg-gold text-neutral-900 hover:bg-gold-hover active:bg-gold-pressed",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            isCompact ? "px-4 py-2 text-xs" : "px-6 py-2.5 text-sm",
          )}
        >
          {isPending ? (
            "Salvando..."
          ) : (
            <>
              <Save size={16} />
              Salvar Alterações
            </>
          )}
        </button>
      </div>
    </form>
  );
}
