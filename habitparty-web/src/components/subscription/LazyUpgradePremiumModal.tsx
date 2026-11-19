"use client";

import dynamic from "next/dynamic";

export const LazyUpgradePremiumModal = dynamic(
  () => import("./UpgradePremiumModal").then((mod) => mod.UpgradePremiumModal),
  { ssr: false },
);
