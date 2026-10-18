"use client";

import { Save, User as UserIcon } from "lucide-react";
import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import { updateUserProfileAction } from "@/actions/userActions";
import { DatePicker } from "@/components/ui/DatePicker";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { GENDER_OPTIONS } from "@/constants/settings";
import { useUserStore } from "@/store/userStore";
import type { GenderType, ProfileFormProps } from "@/types/settings";
import type { UpdateUserDTO } from "@/types/user";
import { cn } from "@/utils";
import { validateBirthDate } from "@/utils/validators";

import { SettingsCard } from "./SettingsCard";

export function ProfileForm({ initialUser, isCompact }: ProfileFormProps) {
  const storeUser = useUserStore((s) => s.user);
  const user = storeUser || initialUser;
  const updateUserPartial = useUserStore((s) => s.updateUserPartial);

  const maxBirthDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 12);
    return d.toISOString().split("T")[0];
  }, []);

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [birthday, setBirthday] = useState(user?.birthday || "");
  const [gender, setGender] = useState<GenderType | undefined>(user?.gender);

  const [isPending, startTransition] = useTransition();

  // Sincroniza o formulário sempre que o usuário do store/prop atualizar
  useEffect(() => {
    if (user) {
      if (user.fullName !== undefined) setFullName(user.fullName);
      if (user.birthday !== undefined) setBirthday(user.birthday || "");
      if (user.gender !== undefined) setGender(user.gender);
    }
  }, [user]);

  // Detecta se houve qualquer alteração real nos campos em relação aos dados atuais do usuário
  const hasChanges = useMemo(() => {
    const currentFullName = fullName.trim();
    const currentBirthday = birthday || "";
    const currentGender = (gender as string) || "";

    const originalFullName = (user?.fullName || "").trim();
    const originalBirthday = user?.birthday || "";
    const originalGender = (user?.gender as string) || "";

    return (
      currentFullName !== originalFullName ||
      currentBirthday !== originalBirthday ||
      currentGender !== originalGender
    );
  }, [fullName, birthday, gender, user]);

  const canSubmit =
    hasChanges && fullName.trim().length > 0 && fullName.trim().length <= 30;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!hasChanges) {
      toast.info("Nenhuma alteração foi realizada.");
      return;
    }

    if (!fullName.trim()) {
      toast.error("O nome completo não pode ficar em branco.");
      return;
    }

    if (fullName.length > 30) {
      toast.error("O nome deve ter no máximo 30 caracteres.");
      return;
    }

    if (birthday) {
      const birthDateValidation = validateBirthDate(birthday);
      if (!birthDateValidation.isValid) {
        toast.error(birthDateValidation.error);
        return;
      }
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
    <SettingsCard
      title="Dados Pessoais"
      description="Atualize seus dados públicos e identificação no HabitParty."
      icon={<UserIcon size={18} className="text-gold" />}
      isCompact={isCompact}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
            <DatePicker
              id="birthday"
              label="Data de Nascimento"
              value={birthday}
              onChange={setBirthday}
              compact={isCompact}
              placeholder="Selecione sua data de nascimento"
              maxDate={maxBirthDate}
            />
          </div>

          {/* GÊNERO COM SELECT PADRONIZADO DO DESIGN SYSTEM */}
          <div>
            <Select
              id="gender"
              label="Gênero"
              placeholder="Selecione o gênero (opcional)"
              value={gender || ""}
              compact={isCompact}
              options={GENDER_OPTIONS}
              onChange={(val) => setGender((val || undefined) as GenderType)}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-primary/20">
          <button
            type="submit"
            disabled={isPending || !canSubmit}
            className={cn(
              "rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md",
              "bg-gold text-neutral-900 hover:bg-gold-hover active:bg-gold-pressed",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              isCompact ? "px-4 py-2 text-xs" : "px-6 py-2.5 text-sm",
            )}
            title={
              !hasChanges
                ? "Nenhuma alteração para salvar"
                : "Salvar Alterações"
            }
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
    </SettingsCard>
  );
}
