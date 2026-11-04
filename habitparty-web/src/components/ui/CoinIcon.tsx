"use client";

import { useId } from "react";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { cn } from "@/utils";

export interface CoinIconProps {
  /** Tamanho em pixels (largura e altura) ou nome de variante pré-definida */
  size?: number | "xs" | "sm" | "md" | "lg";
  /** Classes adicionais para o container/svg */
  className?: string;
  /** Se deve exibir o brilho sutil (glow) em volta */
  withGlow?: boolean;
  /** Variante visual: automática pelo modo de experiência, moeda (Aventura) ou crédito (Essencial) */
  variant?: "auto" | "coin" | "credit";
}

const SIZE_MAP: Record<string, number> = {
  xs: 12,
  sm: 14,
  md: 18,
  lg: 22,
};

/**
 * Ícone vetorial padronizado de Moeda (Modo Aventura) ou Crédito (Modo Essencial) para o HabitParty.
 * No Modo Aventura exibe a HabitCoin dourada; no Modo Essencial exibe um token geométrico executivo.
 */
export function CoinIcon({
  size = "sm",
  className,
  withGlow = false,
  variant = "auto",
}: CoinIconProps) {
  const { isProductivity } = useExperienceMode();
  const uniqueId = useId();
  const cleanId = uniqueId.replace(/:/g, "");
  const gradId = `coin-grad-${cleanId}`;
  const rimId = `coin-rim-${cleanId}`;
  const starId = `coin-star-${cleanId}`;

  const pixelSize = typeof size === "number" ? size : (SIZE_MAP[size] ?? 14);
  const resolvedVariant =
    variant === "auto" ? (isProductivity ? "credit" : "coin") : variant;

  if (resolvedVariant === "credit") {
    return (
      <svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(
          "shrink-0 inline-block align-middle select-none transition-transform",
          withGlow && "filter drop-shadow-[0_0_4px_rgba(56,189,248,0.45)]",
          className,
        )}
        role="img"
        aria-label="Crédito"
      >
        <defs>
          <linearGradient
            id={gradId}
            x1="3"
            y1="3"
            x2="21"
            y2="21"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="45%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>
          <linearGradient
            id={rimId}
            x1="21"
            y1="3"
            x2="3"
            y2="21"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#BAE6FD" />
            <stop offset="50%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0369A1" />
          </linearGradient>
          <linearGradient
            id={starId}
            x1="8"
            y1="8"
            x2="16"
            y2="16"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#E0F2FE" />
            <stop offset="100%" stopColor="#7DD3FC" />
          </linearGradient>
        </defs>

        {/* 1. Moldura Octogonal/Hexagonal Executiva de Crédito */}
        <path
          d="M8.2 2.5H15.8L21.5 8.2V15.8L15.8 21.5H8.2L2.5 15.8V8.2L8.2 2.5Z"
          fill={`url(#${rimId})`}
        />

        {/* 2. Face Interna Facetada */}
        <path
          d="M8.8 4H15.2L20 8.8V15.2L15.2 20H8.8L4 15.2V8.8L8.8 4Z"
          fill={`url(#${gradId})`}
        />

        {/* 3. Circuito / Anel Interno Geométrico */}
        <rect
          x="6.5"
          y="6.5"
          width="11"
          height="11"
          rx="2.5"
          stroke="#BAE6FD"
          strokeOpacity="0.45"
          strokeWidth="0.8"
          fill="none"
        />

        {/* 4. Núcleo de Crédito (Losango Duplo de Valor) */}
        <path
          d="M12 7.2L16.2 12L12 16.8L7.8 12L12 7.2Z"
          fill={`url(#${starId})`}
        />
        <circle cx="12" cy="12" r="1.4" fill="#0284C7" />
      </svg>
    );
  }

  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "shrink-0 inline-block align-middle select-none transition-transform",
        withGlow && "filter drop-shadow-[0_0_4px_rgba(234,168,8,0.45)]",
        className,
      )}
      role="img"
      aria-label="Moeda"
    >
      <defs>
        {/* Gradiente da Face da Moeda */}
        <linearGradient
          id={gradId}
          x1="2"
          y1="2"
          x2="22"
          y2="22"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="35%" stopColor="#EAB308" />
          <stop offset="70%" stopColor="#CA8A04" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>

        {/* Gradiente da Borda / Aro Chanfrado */}
        <linearGradient
          id={rimId}
          x1="22"
          y1="2"
          x2="2"
          y2="22"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="50%" stopColor="#B45309" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>

        {/* Gradiente da Centelha/Estrela Central */}
        <linearGradient
          id={starId}
          x1="8"
          y1="8"
          x2="16"
          y2="16"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="45%" stopColor="#FEF9C3" />
          <stop offset="100%" stopColor="#FDE047" />
        </linearGradient>
      </defs>

      {/* 1. Borda Externa Chanfrada */}
      <circle cx="12" cy="12" r="10" fill={`url(#${rimId})`} />

      {/* 2. Face Interna Metálica */}
      <circle cx="12" cy="12" r="8.75" fill={`url(#${gradId})`} />

      {/* 3. Ranhura / Anel Interno de Cunhagem */}
      <circle
        cx="12"
        cy="12"
        r="7.2"
        stroke="#FEF08A"
        strokeOpacity="0.45"
        strokeWidth="0.8"
        strokeDasharray="1.5 1"
        fill="none"
      />

      {/* 4. Emblema Central: Centelha / Estrela de Recompensa de 4 pontas */}
      <path
        d="M12 6.5C12 8.7 12.8 9.5 15 9.5C12.8 9.5 12 10.3 12 12.5C12 10.3 11.2 9.5 9 9.5C11.2 9.5 12 8.7 12 6.5Z"
        fill={`url(#${starId})`}
        transform="translate(0, 2.5)"
      />

      {/* 5. Ponto de Luz / Brilho Especular Superior */}
      <ellipse
        cx="8.5"
        cy="6"
        rx="2.2"
        ry="1"
        transform="rotate(-25 8.5 6)"
        fill="#FFFFFF"
        fillOpacity="0.55"
      />
    </svg>
  );
}
