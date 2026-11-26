import Image from "next/image";
import { cn } from "@/utils";

interface BrandLogoProps {
  width?: number;
  height?: number;
  alt?: string;
  priority?: boolean;
  className?: string;
}

export function BrandLogo({
  width = 160,
  height = 36,
  alt = "HabitParty",
  className,
}: BrandLogoProps) {
  const sizes = `${width}px`;

  // `loading="lazy"` em ambas as variantes evita que o navegador baixe o PNG oculto
  // (`display: none` / `hidden`), carregando apenas o logo do tema ativo e mantendo
  // elementos `<img>` reais compatíveis com Forced Colors Mode e impressão.
  return (
    <>
      <Image
        src="/assets/logo.png"
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        loading="lazy"
        decoding="async"
        className={cn("hidden dark:block object-contain", className)}
      />
      <Image
        src="/assets/logo-light.png"
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        loading="lazy"
        decoding="async"
        className={cn("block dark:hidden object-contain", className)}
      />
    </>
  );
}
