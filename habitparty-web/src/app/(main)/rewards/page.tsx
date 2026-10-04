import { RewardsContainer } from "@/components/reward/RewardsContainer";
import { WelcomeCard } from "@/components/ui/WelcomeCard";

export default function RewardsPage() {
  return (
    <div className="flex-1 min-w-0 h-screen flex flex-col p-6 gap-6 overflow-y-auto overflow-x-hidden custom-scrollbar">
      {/* Banner de Boas-vindas (Figma: Saudação #315:850) */}
      <WelcomeCard
        compact
        title="Colete sua recompensa!"
        subtitle="Gerencie sua Vitrine e troque suas moedas."
        bullets={[
          "Escolha entre itens de Uso Único ou Cupom!",
          "Gerencie sua Vitrine com produtos de sua escolha.",
          "Todo produto comprado irá para a Mochila.",
        ]}
        imageSrc="/assets/undraw/reward/undraw_gift-card_sfy8 1.svg"
        imageWidth={162}
        imageHeight={87}
        className="p-3.5 max-w-2xl rounded-xl border border-primary/35 bg-primary-dark/25 shrink-0"
      />

      {/* Seção Principal de Recompensas: Filtros, CardView / ListView e Cards */}
      <RewardsContainer />
    </div>
  );
}
