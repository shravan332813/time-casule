import { useState } from "react";
import { Capsule, ThemeType } from "../types";
import { THEME_PRESETS } from "../themes";
import { PlusCircle, Trash2, Calendar, Clock, Lock, Sparkles, FileText, User, HelpCircle, LogOut, CheckCircle } from "lucide-react";

interface AdminPanelProps {
  adminUsername: string;
  adminPassword: string;
  capsules: Capsule[];
  onRefresh: () => void;
  onLogout: () => void;
}

export default function AdminPanel({ adminUsername, adminPassword, capsules, onRefresh, onLogout }: AdminPanelProps) {
  const visibleCapsules = capsules.filter(c => c.id !== "capsule_govarthan" && c.title !== "Govarthan");

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [teaser, setTeaser] = useState("");
  const [unlockAt, setUnlockAt] = useState("");
  const [theme, setTheme] = useState<ThemeType>("cosmic");
  const [creator, setCreator] = useState("Admin");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick offsets for testing countdowns easily!
  const setQuickUnlock = (minutes: number) => {
    const targetDate = new Date();
    targetDate.setMinutes(targetDate.getMinutes() + minutes);
    
    // Format to datetime-local compatible string: YYYY-MM-DDTHH:MM
    const tzoffset = targetDate.getTimezoneOffset() * 60000; //offset in milliseconds
    const localISOTime = (new Date(targetDate.getTime() - tzoffset)).toISOString().slice(0, 16);
    setUnlockAt(localISOTime);
  };

  const handleCreateCapsule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!title.trim() || !message.trim() || !unlockAt) {
      setError("Please fill out all required fields (Title, Message, and Unlock Time).");
      return;
    }

    const unlockDate = new Date(unlockAt);
    if (isNaN(unlockDate.getTime())) {
      setError("Please select a valid date and time.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/capsules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-username": adminUsername,
          "x-admin-password": adminPassword
        },
        body: JSON.stringify({
          title,
          message,
          teaser: teaser.trim() || undefined,
          unlockAt: unlockDate.toISOString(),
          theme,
          creator: creator.trim() || "Admin"
        })
      });

      let data: any = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }
      
      if (!response.ok) {
        throw new Error(data.error || `Failed to seal time capsule (Status: ${response.status})`);
      }

      setSuccess(true);
      setTitle("");
      setMessage("");
      setTeaser("");
      setUnlockAt("");
      setTheme("cosmic");
      setCreator("Admin");
      
      onRefresh();
      
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create capsule");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCapsule = async (id: string) => {
    if (!confirm("Are you sure you want to incinerate/delete this time capsule? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/capsules/${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-username": adminUsername,
          "x-admin-password": adminPassword
        }
      });

      if (!response.ok) {
        let errorMsg = "Failed to delete capsule";
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          errorMsg = data.error || errorMsg;
        } else {
          errorMsg += ` (Status: ${response.status})`;
        }
        throw new Error(errorMsg);
      }

      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete capsule");
    }
  };

  return (
    <div id="admin-panel" className="w-full max-w-6xl mx-auto space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              Capsule Control Deck <span className="text-xs bg-violet-950 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-full font-mono font-medium">Administrator</span>
            </h1>
            <p className="text-xs text-slate-400">Add, configure, and manage active and historical secure time capsules.</p>
          </div>
        </div>
        <button
          id="logout-button"
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-slate-100 rounded-xl text-xs font-medium border border-slate-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Lock Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Create Form (7 cols on lg) */}
        <form onSubmit={handleCreateCapsule} className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 relative">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <PlusCircle className="w-5 h-5 text-violet-500" />
            <h2 className="text-base font-semibold text-slate-100">Seal a New Time Capsule</h2>
          </div>

          {error && (
            <div className="p-3.5 bg-red-950/20 border border-red-500/30 text-red-300 text-xs rounded-xl flex items-start gap-2">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Time Capsule locked and buried successfully!</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                Capsule Title <span className="text-red-500">*</span>
              </label>
              <input
                id="capsule-title-input"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Predictions for 2027 or Letter to My Future Self"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
              />
            </div>

            {/* Grid for Unlock date and Creator */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Unlock Date */}
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-violet-400" />
                  Unlock Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  id="capsule-unlock-input"
                  type="datetime-local"
                  required
                  value={unlockAt}
                  onChange={(e) => setUnlockAt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
                />
                
                {/* Quick select buttons */}
                <div className="flex flex-wrap gap-1 mt-2">
                  <button
                    id="quick-unlock-5m"
                    type="button"
                    onClick={() => setQuickUnlock(5)}
                    className="text-[10px] px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-850 rounded-lg transition-colors"
                  >
                    +5 mins
                  </button>
                  <button
                    id="quick-unlock-1h"
                    type="button"
                    onClick={() => setQuickUnlock(60)}
                    className="text-[10px] px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-850 rounded-lg transition-colors"
                  >
                    +1 hour
                  </button>
                  <button
                    id="quick-unlock-1d"
                    type="button"
                    onClick={() => setQuickUnlock(1440)}
                    className="text-[10px] px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-850 rounded-lg transition-colors"
                  >
                    +1 day
                  </button>
                  <button
                    id="quick-unlock-1w"
                    type="button"
                    onClick={() => setQuickUnlock(10080)}
                    className="text-[10px] px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-850 rounded-lg transition-colors"
                  >
                    +1 week
                  </button>
                </div>
              </div>

              {/* Creator */}
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-violet-400" />
                  Creator / Nickname
                </label>
                <input
                  id="capsule-creator-input"
                  type="text"
                  value={creator}
                  onChange={(e) => setCreator(e.target.value)}
                  placeholder="e.g., Admin, Future Me, Alice"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
                />
              </div>
            </div>

            {/* Teaser/Hint */}
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-violet-400" />
                Locked Teaser / Hint (Visible to visitors before unlocking)
              </label>
              <input
                id="capsule-teaser-input"
                type="text"
                value={teaser}
                onChange={(e) => setTeaser(e.target.value)}
                placeholder="e.g., Contains letters from our 2026 trip, and some predictions."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
              />
            </div>

            {/* Secret Message */}
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-violet-400" />
                Locked Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id="capsule-message-input"
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your secret future message here... Markdown is fully supported!"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 font-mono transition-all resize-none"
              ></textarea>
            </div>

            {/* Theme Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                Capsule Visual Theme
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(THEME_PRESETS).map(([key, value]) => {
                  const isSelected = theme === key;
                  return (
                    <button
                      id={`theme-btn-${key}`}
                      key={key}
                      type="button"
                      onClick={() => setTheme(key as ThemeType)}
                      className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-violet-500 bg-slate-950 ring-2 ring-violet-500/15"
                          : "border-slate-800 bg-slate-950/40 hover:bg-slate-900/40"
                      }`}
                    >
                      <span className="text-xs font-medium text-slate-200">{value.name}</span>
                      <div className="flex gap-1 mt-1.5 w-full">
                        <div className="w-3 h-3 rounded bg-indigo-500"></div>
                        <div className="w-3 h-3 rounded bg-violet-600"></div>
                        <div className="w-3 h-3 rounded bg-slate-800"></div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            id="seal-capsule-submit"
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium rounded-xl text-sm shadow-lg shadow-violet-950/40 transition-all focus:outline-none focus:ring-2 focus:ring-violet-500 flex items-center justify-center gap-2"
          >
            <Clock className="w-4 h-4" />
            {loading ? "Sealing into Vault..." : "Seal & Bury Time Capsule"}
          </button>
        </form>

        {/* Right Side: Capsule List (5 cols on lg) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-base font-semibold text-slate-100">Bury Vaults ({visibleCapsules.length})</h2>
            <p className="text-xs text-slate-400 mt-0.5">Manage existing time capsules in the system.</p>
          </div>

          {visibleCapsules.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Lock className="w-8 h-8 mx-auto stroke-1 text-slate-600 mb-2" />
              <p className="text-sm">No time capsules have been sealed yet.</p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[580px] overflow-y-auto pr-1">
              {visibleCapsules.map((capsule) => {
                const isLocked = capsule.isLocked;
                const config = THEME_PRESETS[capsule.theme as ThemeType] || THEME_PRESETS.cosmic;
                
                return (
                  <div
                    id={`admin-capsule-${capsule.id}`}
                    key={capsule.id}
                    className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-850 rounded-xl hover:border-slate-800 transition-all"
                  >
                    <div className="space-y-1 max-w-[80%]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-semibold text-slate-200 line-clamp-1">{capsule.title}</span>
                        {isLocked ? (
                          <span className="text-[10px] bg-amber-950/50 text-amber-300 border border-amber-600/20 px-2 py-0.5 rounded-full font-medium">
                            Locked
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-950/50 text-emerald-300 border border-emerald-600/20 px-2 py-0.5 rounded-full font-medium">
                            Unlocked
                          </span>
                        )}
                      </div>
                      
                      <div className="text-[11px] text-slate-400 font-mono">
                        Unlock: {new Date(capsule.unlockAt).toLocaleString()}
                      </div>

                      <div className="text-[10px] text-slate-500">
                        Theme: {config.name} | Creator: {capsule.creator}
                      </div>
                    </div>

                    <button
                      id={`delete-capsule-${capsule.id}`}
                      onClick={() => handleDeleteCapsule(capsule.id)}
                      className="w-8 h-8 rounded-lg bg-red-950/20 border border-red-500/10 hover:border-red-500/30 flex items-center justify-center text-red-400 hover:text-red-300 transition-all shrink-0"
                      title="Incinerate Capsule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
