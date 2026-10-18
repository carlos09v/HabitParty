"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { toast } from "sonner";
import { signIn } from "@/actions/auth";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";

interface SignInFormProps {
  initialError?: string;
}

export function SignInForm({ initialError }: SignInFormProps = {}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (initialError) {
      toast.error(initialError);
    }
  }, [initialError]);

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
            className="text-xs text-neutral-400 hover:text-gold transition-colors outline-none focus:outline-none focus-visible:underline focus-visible:ring-2 focus-visible:ring-gold focus-visible:rounded px-1"
          >
            Esqueceu a senha?
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-2">
        <SubmitButton isPending={isPending} loadingText="Entrando...">
          Entrar
        </SubmitButton>

        <GoogleSignInButton disabled={isPending} />
      </div>
    </form>
  );
}
