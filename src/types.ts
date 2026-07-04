export interface Capsule {
  id: string;
  title: string;
  teaser?: string;
  message: string | null;
  unlockAt: string;
  createdAt: string;
  theme: string;
  creator: string;
  isLocked: boolean;
}

export interface Config {
  setupComplete: boolean;
}

export type ThemeType = "cosmic" | "cyber" | "royal" | "forest" | "terminal" | "amber";

export interface ThemeConfig {
  name: string;
  bgClass: string;
  cardClass: string;
  accentClass: string;
  borderClass: string;
  textColorClass: string;
  badgeClass: string;
  inputClass: string;
  lockIconClass: string;
}
