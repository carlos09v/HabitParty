export type HelpCategory =
  | "ALL"
  | "OVERVIEW"
  | "TASKS"
  | "ECONOMY"
  | "REWARDS"
  | "INVENTORY"
  | "FOCUS"
  | "LEVELS";

export interface HelpFaqActionLink {
  label: string;
  href: string;
}

export interface HelpFaqItem {
  id: string;
  category: HelpCategory;
  question: string;
  answer: string;
  bullets?: string[];
  tags: string[];
  highlightBadge?: string;
  actionLink?: HelpFaqActionLink;
}

export interface HelpTableEntry {
  title: string;
  description: string;
  category?: HelpCategory;
  categories?: HelpCategory[];
  columns: string[];
  rows: Array<Array<string | number>>;
}

export interface HelpProductivityStep {
  step: 1 | 2 | 3 | 4;
  badgeClassName: string;
}
