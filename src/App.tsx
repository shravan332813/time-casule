import { useState, useEffect } from "react";
import { Capsule, Config } from "./types";
import CapsuleCard from "./components/CapsuleCard";
import AdminSetup from "./components/AdminSetup";
import AdminPanel from "./components/AdminPanel";
import { Clock, KeyRound, Lock, Unlock, Hourglass, BookOpen, HelpCircle } from "lucide-react";

export default function App() {
  const [config, setConfig] = useState<Config | null>(null);
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [adminCreds, setAdminCreds] = useState<{username: string; password: string} | null>(() => {
    const saved = localStorage.getItem("time_capsule_admin_creds");
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [viewMode, setViewMode] = useState<"public" | "admin">("public");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time clock update for the clock widget
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [appError, setAppError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setAppError(null);
      const configRes = await fetch("/api/config");
      if (!configRes.ok) {
        throw new Error(`Failed to fetch configuration (Status: ${configRes.status})`);
      }
      const configContentType = configRes.headers.get("content-type");
      if (!configContentType || !configContentType.includes("application/json")) {
        throw new Error("Server returned an invalid non-JSON response instead of configuration.");
      }
      const configData = await configRes.json();
      setConfig(configData);

      const capsulesRes = await fetch("/api/capsules");
      if (!capsulesRes.ok) {
        throw new Error(`Failed to fetch capsules database (Status: ${capsulesRes.status})`);
      }
      const capsulesContentType = capsulesRes.headers.get("content-type");
      if (!capsulesContentType || !capsulesContentType.includes("application/json")) {
        throw new Error("Server returned an invalid non-JSON response instead of capsules list.");
      }
      const capsulesData = await capsulesRes.json();
      if (Array.isArray(capsulesData)) {
        setCapsules(capsulesData);
      } else {
        throw new Error("Failed to load valid capsules database structure.");
      }
    } catch (err) {
      console.error("Failed to fetch initial application data", err);
      setAppError(err instanceof Error ? err.message : "An unknown error occurred while contacting the database server.");
      setCapsules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdminSuccess = (username: string, password: string) => {
    const creds = { username, password };
    setAdminCreds(creds);
    localStorage.setItem("time_capsule_admin_creds", JSON.stringify(creds));
    setShowAuthModal(false);
    setViewMode("admin");
    fetchData(); // Refresh to ensure admin credentials load fresh state
  };

  const handleLogout = () => {
    setAdminCreds(null);
    localStorage.removeItem("time_capsule_admin_creds");
    setViewMode("public");
  };

  if (loading) {
    return (
      <div id="app-loading-screen" className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center font-sans">
        <div className="relative mb-4">
          <div className="w-12 h-12 rounded-full border-2 border-violet-500/25 border-t-violet-500 animate-spin"></div>
          <Lock className="w-5 h-5 text-violet-500 absolute top-3.5 left-3.5" />
        </div>
        <p className="text-sm text-slate-400 font-mono">Unlocking application vault...</p>
      </div>
    );
  }

  const lockedCapsules = capsules.filter(c => c.isLocked);
  const unlockedCapsules = capsules.filter(c => !c.isLocked);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-violet-600/30 selection:text-white pb-16">
      {/* Decorative ambient background glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Decorate background */}

      {/* Main Navigation Header */}
      <header className="border-b border-slate-900/80 bg-slate-950/85 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-100 tracking-tight text-base sm:text-lg">Time Capsule storage</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Real-time Clock Widget */}
            <div id="clock-widget" className="hidden md:flex items-center gap-2 bg-slate-900 border border-slate-850 px-3.5 py-1.5 rounded-xl text-slate-300 font-mono text-xs">
              <Clock className="w-3.5 h-3.5 text-violet-400" />
              <span>{currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString()}</span>
            </div>

            {/* Admin Deck Controls */}
            {viewMode === "admin" ? (
              <button
                id="view-public-vaults-btn"
                onClick={() => setViewMode("public")}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-xl text-xs font-semibold border border-slate-850 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Public Vaults
              </button>
            ) : (
              <button
                id="admin-dashboard-btn"
                onClick={() => {
                  if (adminCreds) {
                    setViewMode("admin");
                  } else {
                    setShowAuthModal(true);
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-violet-950/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <KeyRound className="w-3.5 h-3.5" />
                {adminCreds ? "Admin Deck" : "Admin Login"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        {appError && (
          <div id="supabase-connection-error" className="mb-6 p-4 bg-red-950/35 border border-red-500/35 rounded-2xl flex items-start gap-3 text-sm text-red-200">
            <span className="p-1 rounded-lg bg-red-500/10 text-red-400 shrink-0">⚠️</span>
            <div className="space-y-1">
              <h4 className="font-semibold text-red-100">Database Connection Alert</h4>
              <p className="text-xs text-red-300 leading-relaxed">
                The application is having trouble reading or writing to the Supabase database: <code className="bg-red-950/80 px-1 py-0.5 rounded font-mono text-red-200">{appError}</code>. 
                Please contact the administrator or verify configuration.
              </p>
            </div>
          </div>
        )}

        {viewMode === "admin" && adminCreds ? (
          /* --- ADMIN VIEW --- */
          <AdminPanel
            adminUsername={adminCreds.username}
            adminPassword={adminCreds.password}
            capsules={capsules}
            onRefresh={fetchData}
            onLogout={handleLogout}
          />
        ) : (
          /* --- PUBLIC VIEW --- */
          <div className="space-y-12">
            {/* Elegant Hero Introduction Banner */}
            <div className="text-center space-y-4 max-w-2xl mx-auto py-6">
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight leading-none">
                Bury messages in the fabric of time.
              </h1>
              <p className="text-sm md:text-base text-slate-400 leading-relaxed font-normal">
                Time Capsule Storage allows individuals to seal digital statements, predictions, and letters that are locked cryptographically on the server until their exact specified unsealing hour.
              </p>
              
              <div className="flex items-center justify-center gap-6 text-xs text-slate-500 pt-1 border-t border-slate-900 w-1/2 mx-auto">
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-600" />
                  Locked: {lockedCapsules.length}
                </span>
                <span className="flex items-center gap-1">
                  <Unlock className="w-3.5 h-3.5 text-slate-600" />
                  Unlocked: {unlockedCapsules.length}
                </span>
              </div>
            </div>

            {/* Locked Capsules Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                <Hourglass className="w-4 h-4 text-amber-500" />
                <h2 className="text-base font-semibold text-slate-200 uppercase tracking-wider">
                  Active Seals Countdown ({lockedCapsules.length})
                </h2>
              </div>

              {lockedCapsules.length === 0 ? (
                <div id="no-locked-capsules" className="bg-slate-900/30 border border-slate-900/60 rounded-2xl py-12 px-4 text-center text-slate-500">
                  <Lock className="w-10 h-10 mx-auto stroke-1 text-slate-700 mb-2.5" />
                  <p className="text-sm">There are no sealed capsules locked in the countdown vault.</p>
                  {!adminCreds && (
                    <p className="text-xs text-slate-600 mt-1">Log in to the administrator panel to seal your very first capsule.</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {lockedCapsules.map((capsule) => (
                    <CapsuleCard
                      key={capsule.id}
                      capsule={capsule}
                      onUnlock={fetchData}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Unlocked / Historic Capsules Section */}
            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                <BookOpen className="w-4 h-4 text-emerald-500" />
                <h2 className="text-base font-semibold text-slate-200 uppercase tracking-wider">
                  Opened Archive History ({unlockedCapsules.length})
                </h2>
              </div>

              {unlockedCapsules.length === 0 ? (
                <div id="no-unlocked-capsules" className="bg-slate-900/30 border border-slate-900/60 rounded-2xl py-12 px-4 text-center text-slate-500">
                  <HelpCircle className="w-10 h-10 mx-auto stroke-1 text-slate-700 mb-2.5" />
                  <p className="text-sm">No capsules have unsealed yet in the archive.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {unlockedCapsules.map((capsule) => (
                    <CapsuleCard
                      key={capsule.id}
                      capsule={capsule}
                      onUnlock={fetchData}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Authentication / Credentials login Modal */}
      {showAuthModal && config && (
        <div id="auth-modal-overlay" className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md animate-[fadeIn_0.2s_ease-out]">
            <AdminSetup
              setupComplete={true}
              onSuccess={handleAdminSuccess}
              onClose={() => setShowAuthModal(false)}
              isLogin={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
