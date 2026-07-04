import { useState } from "react";
import { KeyRound, AlertCircle, CheckCircle2, Eye, EyeOff, User, Lock } from "lucide-react";

interface AdminSetupProps {
  setupComplete: boolean;
  onSuccess: (username: string, password: string) => void;
  onClose?: () => void;
  isLogin?: boolean;
}

export default function AdminSetup({ onSuccess, onClose }: AdminSetupProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Please fill out both Username and Password.");
      return;
    }

    setLoading(true);

    try {
      // Verify login API call
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-username": username,
          "x-admin-password": password
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Invalid Username or Password.");
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess(username, password);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Incorrect credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="admin-login-container" className="max-w-md w-full mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600"></div>
      
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-12 h-12 rounded-full bg-violet-950/50 flex items-center justify-center border border-violet-500/30 mb-3 text-violet-400">
          <KeyRound className="w-6 h-6 animate-pulse" />
        </div>
        <h2 className="text-xl font-semibold text-slate-100">
          Admin Authentication
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Enter your master credentials to access the time capsule manager.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-950/30 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-sm text-red-300">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-start gap-2.5 text-sm text-emerald-300">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
          <span>Authentication successful! Granting access...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username */}
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-slate-500" />
            Username
          </label>
          <input
            id="admin-username-input"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            disabled={loading || success}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-100 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 placeholder-slate-700"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            Password
          </label>
          <div className="relative">
            <input
              id="admin-password-input"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading || success}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-100 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 placeholder-slate-700 font-mono"
            />
            <button
              id="toggle-password-visibility"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-2.5 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          {onClose && (
            <button
              id="cancel-setup-button"
              type="button"
              onClick={onClose}
              disabled={loading || success}
              className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl py-3 font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-slate-700"
            >
              Cancel
            </button>
          )}
          <button
            id="submit-auth-button"
            type="submit"
            disabled={loading || success}
            className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl py-3 font-medium text-sm shadow-lg shadow-violet-950/40 transition-all focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            {loading ? "Authenticating..." : "Login"}
          </button>
        </div>
      </form>
    </div>
  );
}
