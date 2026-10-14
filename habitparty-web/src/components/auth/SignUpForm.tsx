"use client";

import { Calendar, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { signUpAction } from "@/actions/auth";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { GENDER_OPTIONS } from "@/constants/settings";
import type { CreateUserDTO, GenderType } from "@/types/user";

export function SignUpForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [gender, setGender] = useState<string>("PREFER_NOT_TO_SAY");
  const [emailValue, setEmailValue] = useState("");
  const [usernameValue, setUsernameValue] = useState("");
  const [hasManuallyEditedUsername, setHasManuallyEditedUsername] =
    useState(false);

  // Sugere um username baseado no email quando o usuário ainda não digitou manualmente
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setEmailValue(email);

    if (!hasManuallyEditedUsername) {
      const derived = email
        .split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "");
      setUsernameValue(derived);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const fullName = formData.get("fullName")?.toString().trim() || "";
    const email = formData.get("email")?.toString().trim() || "";
    const username = (
      formData.get("username")?.toString().trim() || email.split("@")[0]
    ).toLowerCase();
    const password = formData.get("password")?.toString() || "";
    const birthday = formData.get("birthday")?.toString() || "";
    const selectedGender = (gender || "PREFER_NOT_TO_SAY") as GenderType;

    if (password.length < 8) {
      toast.error("A senha deve ter no mínimo 8 caracteres.");
      return;
    }

    const payload: CreateUserDTO = {
      fullName,
      username,
      email,
      password,
      birthday,
      gender: selectedGender || "PREFER_NOT_TO_SAY",
    };

    startTransition(async () => {
      const result = await signUpAction(payload);

      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success("Conta criada com sucesso! Vamos ao primeiro passo.");
        router.push("/firstStep");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <Input
        label="Nome Completo"
        id="fullName"
        name="fullName"
        type="text"
        placeholder="Insira seu nome completo"
        required
        disabled={isPending}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Email"
          id="email"
          name="email"
          type="email"
          value={emailValue}
          onChange={handleEmailChange}
          placeholder="seu@email.com"
          required
          disabled={isPending}
        />

        <Input
          label="Nome de Usuário"
          id="username"
          name="username"
          type="text"
          value={usernameValue}
          onChange={(e) => {
            setUsernameValue(e.target.value);
            setHasManuallyEditedUsername(true);
          }}
          placeholder="ex: aventureiro_01"
          icon={<User size={18} aria-hidden="true" />}
          required
          disabled={isPending}
        />
      </div>

      <Input
        label="Senha"
        id="password"
        name="password"
        type="password"
        placeholder="Mínimo de 8 caracteres"
        required
        disabled={isPending}
      />

      <div className="flex flex-col sm:flex-row gap-4 w-full items-start">
        {/* Data de Nascimento */}
        <div className="flex-1 w-full sm:w-auto min-w-0">
          <Input
            label="Data de Nascimento"
            id="dob"
            name="birthday"
            type="date"
            placeholder="DD / MM / YYYY"
            icon={<Calendar size={18} aria-hidden="true" />}
            required
            disabled={isPending}
          />
        </div>

        {/* Gênero */}
        <div className="flex-1 w-full sm:w-auto min-w-0">
          <Select
            label="Gênero"
            placeholder="Selecione o gênero"
            options={GENDER_OPTIONS}
            value={gender}
            onChange={setGender}
            name="gender"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="mt-2">
        <AuthSubmitButton isPending={isPending} loadingText="Cadastrando...">
          Cadastrar
        </AuthSubmitButton>
      </div>
    </form>
  );
}
