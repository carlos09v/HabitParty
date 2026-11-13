import type { AbstractIntlMessages } from "next-intl";
import type { AppLocale } from "./config";

/**
 * Escopos de tradução disponíveis para serialização no cliente via `ScopedIntlProvider`.
 *
 * - `base`: dicionário mínimo montado no root layout (`CookieConsentBanner`, `LanguageToggleBtn`, `ThemeToggleBtn`).
 * - `public`: Landing Page (`/`), contendo apenas as subchaves utilizadas pelos Client Components da landing.
 * - `auth`: telas de autenticação (`/signIn`, `/signUp`, `/forgot-password`, `/reset-password`, `/verify-email`).
 * - `onboarding`: fluxo inicial (`/firstStep`).
 * - `main`: shell da área logada (Sidebar, MobileHeader, WorkspaceSwitcher, Notifications, FocusWidget, Error boundary).
 * - `dashboard`, `tasks`, `focus`, `rewards`, `inventory`, `history`, `help`, `admin`, `settings`:
 *   escopos granulares de cada página da área logada (incluem automaticamente `main` + `base`).
 */
export type MessageScope =
  | "base"
  | "public"
  | "auth"
  | "onboarding"
  | "main"
  | "dashboard"
  | "tasks"
  | "focus"
  | "rewards"
  | "inventory"
  | "history"
  | "help"
  | "admin"
  | "settings"
  | "showcase";

/**
 * Caminhos (dot-notation) necessários em cada escopo de cliente.
 * Nota: no `next-intl` v4, um `NextIntlClientProvider` aninhado substitui o dicionário
 * do provider pai em vez de mesclá-lo, portanto `BASE_PATHS` (e `MAIN_SHELL_PATHS` nas
 * rotas de `(main)`) são incluídos explicitamente.
 */
const BASE_PATHS = [
  "cookieBanner",
  "ui.languageToggle",
  "ui.themeToggle",
  "ui.loading",
] as const;

const MAIN_PAGE_SHARED_PATHS = [
  ...BASE_PATHS,
  "settings.upgradeModal",
  "onboarding.workspaceSetup",
  "ui.confirmationModal",
  "ui.founderBadge",
  "ui.input",
  "showcase.unlockToast",
  "showcase.rarities",
  "showcase.catalog",
] as const;

const MAIN_SHELL_PATHS = [
  ...MAIN_PAGE_SHARED_PATHS,
  "nav",
  "workspace",
  "notifications",
  "streakLost",
  "userProfile",
  "focusWidget",
  "subscriptionAlert",
  "emailVerificationBanner",
  "paymentFeedback",
  "auth.mainError",
  "dashboard.loading",
  "tasks.loading",
  "focus.loading",
  "rewards.loading",
  "inventory.loading",
  "history.loading",
  "help.loading",
  "admin.loading",
  "settings.loading",
  "showcase.loading",
] as const;

export const SCOPE_CLIENT_PATHS: Record<MessageScope, readonly string[]> = {
  base: BASE_PATHS,
  public: [...BASE_PATHS, "landing.navbar", "landing.demo", "landing.faq"],
  auth: [
    ...BASE_PATHS,
    "ui.input",
    "ui.select",
    "ui.datePicker",
    "auth.signIn",
    "auth.signUp",
    "auth.oauth",
    "auth.passwordStrength",
    "auth.validation",
    "auth.forgotPassword",
    "auth.resetPassword",
  ],
  onboarding: [
    ...BASE_PATHS,
    "ui.input",
    "onboarding.wizard",
    "onboarding.usageModes",
    "onboarding.workspaceSetup",
    "onboarding.experienceMode",
  ],
  main: MAIN_SHELL_PATHS,
  dashboard: [
    ...MAIN_PAGE_SHARED_PATHS,
    "dashboard",
    "focus.activityModal",
    "tasks.columnModal",
    "tasks.detailsPopover",
    "tasks.hooks",
    "tasks.options",
    "tasks.tagSelector",
    "tasks.taskModal",
    "upgradeColumnLimitCard",
    "ui.datePicker",
    "ui.iconPicker",
    "ui.listCard",
    "ui.pagination",
    "ui.rewardPreview",
    "ui.select",
    "ui.timePicker",
  ],
  tasks: [
    ...MAIN_PAGE_SHARED_PATHS,
    "tasks",
    "dashboard.taskShared",
    "ui.datePicker",
    "ui.filterBar",
    "ui.iconPicker",
    "ui.rewardPreview",
    "ui.select",
    "ui.timePicker",
    "ui.viewMode",
    "ui.welcomeCard",
  ],
  focus: [
    ...MAIN_PAGE_SHARED_PATHS,
    "focus",
    "focusWidget",
    "ui.datePicker",
    "ui.iconPicker",
    "ui.rewardPreview",
    "ui.select",
    "ui.timePicker",
    "ui.welcomeCard",
  ],
  rewards: [
    ...MAIN_PAGE_SHARED_PATHS,
    "rewards",
    "ui.filterBar",
    "ui.iconPicker",
    "ui.itemCatalog",
    "ui.select",
    "ui.viewMode",
    "ui.welcomeCard",
  ],
  inventory: [
    ...MAIN_PAGE_SHARED_PATHS,
    "inventory",
    "rewards.mysteryBox",
    "rewards.options",
    "rewards.tierPopover",
    "ui.filterBar",
    "ui.itemCatalog",
    "ui.select",
    "ui.viewMode",
    "ui.welcomeCard",
  ],
  history: [
    ...MAIN_PAGE_SHARED_PATHS,
    "history",
    "ui.filterBar",
    "ui.select",
    "ui.viewMode",
    "ui.welcomeCard",
  ],
  help: [
    ...MAIN_PAGE_SHARED_PATHS,
    "help.faq",
    "help.tables",
    "ui.filterBar",
    "ui.select",
    "ui.viewMode",
  ],
  admin: [
    ...MAIN_PAGE_SHARED_PATHS,
    "admin",
    "dashboard.taskTable",
    "ui.pagination",
  ],
  settings: [
    ...MAIN_PAGE_SHARED_PATHS,
    "settings",
    "subscriptionAlert",
    "ui.datePicker",
    "ui.select",
  ],
  showcase: [
    ...MAIN_PAGE_SHARED_PATHS,
    "showcase",
    "settings.avatarFrames",
    "settings.upgradeModal",
    "ui.filterBar",
    "ui.pagination",
    "ui.select",
  ],
};

/**
 * Caminhos exclusivos de Server Components (`generateMetadata`, `loading.tsx`,
 * páginas puramente SSR e Server Actions). São removidos antes de enviar
 * o dicionário ao `NextIntlClientProvider`.
 */
export const SERVER_ONLY_PATHS: readonly string[] = [
  "metadata",
  "landing.metadata",
  "landing.hero",
  "landing.productivityLoop",
  "landing.manifesto",
  "landing.features",
  "landing.roadmap",
  "landing.pricing",
  "landing.ctaBanner",
  "landing.footer",
  "auth.layout",
  "auth.errors",
  "auth.verifyEmail",
  "auth.oauthCallback",
  "onboarding.metadata",
  "onboarding.layout",
  "onboarding.workspaceActions",
  "dashboard.metadata",
  "settings.metadata",
  "settings.headerTitle",
  "settings.headerSubtitle",
  "settings.cards",
  "settings.userActions",
  "settings.paymentActions",
  "tasks.metadata",
  "tasks.welcomeStats",
  "tasks.actions",
  "focus.metadata",
  "focus.actions",
  "rewards.metadata",
  "rewards.actions",
  "inventory.metadata",
  "inventory.actions",
  "history.metadata",
  "history.page",
  "history.actions",
  "help.metadata",
  "help.page",
  "help.cycle",
  "admin.metadata",
  "admin.actions",
  "showcase.metadata",
  "showcase.actions",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepClone<T>(value: T): T {
  if (!isRecord(value)) return value;
  const copy: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    copy[k] = deepClone(v);
  }
  return copy as T;
}

function getByPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (!isRecord(current)) return undefined;
    current = current[part];
  }
  return current;
}

function setByPath(
  target: Record<string, unknown>,
  path: string,
  value: unknown,
): void {
  const parts = path.split(".");
  let current = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!isRecord(current[part])) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = deepClone(value);
}

function deleteByPath(target: Record<string, unknown>, path: string): void {
  const parts = path.split(".");
  let current: Record<string, unknown> = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const next: unknown = current[parts[i]];
    if (!isRecord(next)) return;
    current = next;
  }
  delete current[parts[parts.length - 1]];
}

const scopedMessagesCache = new Map<string, AbstractIntlMessages>();

/**
 * Extrai apenas os namespaces necessários para um determinado `MessageScope`
 * e remove todas as subchaves exclusivas de servidor (`SERVER_ONLY_PATHS`).
 * Quando `locale` é informado, memoriza o resultado em memória para evitar
 * recomputar o recorte em cada requisição.
 */
export function pickScopedClientMessages(
  messages: AbstractIntlMessages,
  scope: MessageScope | readonly MessageScope[],
  locale?: AppLocale,
): AbstractIntlMessages {
  const isProd = process.env.NODE_ENV === "production";
  const scopes: readonly MessageScope[] =
    typeof scope === "string" ? [scope] : scope;
  const cacheKey = isProd && locale ? `${locale}:${scopes.join(",")}` : null;

  if (cacheKey) {
    const cached = scopedMessagesCache.get(cacheKey);
    if (cached) return cached;
  }

  const paths = new Set<string>(BASE_PATHS);

  for (const s of scopes) {
    for (const p of SCOPE_CLIENT_PATHS[s]) {
      paths.add(p);
    }
  }

  // Remove caminhos filhos redundantes quando o pai já está selecionado (ex.: "ui" cobre "ui.input")
  const sortedPaths = [...paths].sort();
  const collapsedPaths = sortedPaths.filter(
    (p) =>
      !sortedPaths.some((parent) => parent !== p && p.startsWith(`${parent}.`)),
  );

  const source = messages as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const path of collapsedPaths) {
    const val = getByPath(source, path);
    if (val !== undefined) {
      setByPath(result, path, val);
    }
  }

  for (const serverPath of SERVER_ONLY_PATHS) {
    deleteByPath(result, serverPath);
  }

  const finalMessages = Object.freeze(result) as AbstractIntlMessages;
  if (cacheKey) {
    scopedMessagesCache.set(cacheKey, finalMessages);
  }
  return finalMessages;
}
