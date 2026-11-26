/**
 * Normaliza texto para buscas insensíveis a maiúsculas/minúsculas e diacríticos (acentos).
 */
export function normalizeSearchText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}
