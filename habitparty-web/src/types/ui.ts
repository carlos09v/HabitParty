import type { LucideIcon } from "lucide-react";
import type { HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export type ThemeMode = "light" | "dark";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  compact?: boolean;
  label: string;
  icon?: ReactNode;
  error?: string;
  hint?: string;
}

export interface DatePickerProps {
  id?: string;
  label?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  required?: boolean;
  variant?: "input" | "badge";
  placeholder?: string;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
  allowClear?: boolean;
  compact?: boolean;
  className?: string;
  error?: string;
  hint?: string;
  align?: "left" | "right";
  yearRange?: { min?: number; max?: number };
}

export interface ListCardProps {
  compact?: boolean;
  title: string;
  count?: string;
  subtitle?: string;
  icon?: ReactNode;
  isAdd?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  className?: string;
}

export type SelectItem = string | SelectOption;

export interface SelectProps {
  compact?: boolean;
  variant?: "default" | "inline";
  align?: "left" | "right" | "center";
  label?: ReactNode;
  icon?: ReactNode;
  options: readonly SelectItem[] | SelectItem[];
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  dropdownClassName?: string;
  triggerClassName?: string;
  usePortal?: boolean;
  "aria-label"?: string;
}

export interface WelcomeCardStat {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  variant?: "default" | "gold" | "success" | "primary" | "warning" | "info";
  hint?: string;
}

export interface WelcomeCardProps {
  title: string;
  subtitle?: string;
  bullets: string[];
  imageSrc?: string;
  stats?: WelcomeCardStat[];
  isExpanded?: boolean;
  defaultExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  compact?: boolean;
  className?: string;
  imageWidth?: number;
  imageHeight?: number;
  storageKey?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export type LoadingVariant = "spinner" | "dots" | "skeleton" | "overlay";
export type LoadingColor = "primary" | "gold";
export type LoadingSize = "sm" | "md" | "lg" | "xl";

export interface LoadingProps extends HTMLAttributes<HTMLDivElement> {
  variant?: LoadingVariant;
  color?: LoadingColor;
  size?: LoadingSize;
  label?: string;
  width?: string | number;
  height?: string | number;
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
}

export interface SelectOption {
  label: string;
  value: string;
  icon?: ReactNode;
}

export interface DropdownFilter {
  id: string;
  label: string;
  value: string;
  options: SelectOption[];
}

export interface ItemCatalogFilterState {
  search: string;
  type: string;
  category: string;
  tag?: string;
  packageLevel?: string;
  status?: string;
  sortBy?: string;
  viewMode?: "card" | "list";
}

export interface FilterBarProps {
  search?: {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
  };
  viewMode?: {
    value: "list" | "card" | "grid";
    onChange: (mode: "list" | "card" | "grid") => void;
  };
  dropdownFilters?: DropdownFilter[];
  onDropdownChange?: (filterLabel: string, value: string) => void;
  onClearDropdowns?: () => void;
  leftActions?: React.ReactNode;
  middleActions?: React.ReactNode;
  rightActions?: React.ReactNode;
}

export interface IconOption {
  id: string;
  label: string;
  icon: LucideIcon;
  isPremium?: boolean;
}

export interface IconPickerProps {
  options: readonly IconOption[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  columns?: number;
  className?: string;
  isCompact?: boolean;
}

export interface ContextMenuItem {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  variant?: "default" | "destructive" | "warning";
  disabled?: boolean;
  active?: boolean;
  children?: ContextMenuItem[];
}

export interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  items: ContextMenuItem[];
  className?: string;
}
