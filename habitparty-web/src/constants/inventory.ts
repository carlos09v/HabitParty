import type { SelectOption } from "@/types/ui";

export type { SelectOption };

export const INVENTORY_STATUS_OPTIONS: SelectOption[] = [
  { label: "Todos os Status", value: "" },
  { label: "Disponíveis", value: "AVAILABLE" },
  { label: "No Foco", value: "IN_FOCUS" },
];

export const INVENTORY_SORT_OPTIONS: SelectOption[] = [
  { label: "Ordem Padrão", value: "" },
  { label: "Maior Quantidade", value: "quantity-desc" },
  { label: "Nome (A-Z)", value: "name" },
];
