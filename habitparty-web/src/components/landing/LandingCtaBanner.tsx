import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function LandingCtaBanner() {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="relative rounded-3xl p-8 sm:p-12 md:p-16 text-center bg-gradient-to-b from-surface/90 to-background/90 border border-primary-light/40 shadow-[0_0_50px_rgba(124,58,237,0.3)] overflow-hidden">
          {/* Orbes internos */}
          <div className="cosmic-orb absolute -top-24 left-1/2 -translate-x-1/2 w-[400px] h-[300px] rounded-full bg-gold/20 blur-[150px] pointer-events-none" />
          <div className="cosmic-orb absolute -bottom-24 right-10 w-[300px] h-[300px] rounded-full bg-magenta/25 blur-[160px] pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-bold uppercase tracking-wider mb-6">
              <Sparkles className="w-4 h-4 fill-gold text-gold" />
              Sua Jornada Começa Agora
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-neutral-50 tracking-tight leading-tight mb-6">
              Pronto para gamificar sua produtividade?
            </h2>

            <p className="text-base sm:text-lg text-neutral-300 mb-8 leading-relaxed">
              Junte-se ao HabitParty gratuitamente. Crie seu primeiro hábito,
              suba de nível e sinta a satisfação real de cada conquista.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signUp"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gold hover:bg-gold-hover text-neutral-900 font-extrabold text-base shadow-glow-gold hover:shadow-[0_0_30px_rgba(237,229,57,0.6)] transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <span>Criar Conta Gratuita</span>
                <ArrowRight className="w-5 h-5 text-neutral-900" />
              </Link>
              <Link
                href="/signIn"
                className="w-full sm:w-auto px-6 py-4 rounded-xl bg-card hover:bg-surface text-neutral-100 hover:text-neutral-50 font-semibold text-base border border-neutral-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-neutral-200 dark:hover:text-white dark:border-white/10 transition-colors"
              >
                Já tenho uma conta
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
