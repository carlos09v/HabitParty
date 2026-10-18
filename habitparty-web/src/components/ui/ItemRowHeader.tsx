import { cn } from "@/utils";

export interface ItemRowHeaderProps {
  isCompact?: boolean;
  mode?: "reward" | "inventory";
}

export function ItemRowHeader({
  isCompact = false,
  mode = "reward",
}: ItemRowHeaderProps) {
  return (
    <div
      className={cn(
        "hidden md:grid grid-cols-[minmax(0,3fr)_minmax(0,1.2fr)_minmax(0,1.8fr)_minmax(0,1.2fr)_auto] items-center text-xs font-semibold text-neutral-400 border-b border-white/10 select-none",
        isCompact ? "gap-3 px-3 py-1.5" : "gap-4 px-4 py-2",
      )}
      aria-hidden="true"
    >
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <div className="w-4 shrink-0" />
        <div className={cn("shrink-0", isCompact ? "w-8.5" : "w-10")} />
        {mode === "inventory" && (
          <div className={cn("shrink-0", isCompact ? "w-6" : "w-7")} />
        )}
        <span>{mode === "inventory" ? "Item" : "Produto"}</span>
      </div>
      <span>Tipo</span>
      <span>Pacote & Categoria</span>
      <span>Duração</span>
      <span className="text-right pr-2">
        {mode === "inventory" ? "Ação" : "Preço / Ação"}
      </span>
    </div>
  );
}
