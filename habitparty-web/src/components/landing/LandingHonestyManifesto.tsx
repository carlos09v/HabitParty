import { ShieldCheck, Sparkles } from "lucide-react";

export function LandingHonestyManifesto() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* Glow cósmico sutil */}
      <div className="cosmic-orb absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-gold/15 blur-[180px] pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl p-8 sm:p-12 md:p-14 bg-card/90 dark:bg-surface/85 border border-gold/40 shadow-sm dark:shadow-[0_0_40px_rgba(237,229,57,0.15)] backdrop-blur-xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-bold uppercase tracking-wider mb-6">
            <ShieldCheck className="w-4 h-4 text-gold" />
            <span>O Pacto da Honestidade</span>
          </div>

          {/* Frase Central em Destaque */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-50 tracking-tight leading-snug max-w-3xl mx-auto mb-6">
            “Trapacear nas suas tarefas é enganar a si mesmo:{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-amber-600 to-gold dark:from-gold dark:via-yellow-200 dark:to-gold">
              aqui, cada moeda e cada nível valem o peso da sua sinceridade.
            </span>
            ”
          </h2>

          {/* Manifesto / Explicação */}
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-neutral-300 leading-relaxed mb-8">
            A loja de recompensas é você quem abastece. O ouro é conquistado com
            o seu próprio suor e os prêmios são desfrutados por você na vida
            real. No HabitParty, você não joga contra um algoritmo — joga pelo
            seu próprio futuro. Marcar uma tarefa que não fez só sabota quem
            você quer se tornar.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-6 border-t border-neutral-700 dark:border-white/10 text-xs font-semibold text-neutral-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold shrink-0" />
              <span>Sem trapaças contra você mesmo</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold shrink-0" />
              <span>Recompensas merecidas de verdade</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold shrink-0" />
              <span>Dopamina limpa e sem culpa</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
