import { MonitorSmartphone } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { CompactModeSettings } from "@/components/settings/CompactModeSettings";
import { cn } from "@/utils";
import { getCompactMode } from "@/utils/cookies";

export default async function SettingsPage() {
  const isCompact = await getCompactMode();

  return (
    <PageWrapper isCompact={isCompact}>
      <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-10">
        {/* HEADER */}
        <header className="flex items-end justify-between border-b border-primary/20 pb-4">
          <div>
            <h1 className="text-display-s font-bold text-neutral-50 drop-shadow-md">
              Configurações
            </h1>
            <p className="text-body-m text-neutral-300 mt-1">
              Personalize a sua experiência e interface no HabitParty.
            </p>
          </div>
        </header>

        {/* SEÇÃO: USABILIDADE E INTERFACE */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <MonitorSmartphone className="text-gold" size={24} />
            <h2 className="text-heading-m font-bold text-neutral-100">
              Usabilidade & Interface
            </h2>
          </div>

          <div
            className={cn(
              "bg-surface/30 border border-primary/20 rounded-2xl flex flex-col gap-5",
              isCompact ? "p-4 sm:p-5" : "p-6",
            )}
          >
            <div className="flex flex-col gap-1.5">
              <h3 className="text-body-l font-bold text-neutral-50">
                Densidade da Interface
              </h3>
              <p className="text-body-s text-neutral-400">
                Personalize o espaçamento e o tamanho visual dos cartões, listas
                e calendários.
              </p>
            </div>

            <CompactModeSettings />
          </div>
        </section>
      </div>
    </PageWrapper>
  );
}
