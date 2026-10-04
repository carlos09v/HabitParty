export type RewardType = "SingleUse" | "TimeBased" | "MysteryBox";

export type PackageLevel = "Básico" | "Premium" | "Épico" | "Lendário";

export type RewardCategory =
  | "Entretenimento"
  | "Bem-estar"
  | "Compras"
  | "Desenvolvimento"
  | "Sorte"
  | "Hobbies";

export interface Reward {
  id: string;
  title: string;
  description: string;
  type: RewardType;
  packageLevel?: PackageLevel;
  category: RewardCategory;
  duration?: string;
  price: number;
  iconName?: "joystick" | "mystery_box" | "coffee" | "book" | "clapperboard";
}
