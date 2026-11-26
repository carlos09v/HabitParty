/**
 * Constantes compartilhadas de layout para a Vitrine (Rewards) e Mochila (Inventory),
 * garantindo alinhamento exato entre cabeçalho e linhas e ritmo uniforme no grid de cards.
 */
export const CATALOG_CARD_GRID_CLASS =
  "catalog-card-grid grid grid-cols-1 @min-[520px]:grid-cols-2 @min-[800px]:grid-cols-3 @min-[1080px]:grid-cols-4 @min-[1280px]:grid-cols-5 gap-3.5 w-full";

export const CATALOG_ROW_GRID_CLASS =
  "md:grid md:grid-cols-[minmax(0,3.2fr)_minmax(0,1fr)_minmax(0,1.35fr)_minmax(0,0.9fr)_14rem] xl:grid-cols-[minmax(0,3fr)_minmax(0,1.15fr)_minmax(0,1.6fr)_minmax(0,1fr)_15.5rem] md:items-center md:gap-2.5 xl:gap-4 md:px-3.5 xl:px-4";
