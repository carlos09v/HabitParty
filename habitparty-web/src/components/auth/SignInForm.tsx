"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { signIn } from "@/actions/auth";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Input } from "@/components/ui/Input";

export function SignInForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await signIn(formData);

      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success("Login realizado com sucesso!");
        router.push("/dashboard");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <Input
        label="Email"
        id="email"
        name="email"
        type="email"
        placeholder="Insira seu email"
        required
        disabled={isPending}
      />

      <div className="flex flex-col gap-2">
        <Input
          label="Senha"
          id="password"
          name="password"
          type="password"
          placeholder="********"
          required
          disabled={isPending}
        />
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-xs text-neutral-400 hover:text-gold transition-colors focus:outline-none focus:underline"
          >
            Esqueceu a senha?
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-2">
        <AuthSubmitButton isPending={isPending} loadingText="Entrando...">
          Entrar
        </AuthSubmitButton>

        <GoogleSignInButton disabled={isPending} />
      </div>
    </form>
  );
}
