import { FOCUS_ICON_KEYWORD_MAP } from "@/constants/focus";
import { REWARD_ICON_KEYWORD_MAP } from "@/constants/reward";

/**
 * Sugere automaticamente um ID de ícone normalizando o texto (NFD, sem acentos)
 * e buscando correspondência em um mapa de palavras-chave.
 */
export function suggestIconFromKeyword(
  text: string,
  keywordMap: Record<string, string>,
): string | null {
  if (!text.trim()) return null;

  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  for (const [keyword, iconId] of Object.entries(keywordMap)) {
    if (normalized.includes(keyword)) {
      return iconId;
    }
  }

  return null;
}

/**
 * Sugere um ícone de Recompensa a partir do título digitado.
 */
export function suggestRewardIconFromTitle(title: string): string | null {
  return suggestIconFromKeyword(title, REWARD_ICON_KEYWORD_MAP);
}

/**
 * Sugere um ícone de Atividade de Foco a partir do nome digitado.
 */
export function suggestFocusIconFromName(name: string): string | null {
  return suggestIconFromKeyword(name, FOCUS_ICON_KEYWORD_MAP);
}
