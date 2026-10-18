import { Briefcase, Compass, GraduationCap, Sparkles } from "lucide-react";
import type { ModeOption } from "@/types/onboarding";

export const USAGE_MODES: readonly ModeOption[] = [
  {
    id: "personal",
    title: "Pessoal & Rotina",
    description: "Hábitos saudáveis, autocuidado e metas diárias.",
    icon: Sparkles,
    defaultWorkspace: "Vida Pessoal",
    chips: ["Vida Pessoal", "Saúde", "Rotina", "Hábitos"],
  },
  {
    id: "studies",
    title: "Estudos & Formação",
    description: "Disciplinas, revisões, leituras e cursos acadêmicos.",
    icon: GraduationCap,
    defaultWorkspace: "Estudos",
    chips: ["Estudos", "Faculdade", "Cursos", "Concursos"],
  },
  {
    id: "work",
    title: "Trabalho & Projetos",
    description: "Demandas profissionais, metas e entregas de carreira.",
    icon: Briefcase,
    defaultWorkspace: "Trabalho",
    chips: ["Trabalho", "Projetos", "Freelance", "Carreira"],
  },
  {
    id: "all",
    title: "Geral & Equilíbrio",
    description: "Tudo em um só espaço integrado para seu dia a dia.",
    icon: Compass,
    defaultWorkspace: "Meu Espaço",
    chips: ["Meu Espaço", "Geral", "Foco Diário", "Dia a Dia"],
  },
] as const;
