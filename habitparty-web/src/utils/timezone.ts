export const DEFAULT_TIMEZONE = "America/Sao_Paulo";
export const TIMEZONE_COOKIE = "hp_timezone";
export const BROWSER_TIMEZONE_COOKIE = "hp_browser_tz";
export const TIMEZONE_CHANGE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

const FALLBACK_IANA_TIMEZONES = [
  "America/Sao_Paulo",
  "America/Fortaleza",
  "America/Manaus",
  "America/Rio_Branco",
  "America/Argentina/Buenos_Aires",
  "America/Santiago",
  "America/Bogota",
  "America/Mexico_City",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Vancouver",
  "Europe/Lisbon",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Rome",
  "Europe/Amsterdam",
  "UTC",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Shanghai",
  "Asia/Seoul",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

/**
 * Valida se uma string representa um fuso horário IANA reconhecido pelo runtime JS.
 */
export function isValidIanaTimeZone(tz?: string | null): tz is string {
  const clean = tz?.trim();
  if (!clean) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: clean });
    return true;
  } catch {
    return false;
  }
}

export function resolveValidTimeZone(tz?: string | null): string | undefined {
  const clean = tz?.trim();
  if (!clean) return undefined;
  return isValidIanaTimeZone(clean) ? clean : undefined;
}

export interface ZonedDateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number;
}

/**
 * Extrai componentes de calendário e relógio de um `Date` no fuso horário IANA informado
 * (ou no fuso local do runtime caso nenhum fuso válido seja informado).
 */
export function getDatePartsInTimeZone(
  date: Date = new Date(),
  timeZone?: string | null,
): ZonedDateParts {
  const validTz = resolveValidTimeZone(timeZone);
  if (!validTz) {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds(),
      weekday: date.getDay(),
    };
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: validTz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      map[part.type] = part.value;
    }
  }

  const year = Number(map.year) || date.getFullYear();
  const month = Number(map.month) || date.getMonth() + 1;
  const day = Number(map.day) || date.getDate();
  const hour = (Number(map.hour) || 0) % 24;
  const minute = Number(map.minute) || 0;
  const second = Number(map.second) || 0;
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  return { year, month, day, hour, minute, second, weekday };
}

/**
 * Converte um instante `Date` em chave de data civil `YYYY-MM-DD` no fuso IANA alvo.
 */
export function getDateKeyInTimeZone(
  date: Date = new Date(),
  timeZone?: string | null,
): string {
  const { year, month, day } = getDatePartsInTimeZone(date, timeZone);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
}

/**
 * Normaliza aliases IANA antigos (ex: Asia/Calcutta -> Asia/Kolkata) para comparação justa.
 */
export function canonicalizeTimeZone(tz?: string | null): string | null {
  if (!isValidIanaTimeZone(tz)) return null;
  try {
    const resolved = new Intl.DateTimeFormat("en-US", {
      timeZone: tz.trim(),
    }).resolvedOptions().timeZone;
    return resolved || tz.trim();
  } catch {
    return tz.trim();
  }
}

/**
 * Detecta o fuso horário IANA do navegador com fallback seguro.
 */
export function detectBrowserTimeZone(fallback = DEFAULT_TIMEZONE): string {
  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (isValidIanaTimeZone(detected)) {
      return canonicalizeTimeZone(detected) ?? detected;
    }
  } catch {
    // Fallback silencioso caso Intl falhe
  }
  return fallback;
}

/**
 * Compara dois fusos horários IANA levando em conta aliases canônicos e deslocamento UTC.
 */
export function areTimeZonesEquivalent(
  a?: string | null,
  b?: string | null,
): boolean {
  if (!isValidIanaTimeZone(a) || !isValidIanaTimeZone(b)) return false;
  const ca = canonicalizeTimeZone(a);
  const cb = canonicalizeTimeZone(b);
  if (ca === cb) return true;
  if (ca === "Etc/UTC" || ca === "UTC") {
    return cb === "Etc/UTC" || cb === "UTC";
  }
  return false;
}

/**
 * Formata o deslocamento UTC atual de uma zona IANA (ex: "UTC-03:00", "UTC+09:00").
 */
export function formatTimeZoneOffsetLabel(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date());
    const offsetRaw = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    if (!offsetRaw || offsetRaw === "GMT" || offsetRaw === "UTC") {
      return "UTC+00:00";
    }
    const normalized = offsetRaw.replace(/^GMT/, "UTC");
    const match = normalized.match(/^UTC([+-])(\d{1,2})(?::(\d{2}))?$/);
    if (!match) return normalized;
    const [, sign, hours, mins = "00"] = match;
    return `UTC${sign}${hours.padStart(2, "0")}:${mins}`;
  } catch {
    return "UTC";
  }
}

/**
 * Retorna a lista ordenada de fusos horários IANA suportados pelo ambiente.
 */
export function getSupportedTimeZones(): string[] {
  try {
    const intlWithSupportedValues = Intl as typeof Intl & {
      supportedValuesOf?: (key: string) => string[];
    };
    if (typeof intlWithSupportedValues.supportedValuesOf === "function") {
      const list = intlWithSupportedValues.supportedValuesOf("timeZone");
      if (Array.isArray(list) && list.length > 0) {
        return Array.from(
          new Set([...FALLBACK_IANA_TIMEZONES, ...list]),
        ).sort();
      }
    }
  } catch {
    // Fallback para lista curada
  }
  return [...FALLBACK_IANA_TIMEZONES].sort();
}

export function hasTimeZoneSuffix(dateStr: string): boolean {
  const timePart = dateStr.split("T")[1] ?? dateStr.split(" ")[1] ?? "";
  return /([zZ]|[+-]\d{2}(?::?\d{2})?)$/.test(timePart.trim());
}

/**
 * Converte com precisão uma string de data vinda do servidor (UTC ou local) para Date,
 * garantindo que datas sem indicador de fuso geradas em UTC sejam interpretadas
 * corretamente e convertidas para o fuso horário local do navegador do usuário.
 */
export function parseServerDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  let str = dateStr.trim();
  if (str.includes(" ")) {
    str = str.replace(" ", "T");
  }
  if (str.includes("T") && !hasTimeZoneSuffix(str)) {
    str = `${str}Z`;
  }
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Calcula quantos milissegundos restam no cooldown de 24h após a última alteração manual de fuso horário.
 */
export function getTimeZoneCooldownRemainingMs(
  timezoneUpdatedAt?: string | null,
  now: Date = new Date(),
): number {
  const parsed = parseServerDate(timezoneUpdatedAt);
  if (!parsed) return 0;
  return Math.max(
    0,
    parsed.getTime() + TIMEZONE_CHANGE_COOLDOWN_MS - now.getTime(),
  );
}

/**
 * Persiste o fuso horário IANA no cookie de cliente para leitura consistente no SSR.
 */
export function setClientTimeZoneCookie(tz?: string | null): void {
  if (typeof document === "undefined" || !isValidIanaTimeZone(tz)) return;
  const clean = tz.trim();
  const encoded = `${TIMEZONE_COOKIE}=${encodeURIComponent(clean)}`;
  if (document.cookie.split("; ").includes(encoded)) return;
  const maxAge = 60 * 60 * 24 * 365;
  // biome-ignore lint/suspicious/noDocumentCookie: Sincroniza cookie de fuso horário para consistência em SSR sem Server Action extra
  document.cookie = `${encoded}; path=/; max-age=${maxAge}; SameSite=Lax`;
}
