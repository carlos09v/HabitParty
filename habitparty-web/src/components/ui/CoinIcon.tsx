import { useId } from "react";
import { cn } from "@/utils";

export interface CoinIconProps {
  /** Tamanho em pixels (largura e altura) ou nome de variante pré-definida */
  size?: number | "xs" | "sm" | "md" | "lg";
  /** Classes adicionais para o container/svg */
  className?: string;
  /** Se deve exibir o brilho dourado sutil (glow) em volta */
  withGlow?: boolean;
}

const SIZE_MAP: Record<string, number> = {
  xs: 12,
  sm: 14,
  md: 18,
  lg: 22,
};

/**
 * Ícone vetorial estilizado e gamificado de moeda (HabitCoin) para o HabitParty.
 * Apresenta acabamento metálico com borda em relevo, anel interno e centelha de recompensa.
 */
export function CoinIcon({
  size = "sm",
  className,
  withGlow = false,
}: CoinIconProps) {
  const uniqueId = useId();
  const gradId = `coin-grad-${uniqueId.replace(/:/g, "")}`;
  const rimId = `coin-rim-${uniqueId.replace(/:/g, "")}`;
  const starId = `coin-star-${uniqueId.replace(/:/g, "")}`;

  const pixelSize = typeof size === "number" ? size : (SIZE_MAP[size] ?? 14);

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
