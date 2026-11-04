import type admin from "../messages/en/admin.json";
import type auth from "../messages/en/auth.json";
import type common from "../messages/en/common.json";
import type dashboard from "../messages/en/dashboard.json";
import type focus from "../messages/en/focus.json";
import type help from "../messages/en/help.json";
import type history from "../messages/en/history.json";
import type inventory from "../messages/en/inventory.json";
import type landing from "../messages/en/landing.json";
import type layout from "../messages/en/layout.json";
import type onboarding from "../messages/en/onboarding.json";
import type rewards from "../messages/en/rewards.json";
import type settings from "../messages/en/settings.json";
import type tasks from "../messages/en/tasks.json";
import type { AppLocale } from "./config";

/**
 * Converte arrays de strings (ex.: em `landing.json` para `t.raw(...)`) em `string`
 * na representação de tipos, para satisfazer a assinatura recursiva `AbstractIntlMessages`
 * do `next-intl` sem perder a validação estrita de todas as chaves de tradução.
 */
type NormalizeIntlMessages<T> = T extends readonly unknown[]
  ? string
  : T extends object
    ? { [K in keyof T]: NormalizeIntlMessages<T[K]> }
    : T;

type RawAppMessages = typeof common &
  typeof layout & {
    landing: typeof landing;
    auth: typeof auth;
    onboarding: typeof onboarding;
    dashboard: typeof dashboard;
    settings: typeof settings;
    tasks: typeof tasks;
    focus: typeof focus;
    rewards: typeof rewards;
    inventory: typeof inventory;
    history: typeof history;
    help: typeof help;
    admin: typeof admin;
  };

/**
 * Formato completo do dicionário de traduções carregado pelo `loadLocaleMessages`.
 * Usado pela aumentação de módulo `AppConfig` do `next-intl` para garantir
 * autocompletar e validação em tempo de compilação em `useTranslations` e `getTranslations`.
 */
export type AppMessages = NormalizeIntlMessages<RawAppMessages>;

declare module "next-intl" {
  interface AppConfig {
    Locale: AppLocale;
    Messages: AppMessages;
  }
}
