import { cn } from "@/utils";

interface CosmicGalaxyIllustrationProps {
  className?: string;
}

/**
 * Ilustração decorativa de galáxia renderizada via background-image CSS.
 * Garante que apenas o SVG do tema ativo seja baixado e evita downloads
 * desperdiçados quando o container pai está oculto em telas menores (`hidden lg:flex`).
 */
export function CosmicGalaxyIllustration({
  className,
}: CosmicGalaxyIllustrationProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "w-full h-full bg-contain bg-no-repeat bg-right-top select-none pointer-events-none",
        "bg-[url('/assets/Galaxia-light.svg')] dark:bg-[url('/assets/Galaxia.svg')]",
        className,
      )}
    />
  );
}
