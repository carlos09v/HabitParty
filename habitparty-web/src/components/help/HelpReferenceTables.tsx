import { BookOpen, Coins, Flame, Sparkles, Trophy } from "lucide-react";
import { HelpReferenceTable } from "@/components/help/HelpReferenceTable";
import { HELP_TABLES } from "@/constants/help";

export function HelpReferenceTables() {
  return (
    <section className="flex flex-col gap-6 pt-6 border-t border-primary/20">
      <div className="flex items-center gap-2">
        <BookOpen className="text-gold" size={20} />
        <h2 className="text-body-l sm:text-subtitle-s font-bold text-neutral-100">
          Tabelas de Referência & Economia Matemática
        </h2>
      </div>

      {/* 1. Dificuldades */}
      <HelpReferenceTable
        entry={HELP_TABLES.difficulties}
        icon={<Coins className="text-gold" size={18} />}
        highlightColumnIndex={2}
        highlightColorClass="text-gold"
      />

      {/* 2. Decaimento de Hábitos */}
      <HelpReferenceTable
        entry={HELP_TABLES.habitDecay}
        icon={<Flame className="text-warning-500" size={18} />}
        highlightColumnIndex={2}
        highlightColorClass="text-gold"
      />

      {/* 3. Caixas Misteriosas */}
      <HelpReferenceTable
        entry={HELP_TABLES.mysteryBoxes}
        icon={<Sparkles className="text-magenta" size={18} />}
        highlightColumnIndex={1}
        highlightColorClass="text-gold"
      />

      {/* 4. Níveis de Usuário */}
      <HelpReferenceTable
        entry={HELP_TABLES.userLevels}
        icon={<Trophy className="text-gold" size={18} />}
        highlightColumnIndex={1}
        highlightColorClass="text-magenta"
      />
    </section>
  );
}
