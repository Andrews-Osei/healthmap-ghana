"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity, ArrowRight, Eye, EyeOff, Lock, ShieldCheck, Sparkles,
  AlertCircle, Loader2, User as UserIcon,
} from "lucide-react";
import { login } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await login(username.trim(), password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message ?? "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen relative grid lg:grid-cols-2 overflow-hidden">

      {/* LEFT — BRANDING */}
      <aside className="relative hidden lg:flex flex-col justify-between p-10
                        bg-gradient-to-br from-ink-950 via-ink-900 to-ink-800
                        overflow-hidden border-r border-white/5">

        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                          w-[700px] h-[700px] rounded-full
                          bg-gradient-to-br from-cyan-400/15 via-cyan-300/10 to-med-500/10
                          blur-3xl animate-pulse"
               style={{ animationDuration: "8s" }}/>
          <svg viewBox="0 0 400 600" className="absolute inset-0 w-full h-full opacity-30">
            {Array.from({ length: 40 }).map((_, i) => {
              const x = 30 + ((i * 53) % 340);
              const y = 30 + ((i * 79) % 540);
              const dur = 2 + (i % 4);
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="2.4" fill="#22d3ee"/>
                  <circle cx={x} cy={y} r="6" fill="none"
                          stroke="#22d3ee" strokeOpacity=".6">
                    <animate attributeName="r" values="3;12;3"
                             dur={`${dur}s`} repeatCount="indefinite"/>
                    <animate attributeName="stroke-opacity" values=".6;0;.6"
                             dur={`${dur}s`} repeatCount="indefinite"/>
                  </circle>
                </g>
              );
            })}
            <line x1="0" y1="300" x2="400" y2="300"
                  stroke="#22d3ee" strokeOpacity=".25" strokeWidth="1.2">
              <animate attributeName="y1" values="0;600;0" dur="9s" repeatCount="indefinite"/>
              <animate attributeName="y2" values="0;600;0" dur="9s" repeatCount="indefinite"/>
            </line>
          </svg>
        </div>

        <Link href="/" className="flex items-center gap-3 group relative z-10">
          <span className="grid place-items-center w-11 h-11 rounded-2xl
                           bg-gradient-to-br from-cyan-400 to-med-500
                           shadow-glow group-hover:scale-105 transition">
            <Activity className="w-5 h-5 text-ink-950" strokeWidth={2.5}/>
          </span>
          <div>
            <div className="text-base font-semibold leading-tight">
              HealthMap <span className="gradient-text">Ghana</span>
            </div>
            <div className="text-[11px] text-slate-400">
              National healthcare-access intelligence
            </div>
          </div>
        </Link>

        <div className="max-w-md relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}>
            <span className="pill mb-4">
              <Sparkles className="w-3.5 h-3.5"/> Secure analyst portal
            </span>
            <h1 className="mt-4 text-4xl font-bold leading-tight">
              Sign in to <span className="gradient-text">HealthMap Ghana</span>
            </h1>
            <p className="mt-4 text-slate-300 leading-relaxed">
              Access live vulnerability scores for 260 districts, AI-generated
              policy recommendations, and demand forecasts for every region
              of Ghana.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-med-400 mt-0.5"/>
                JWT-secured API . role-based access (analyst / admin)
              </li>
              <li className="flex items-start gap-3">
                <Lock className="w-4 h-4 text-cyan-300 mt-0.5"/>
                Bcrypt-hashed passwords . no plain-text storage
              </li>
              <li className="flex items-start gap-3">
                <Activity className="w-4 h-4 text-cyan-300 mt-0.5"/>
                Audited datasets . OSM, Ghana Census, geoBoundaries
              </li>
            </ul>
          </motion.div>
        </div>

        <div className="text-xs text-slate-500 relative z-10">
          Built for the Ghana AI Innovation Challenge 2026
        </div>
      </aside>

      {/* RIGHT — FORM */}
      <section className="flex items-center justify-center p-6 sm:p-10 bg-app">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md">

          <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
            <span className="grid place-items-center w-9 h-9 rounded-xl
                             bg-gradient-to-br from-cyan-400 to-med-500">
              <Activity className="w-4 h-4 text-ink-950" strokeWidth={2.5}/>
            </span>
            <span className="font-semibold">
              HealthMap <span className="gradient-text">Ghana</span>
            </span>
          </Link>

          <div className="glass-strong p-8 sm:p-10">
            <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="mt-1.5 text-sm text-slate-400">
              Enter your credentials to access the dashboard.
            </p>

            {error && (
              <div className="mt-5 flex items-start gap-2 p-3 rounded-lg
                              bg-red-500/10 border border-red-500/30
                              text-sm text-red-300">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0"/>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-[11px] uppercase tracking-wide text-slate-400">
                  Username
                </span>
                <div className="relative mt-1">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3
                                       top-1/2 -translate-y-1/2"/>
                  <input value={username}
                         onChange={e => setUsername(e.target.value)}
                         autoComplete="username" required
                         placeholder="Your username"
                         className="w-full pl-10 pr-3 py-2.5 rounded-lg
                                    bg-ink-900/80 border border-white/10
                                    focus:outline-none focus:border-cyan-400
                                    text-sm text-white placeholder-slate-600"/>
                </div>
              </label>

              <label className="block">
                <span className="text-[11px] uppercase tracking-wide text-slate-400">
                  Password
                </span>
                <div className="relative mt-1">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3
                                   top-1/2 -translate-y-1/2"/>
                  <input value={password}
                         onChange={e => setPassword(e.target.value)}
                         type={showPw ? "text" : "password"}
                         autoComplete="current-password" required
                         placeholder="..."
                         className="w-full pl-10 pr-10 py-2.5 rounded-lg
                                    bg-ink-900/80 border border-white/10
                                    focus:outline-none focus:border-cyan-400
                                    text-sm text-white placeholder-slate-600"/>
                  <button type="button"
                          onClick={() => setShowPw(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2
                                     text-slate-500 hover:text-cyan-300">
                    {showPw ? <EyeOff className="w-4 h-4"/>
                            : <Eye    className="w-4 h-4"/>}
                  </button>
                </div>
              </label>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-cyan-400"/>
                  Remember this device
                </label>
                <a href="#" className="text-cyan-300 hover:underline">
                  Forgot password?
                </a>
              </div>

              <button type="submit" disabled={loading}
                      className="btn-primary w-full disabled:opacity-60
                                 disabled:cursor-not-allowed">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin"/>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in <ArrowRight className="w-4 h-4"/>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10
                            flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-med-400"/>
              Authorised personnel only. Contact your administrator for access.
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            By signing in you agree to our{" "}
            <a className="text-cyan-300 hover:underline" href="#">Terms</a>{" "}
            and{" "}
            <a className="text-cyan-300 hover:underline" href="#">Privacy Policy</a>.
          </p>
        </motion.div>
      </section>
    </main>
  );
}
