"use client";

import {
  Briefcase,
  CheckCircle2,
  Circle,
  Compass,
  GraduationCap,
  Loader2,
  Sparkles,
  Star,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setFirstStepPreferencesAction } from "@/actions/ui";
import { createWorkspaceAction } from "@/actions/workspaceActions";
import { Input } from "@/components/ui/Input";
import { cn } from "@/utils";

type UsageMode = "personal" | "studies" | "work" | "all";

interface ModeOption {
  id: UsageMode;
  title: string;
  description: string;
  icon: typeof Sparkles;
  defaultWorkspace: string;
}

const USAGE_MODES: ModeOption[] = [
  {
    id: "personal",
    title: "Pessoal & Rotina",
    description: "Hábitos saudáveis, autocuidado e metas da sua rotina diária.",
    icon: Sparkles,
    defaultWorkspace: "Vida Pessoal",
  },
  {
    id: "studies",
    title: "Estudos & Formação",
    description: "Disciplinas, revisões, leituras e cursos acadêmicos.",
    icon: GraduationCap,
    defaultWorkspace: "Estudos",
  },
  {
    id: "work",
    title: "Trabalho & Projetos",
    description: "Demandas profissionais, entregas e metas de carreira.",
    icon: Briefcase,
    defaultWorkspace: "Trabalho",
  },
  {
    id: "all",
    title: "Geral & Equilíbrio",
    description: "Tudo em um só espaço integrado para o seu dia a dia.",
    icon: Compass,
    defaultWorkspace: "Meu Espaço",
  },
];

export default function FirstStepPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 1. Estado do Modo de Uso (obrigatório, pré-selecionado 'personal')
  const [selectedMode, setSelectedMode] = useState<UsageMode>("personal");

  // 2. Estado de Workspace (recomendado, por padrão ativo)
  const [wantWorkspace, setWantWorkspace] = useState(true);
  const [workspaceName, setWorkspaceName] = useState(
    USAGE_MODES[0].defaultWorkspace,
  );
  const [hasManuallyEditedName, setHasManuallyEditedName] = useState(false);

  // Troca de modo de uso e atualização automática da sugestão de nome
  const handleSelectMode = (mode: ModeOption) => {
    setSelectedMode(mode.id);
    if (!hasManuallyEditedName) {
      setWorkspaceName(mode.defaultWorkspace);
    }
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      let createdWorkspaceId: string | undefined;

      // 1. Se optou por criar a workspace recomendada
      if (wantWorkspace && workspaceName.trim()) {
        const result = await createWorkspaceAction({
          name: workspaceName.trim(),
        });

        if (result.success && result.data?.id) {
          createdWorkspaceId = result.data.id;
          toast.success("Ambiente criado com sucesso!");
        } else if (!result.success) {
          toast.error(
            result.error ||
              "Não foi possível criar o ambiente agora, mas você poderá criar no painel.",
          );
        }
      }

      // 2. Salvar preferências de modo de uso e workspace ativa no servidor
      await setFirstStepPreferencesAction(selectedMode, createdWorkspaceId);

      toast.success("Bem-vindo(a) ao HabitParty!");
      router.push("/dashboard");
    });
  };

  const handleSkipWorkspace = () => {
    setWantWorkspace(false);
    startTransition(async () => {
      await setFirstStepPreferencesAction(selectedMode);
      toast.success("Bem-vindo(a) ao HabitParty!");
      router.push("/dashboard");
    });
  };

  return (
    <main className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* Cabeçalho */}
      <header className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 self-start px-2.5 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-[11px] font-bold uppercase tracking-wider">
          <Star size={12} className="fill-gold" />
          Configuração Inicial
        </div>
        <h1 className="text-2xl font-bold text-neutral-50">
          Personalize sua Experiência
        </h1>
        <p className="text-base text-neutral-300">
          Vamos preparar o terreno para sua rotina. Escolha seu estilo e
          configure seu espaço.
        </p>
      </header>

      <form onSubmit={handleFinish} className="flex flex-col gap-6">
        {/* PASSO 1: Modo de Uso (Obrigatório) */}
        <section className="flex flex-col gap-3">
          <div className="flex flex-col">
            <h2 className="text-body-m font-bold text-neutral-50">
              1. Qual será o seu principal modo de uso?
            </h2>
            <p className="text-body-s text-neutral-400">
              Isso ajuda a calibrar sua experiência inicial na plataforma.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {USAGE_MODES.map((mode) => {
              const isSelected = selectedMode === mode.id;
              const Icon = mode.icon;

              return (
                <button
                  key={mode.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handleSelectMode(mode)}
                  disabled={isPending}
                  className={cn(
                    "flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer relative",
                    "outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
                    isSelected
                      ? "border-gold bg-primary-dark/60 shadow-[0_0_12px_rgba(237,229,57,0.18)] ring-1 ring-gold/40 text-neutral-50"
                      : "border-primary/30 bg-primary-dark/20 text-neutral-300 hover:border-primary/60 hover:bg-primary-dark/30 hover:text-neutral-100",
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <div
                      className={cn(
                        "p-1.5 rounded-lg",
                        isSelected
                          ? "bg-gold/20 text-gold"
                          : "bg-primary/20 text-neutral-300",
                      )}
                    >
                      <Icon size={18} />
                    </div>
                    {isSelected ? (
                      <CheckCircle2 size={18} className="text-gold" />
                    ) : (
                      <Circle size={18} className="text-neutral-500" />
                    )}
                  </div>
                  <span className="text-body-s font-bold">{mode.title}</span>
                  <span className="text-tiny text-neutral-400 mt-1 leading-relaxed">
                    {mode.description}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* PASSO 2: Workspace Recomendada */}
        <section className="flex flex-col gap-3 p-4 rounded-xl border border-primary/40 bg-primary-dark/25">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-body-m font-bold text-neutral-50 flex items-center gap-2">
              <span>2. Criar um Ambiente (Workspace)</span>
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/15 border border-gold/40 text-gold text-[10px] font-bold uppercase tracking-wider">
              ⭐ Recomendado
            </span>
          </div>

          <p className="text-body-s text-neutral-300">
            Ambientes mantêm suas listas, tarefas e hábitos organizados por
            contexto (ex: Trabalho vs Vida Pessoal). Embora seja altamente
            recomendado, você pode optar por criar depois.
          </p>

          {/* Opção: Deseja criar? */}
          <div className="flex flex-col gap-2 pt-1">
            <span className="text-xs text-neutral-300 font-medium">
              Deseja criar seu primeiro ambiente agora?
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setWantWorkspace(true)}
                disabled={isPending}
                className={cn(
                  "py-2 px-3 rounded-lg text-body-s font-medium border text-center transition-all cursor-pointer",
                  "outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
                  wantWorkspace
                    ? "border-gold bg-gold/15 text-neutral-50 font-bold shadow-sm"
                    : "border-primary/30 bg-primary-dark/20 text-neutral-400 hover:text-neutral-200 hover:bg-primary-dark/30",
                )}
              >
                Sim, criar agora
              </button>
              <button
                type="button"
                onClick={() => setWantWorkspace(false)}
                disabled={isPending}
                className={cn(
                  "py-2 px-3 rounded-lg text-body-s font-medium border text-center transition-all cursor-pointer",
                  "outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
                  !wantWorkspace
                    ? "border-primary-light bg-primary/20 text-neutral-50 font-bold"
                    : "border-primary/30 bg-primary-dark/20 text-neutral-400 hover:text-neutral-200 hover:bg-primary-dark/30",
                )}
              >
                Pular por enquanto
              </button>
            </div>
          </div>

          {/* Campo de nome do Workspace quando ativo */}
          {wantWorkspace && (
            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-primary/20 animate-in fade-in duration-200">
              <Input
                label="Nome do Ambiente"
                id="workspaceName"
                value={workspaceName}
                onChange={(e) => {
                  setWorkspaceName(e.target.value);
                  setHasManuallyEditedName(true);
                }}
                placeholder="Ex: Vida Pessoal, Faculdade, Trabalho..."
                required={wantWorkspace}
                disabled={isPending}
              />
              <p className="text-tiny text-neutral-400">
                Sugestão baseada no seu modo de uso. Você pode alterar esse nome
                a qualquer momento.
              </p>
            </div>
          )}
        </section>

        {/* Botão de Finalização */}
        <div className="flex flex-col gap-3 mt-1">
          <button
            type="submit"
            disabled={isPending || (wantWorkspace && !workspaceName.trim())}
            className="w-full py-3.5 rounded-lg border-2 border-gold/50 text-base text-neutral-50 font-bold bg-neutral-900/60 hover:bg-neutral-900/80 hover:border-gold hover:shadow-[0_0_15px_rgba(237,229,57,0.25)] transition-all cursor-pointer flex items-center justify-center gap-2 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending && <Loader2 size={18} className="animate-spin" />}
            {isPending
              ? "Configurando sua jornada..."
              : wantWorkspace
                ? "Criar Ambiente e Começar"
                : "Concluir e Começar"}
          </button>

          {wantWorkspace && (
            <button
              type="button"
              onClick={handleSkipWorkspace}
              disabled={isPending}
              className="text-xs text-neutral-400 hover:text-neutral-200 text-center transition-colors py-1 cursor-pointer outline-none focus:underline"
            >
              Pular criação de ambiente e ir direto ao painel
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
