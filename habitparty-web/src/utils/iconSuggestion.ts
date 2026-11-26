import {
  FOCUS_ICON_KEYWORD_MAP,
  FOCUS_PREMIUM_ICON_IDS,
} from "@/constants/focusIconKeywords";
import {
  REWARD_ICON_KEYWORD_MAP,
  REWARD_PREMIUM_ICON_IDS,
} from "@/constants/reward";

/**
 * Sugere automaticamente um ID de ícone normalizando o texto (NFD, sem acentos)
 * e buscando correspondência em um mapa de palavras-chave, ignorando ícones bloqueados.
 */
export function suggestIconFromKeyword(
  text: string,
  keywordMap: Record<string, string>,
  blockedIconIds?: ReadonlySet<string>,
): string | null {
  if (!text.trim()) return null;

  const isAllowed = (iconId: string) =>
    !blockedIconIds || !blockedIconIds.has(iconId.toLowerCase());

  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const tokens = normalized.split(/[^a-z0-9]+/).filter(Boolean);

  // 1. Prioriza correspondência exata de palavra inteira (evita "cha" em "lanche"/"chave"/"bolacha" ou "ler" em "colher")
  for (const token of tokens) {
    const exactMatch = keywordMap[token];
    if (exactMatch && isAllowed(exactMatch)) {
      return exactMatch;
    }
  }

  // 2. Fallback por prefixo/substring apenas para palavras-chave de 4+ caracteres
  for (const [keyword, iconId] of Object.entries(keywordMap)) {
    if (
      keyword.length >= 4 &&
      normalized.includes(keyword) &&
      isAllowed(iconId)
    ) {
      return iconId;
    }
  }

  return null;
}

/**
 * Sugere um ícone de Recompensa a partir do título digitado, respeitando acesso Premium.
 */
export function suggestRewardIconFromTitle(
  title: string,
  isPremium = true,
): string | null {
  return suggestIconFromKeyword(
    title,
    REWARD_ICON_KEYWORD_MAP,
    isPremium ? undefined : REWARD_PREMIUM_ICON_IDS,
  );
}

/**
 * Sugere um ícone de Atividade de Foco a partir do nome digitado, respeitando acesso Premium.
 */
export function suggestFocusIconFromName(
  name: string,
  isPremium = true,
): string | null {
  return suggestIconFromKeyword(
    name,
    FOCUS_ICON_KEYWORD_MAP,
    isPremium ? undefined : FOCUS_PREMIUM_ICON_IDS,
  );
}
