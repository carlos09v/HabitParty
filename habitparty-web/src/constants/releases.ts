export type AppReleaseHelpId =
  | "v14"
  | "v13"
  | "v12"
  | "v11"
  | "v15"
  | "v16"
  | "v20";

export type AppReleaseLandingId =
  | "r11"
  | "r12"
  | "r13"
  | "r14"
  | "r15"
  | "r16"
  | "r20";

export type AppReleaseStatus = "completed" | "next" | "planned" | "epic";

export interface AppReleaseEntry {
  helpId: AppReleaseHelpId;
  landingId: AppReleaseLandingId;
  version: string;
  status: AppReleaseStatus;
  isReleased: boolean;
  isCurrent?: boolean;
  hasLandingExtras?: boolean;
}

/**
 * Fonte única de verdade para o histórico de versões lançadas e marcos futuros
 * compartilhada entre a Central de Ajuda (`/help`) e a Landing Page (`/[locale]`).
 */
export const APP_RELEASES: readonly AppReleaseEntry[] = [
  {
    helpId: "v11",
    landingId: "r11",
    version: "v1.1",
    status: "completed",
    isReleased: true,
    hasLandingExtras: true,
  },
  {
    helpId: "v12",
    landingId: "r12",
    version: "v1.2",
    status: "completed",
    isReleased: true,
  },
  {
    helpId: "v13",
    landingId: "r13",
    version: "v1.3",
    status: "completed",
    isReleased: true,
    hasLandingExtras: true,
  },
  {
    helpId: "v14",
    landingId: "r14",
    version: "v1.4",
    status: "completed",
    isReleased: true,
    isCurrent: true,
    hasLandingExtras: true,
  },
  {
    helpId: "v15",
    landingId: "r15",
    version: "v1.5",
    status: "next",
    isReleased: false,
  },
  {
    helpId: "v16",
    landingId: "r16",
    version: "v1.6",
    status: "planned",
    isReleased: false,
  },
  {
    helpId: "v20",
    landingId: "r20",
    version: "v2.0+",
    status: "epic",
    isReleased: false,
  },
] as const;

export const RELEASED_APP_VERSIONS_DESC: readonly AppReleaseEntry[] = [
  ...APP_RELEASES.filter((release) => release.isReleased),
].reverse();

export const UPCOMING_APP_VERSIONS: readonly AppReleaseEntry[] =
  APP_RELEASES.filter((release) => !release.isReleased);
