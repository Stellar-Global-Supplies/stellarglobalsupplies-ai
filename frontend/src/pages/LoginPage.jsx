import { useState } from "react";
import { useAuthStore } from "../lib/store.js";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full bg-surface flex flex-col items-center justify-center px-4">
      {/* Background gradient blobs — Stellar teal */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gem-blue/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gem-purple/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-surface-1 border border-border flex items-center justify-center mb-5 shadow-xl">
            <StellarIcon size={34} />
          </div>
          <h1 className="text-3xl font-medium text-text-primary tracking-tight">
            Sign in
          </h1>
          <p className="mt-2 text-text-secondary text-sm">
            to continue to <span className="gem-gradient font-medium">Stellar AI</span>
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface-1 border border-border rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="you@stellarglobalsupplies.com"
                className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3
                           text-text-primary placeholder-text-disabled text-sm
                           focus:outline-none focus:border-gem-blue focus:ring-1 focus:ring-gem-blue
                           transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3
                           text-text-primary placeholder-text-disabled text-sm
                           focus:outline-none focus:border-gem-blue focus:ring-1 focus:ring-gem-blue
                           transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-medium text-sm
                         bg-gem-accent hover:bg-gem-accent/90
                         text-white transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-text-disabled mt-6">
          Access is managed by your administrator
        </p>
      </div>
    </div>
  );
}

export function StellarIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="sg-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00B98E" />
          <stop offset="100%" stopColor="#00d4a4" />
        </linearGradient>
      </defs>
      {/* Five-pointed star — Stellar */}
      <path
        d="M20 4
           L22.9 14.6 L34 14.6
           L25.5 21.4 L28.5 32
           L20 25.2 L11.5 32
           L14.5 21.4 L6 14.6
           L17.1 14.6 Z"
        fill="url(#sg-grad)"
      />
    </svg>
  );
}
