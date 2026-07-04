import { ThemeType, ThemeConfig } from "./types";

export const THEME_PRESETS: Record<ThemeType, ThemeConfig> = {
  cosmic: {
    name: "Cosmic Nebula",
    bgClass: "bg-slate-950 text-slate-100",
    cardClass: "bg-slate-900/80 border border-violet-500/20 shadow-violet-950/20 shadow-2xl",
    accentClass: "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-500/25 shadow-lg",
    borderClass: "border-violet-500/20",
    textColorClass: "text-violet-400",
    badgeClass: "bg-violet-950/50 text-violet-300 border-violet-500/30",
    inputClass: "bg-slate-900/90 border-slate-700/50 focus:border-violet-500 text-slate-100 placeholder-slate-500 focus:ring-violet-500/20",
    lockIconClass: "text-violet-500 shadow-violet-500/10"
  },
  cyber: {
    name: "Neon Cyberpunk",
    bgClass: "bg-black text-slate-100 font-mono",
    cardClass: "bg-zinc-950 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]",
    accentClass: "bg-gradient-to-r from-cyan-500 to-fuchsia-500 hover:from-cyan-400 hover:to-fuchsia-400 text-black font-bold tracking-wider",
    borderClass: "border-cyan-500/30",
    textColorClass: "text-cyan-400",
    badgeClass: "bg-cyan-950/50 text-cyan-300 border-cyan-500/30",
    inputClass: "bg-zinc-900 border-zinc-800 focus:border-cyan-500 text-cyan-300 placeholder-cyan-700 focus:ring-cyan-500/20",
    lockIconClass: "text-fuchsia-500 shadow-fuchsia-500/10"
  },
  royal: {
    name: "Imperial Crimson",
    bgClass: "bg-stone-900 text-stone-100 font-serif",
    cardClass: "bg-stone-950/90 border border-amber-600/30 shadow-2xl shadow-amber-950/20",
    accentClass: "bg-gradient-to-r from-amber-600 to-red-700 hover:from-amber-500 hover:to-red-600 text-stone-100 tracking-wide font-sans",
    borderClass: "border-amber-600/20",
    textColorClass: "text-amber-500",
    badgeClass: "bg-amber-950/40 text-amber-300 border-amber-600/20",
    inputClass: "bg-stone-900 border-stone-800 focus:border-amber-600 text-stone-100 placeholder-stone-600 font-sans",
    lockIconClass: "text-amber-500"
  },
  forest: {
    name: "Ancient Woodlands",
    bgClass: "bg-stone-950 text-stone-100",
    cardClass: "bg-emerald-950/20 border border-emerald-800/20 shadow-xl shadow-emerald-950/10 backdrop-blur-sm",
    accentClass: "bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-stone-100",
    borderClass: "border-emerald-800/15",
    textColorClass: "text-emerald-400",
    badgeClass: "bg-emerald-950/50 text-emerald-300 border-emerald-800/30",
    inputClass: "bg-stone-900 border-stone-800 focus:border-emerald-700 text-stone-100 placeholder-stone-600",
    lockIconClass: "text-emerald-500"
  },
  terminal: {
    name: "Retro Terminal",
    bgClass: "bg-zinc-950 text-green-500 font-mono",
    cardClass: "bg-black border border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]",
    accentClass: "bg-green-500 hover:bg-green-400 text-black font-bold border border-green-400",
    borderClass: "border-green-500/30",
    textColorClass: "text-green-500",
    badgeClass: "bg-green-950 text-green-400 border-green-500/40",
    inputClass: "bg-black border-green-500 focus:border-green-400 text-green-400 placeholder-green-800",
    lockIconClass: "text-green-500"
  },
  amber: {
    name: "Vintage Amber",
    bgClass: "bg-zinc-950 text-amber-500",
    cardClass: "bg-zinc-900/60 border border-amber-600/30 shadow-2xl backdrop-blur-md",
    accentClass: "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium",
    borderClass: "border-amber-600/20",
    textColorClass: "text-amber-500",
    badgeClass: "bg-amber-950/40 text-amber-300 border-amber-600/30",
    inputClass: "bg-zinc-900 border-zinc-800 focus:border-amber-500 text-amber-100 placeholder-amber-700 focus:ring-amber-500/20",
    lockIconClass: "text-amber-500"
  }
};
