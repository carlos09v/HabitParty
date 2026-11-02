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
  priority = false,
  className,
}: BrandLogoProps) {
  return (
    <>
      <Image
        src="/assets/logo.png"
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={cn("hidden dark:block object-contain", className)}
      />
      <Image
        src="/assets/logo-light.png"
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={cn("block dark:hidden object-contain", className)}
      />
    </>
  );
}
