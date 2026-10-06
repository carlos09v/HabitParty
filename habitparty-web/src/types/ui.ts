import type { LucideIcon } from "lucide-react";
import type { HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  compact?: boolean;
  label: string;
  icon?: ReactNode;
}

export interface ListCardProps {
  compact?: boolean;
  title: string;
  count?: string;
  icon?: ReactNode;
  isAdd?: boolean;
  onClick?: () => void;
  className?: string;
}

export interface SelectProps {
  compact?: boolean;
  label: string;
  options: string[];
  placeholder: string;
}

export interface WelcomeCardStat {
  label: string;
  value: string;
}

export interface WelcomeCardProps {
  title: string;
  subtitle?: string;
  bullets: string[];
  imageSrc?: string;
  stats?: WelcomeCardStat[];
  isExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  compact?: boolean;
  className?: string;
  imageWidth?: number;
  imageHeight?: number;
  storageKey?: string;
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
}

export interface DropdownFilter {
  id: string;
  label: string;
  value: string;
  options: SelectOption[];
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
  onClick: () => void;
  variant?: "default" | "destructive";
  disabled?: boolean;
}

export interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  items: ContextMenuItem[];
  className?: string;
}
