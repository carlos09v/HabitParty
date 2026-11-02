import Image from "next/image";
import { cn } from "@/utils";

interface CosmicGalaxyIllustrationProps {
  alt?: string;
  priority?: boolean;
  className?: string;
}

export function CosmicGalaxyIllustration({
  alt = "",
  priority = false,
  className,
}: CosmicGalaxyIllustrationProps) {
  return (
    <>
      <Image
        src="/assets/Galaxia.svg"
        alt={alt}
        fill
        priority={priority}
        className={cn(
          "hidden dark:block object-contain object-top-right select-none",
          className,
        )}
      />
      <Image
        src="/assets/Galaxia-light.svg"
        alt={alt}
        fill
        priority={priority}
        className={cn(
          "block dark:hidden object-contain object-top-right select-none",
          className,
        )}
      />
    </>
  );
}
