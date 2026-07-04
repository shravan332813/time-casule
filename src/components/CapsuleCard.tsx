import { useState, useEffect } from "react";
import { Capsule, ThemeType } from "../types";
import { THEME_PRESETS } from "../themes";
import { Lock, Unlock, Calendar, User, Sparkles, AlertCircle, Copy, Check } from "lucide-react";
import Markdown from "react-markdown";

interface CapsuleCardProps {
  capsule: Capsule;
  onUnlock: () => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

export default function CapsuleCard({ capsule, onUnlock }: CapsuleCardProps) {
  const themeConfig = THEME_PRESETS[capsule.theme as ThemeType] || THEME_PRESETS.cosmic;
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(calculateTimeRemaining());
  const [triggerRefetch, setTriggerRefetch] = useState(false);

  function calculateTimeRemaining(): TimeRemaining {
    const target = new Date(capsule.unlockAt).getTime();
    const now = new Date().getTime();
    const diff = target - now;

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, totalMs: diff };
  }

  useEffect(() => {
    // Initial check
    const initial = calculateTimeRemaining();
    setTimeRemaining(initial);

    if (initial.totalMs <= 0 && capsule.isLocked) {
      // Already unlocked but parent hasn't refreshed yet
      onUnlock();
      return;
    }

    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      if (remaining.totalMs <= 0) {
        clearInterval(timer);
        if (capsule.isLocked) {
          // Trigger parent refresh to fetch unlocked message
          onUnlock();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [capsule.unlockAt, capsule.isLocked]);

  const handleCopy = () => {
    if (capsule.message) {
      navigator.clipboard.writeText(capsule.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isLocked = capsule.isLocked || timeRemaining.totalMs > 0;

  return (
    <div
      id={`capsule-card-${capsule.id}`}
      className={`relative w-full rounded-3xl p-6 md:p-8 transition-all duration-700 overflow-hidden border ${themeConfig.cardClass}`}
    >
      {/* Decorative ambient background blur inside card */}
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-violet-600/10 blur-2xl pointer-events-none"></div>
      <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-indigo-600/10 blur-2xl pointer-events-none"></div>

      {isLocked ? (
        /* --- LOCKED VIEW --- */
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Header Indicators */}
          <div className="flex items-center justify-between w-full border-b border-slate-500/10 pb-4">
            <span className={`text-xs font-mono px-3 py-1 rounded-full border ${themeConfig.badgeClass} flex items-center gap-1.5`}>
              <Calendar className="w-3 h-3" />
              Locked on {new Date(capsule.createdAt).toLocaleDateString()}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              by {capsule.creator}
            </span>
          </div>

          {/* Animated Lock Sphere */}
          <div className="relative group my-2">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-600/20 to-indigo-600/20 blur-xl animate-pulse"></div>
            <div className="relative w-24 h-24 rounded-full bg-slate-950 border border-slate-800/80 flex items-center justify-center shadow-inner transition-transform duration-500 group-hover:scale-105">
              <Lock className={`w-10 h-10 transition-colors ${themeConfig.lockIconClass}`} />
            </div>
            {/* Spinning decorative orbit */}
            <div className="absolute inset-0 rounded-full border border-dashed border-violet-500/20 animate-[spin_40s_linear_infinite]"></div>
          </div>

          {/* Title & Teaser */}
          <div className="space-y-2 max-w-md">
            <h3 className="text-xl md:text-2xl font-bold text-slate-100 tracking-tight leading-snug">
              {isLocked && (capsule.id === "capsule_govarthan" || capsule.title === "Govarthan") ? "unknown" : capsule.title}
            </h3>
            {capsule.id === "capsule_govarthan" || capsule.title === "Govarthan" ? null : capsule.teaser ? (
              <p className="text-xs md:text-sm text-slate-400 italic">
                “{capsule.teaser}”
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                A capsule sealed for future generations.
              </p>
            )}
          </div>

          {/* Locked Status - "Not Yet Time" Banner */}
          <div className="w-full max-w-sm bg-slate-950/80 border border-slate-850/60 rounded-3xl py-6 px-4 flex flex-col items-center justify-center transition-all duration-300 shadow-inner">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Lock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              Not Yet Time
            </div>
            <span className="text-xs text-slate-400 text-center leading-relaxed px-2 mt-1">
              This capsule is sealed and will unlock on <br />
              <strong className="text-slate-200 font-mono text-sm inline-block mt-1">{new Date(capsule.unlockAt).toLocaleString()}</strong>
            </span>
          </div>

          {/* Locked status banner */}
          <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-1.5">
            <AlertCircle className="w-4 h-4 text-slate-600" />
            <span>Opens automatically when the day and date is reached.</span>
          </div>
        </div>
      ) : (
        /* --- UNLOCKED VIEW --- */
        <div className="space-y-6">
          {/* Header Indicators */}
          <div className="flex items-center justify-between border-b border-slate-500/10 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-950/40 text-emerald-300 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                <Unlock className="w-3 h-3 animate-bounce" />
                Unlocked
              </span>
              <span className="text-xs text-slate-500 hidden sm:inline">
                Buried: {new Date(capsule.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                by {capsule.creator}
              </span>
              
              {capsule.message && (
                <button
                  id={`copy-capsule-${capsule.id}`}
                  onClick={handleCopy}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                  title="Copy message to clipboard"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          {/* Reveal Title Block */}
          <div className="space-y-1.5">
            <h3 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2 flex-wrap">
              <Sparkles className={`w-5 h-5 ${themeConfig.textColorClass}`} />
              {capsule.title}
            </h3>
            <p className="text-xs text-slate-400">
              Unsealed on {new Date(capsule.unlockAt).toLocaleString()}
            </p>
          </div>

          {/* Secret Message Container */}
          <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-5 md:p-6 shadow-inner relative max-h-[380px] overflow-y-auto">
            <div className="markdown-body text-slate-200 text-sm md:text-base leading-relaxed space-y-3 font-sans break-words select-text">
              {capsule.message ? (
                <Markdown>{capsule.message}</Markdown>
              ) : (
                <p className="text-slate-500 italic animate-pulse">
                  Retrieving unsealed message from high security vault...
                </p>
              )}
            </div>
          </div>

          {/* Teaser citation if present */}
          {capsule.teaser && (
            <div className="p-3.5 bg-slate-950/20 rounded-xl border border-slate-850/40 text-xs text-slate-400 italic">
              “{capsule.teaser}”
            </div>
          )}
        </div>
      )}
    </div>
  );
}
