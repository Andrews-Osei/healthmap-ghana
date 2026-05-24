"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/lib/auth";
import { adminApi, type AdminUser } from "@/lib/api";
import {
  ShieldCheck, UserPlus, Trash2, Power, Loader2, AlertCircle, Lock,
  CheckCircle2, Users,
} from "lucide-react";

export default function AdminPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const isAdmin = user?.role === "admin";

  if (!mounted) return <><Navbar/><Shell><Loading/></Shell></>;

  if (!isAdmin) {
    return (
      <>
        <Navbar/>
        <Shell>
          <div className="glass-strong p-8 text-center max-w-md mx-auto">
            <div className="grid place-items-center w-14 h-14 rounded-2xl mx-auto mb-4
                            bg-gradient-to-br from-cyan-400/20 to-med-500/20
                            border border-cyan-500/20">
              <Lock className="w-6 h-6 text-cyan-300"/>
            </div>
            <h2 className="text-lg font-semibold">Administrator access required</h2>
            <p className="text-sm text-slate-400 mt-2">
              This area is for administrators only. Sign in with an admin account
              to manage who can access HealthMap Ghana.
            </p>
            <Link href="/login" className="btn-primary text-sm mt-5 inline-flex">
              Sign in
            </Link>
          </div>
        </Shell>
      </>
    );
  }

  return <><Navbar/><Shell><AdminConsole me={user!.username}/></Shell></>;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {children}
    </main>
  );
}
function Loading() {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-400">
      <Loader2 className="w-4 h-4 animate-spin"/> Loading…
    </div>
  );
}

function AdminConsole({ me }: { me: string }) {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [err, setErr]     = useState<string | null>(null);
  const [msg, setMsg]     = useState<string | null>(null);
  const [busy, setBusy]   = useState(false);

  // create form
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [role, setRole] = useState("analyst");

  async function refresh() {
    setErr(null);
    try { setUsers(await adminApi.listUsers()); }
    catch (e: any) { setErr(e?.message ?? String(e)); }
  }
  useEffect(() => { refresh(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null); setMsg(null);
    try {
      await adminApi.createUser({ username: u.trim(), password: p, role });
      setMsg(`Account "${u.trim()}" created.`);
      setU(""); setP(""); setRole("analyst");
      await refresh();
    } catch (e: any) { setErr(e?.message ?? String(e)); }
    finally { setBusy(false); }
  }

  async function toggleActive(t: AdminUser) {
    setErr(null); setMsg(null);
    try { await adminApi.updateUser(t.username, { active: !t.active }); await refresh(); }
    catch (e: any) { setErr(e?.message ?? String(e)); }
  }
  async function changeRole(t: AdminUser, newRole: string) {
    setErr(null); setMsg(null);
    try { await adminApi.updateUser(t.username, { role: newRole }); await refresh(); }
    catch (e: any) { setErr(e?.message ?? String(e)); }
  }
  async function remove(t: AdminUser) {
    if (!confirm(`Delete account "${t.username}"? This cannot be undone.`)) return;
    setErr(null); setMsg(null);
    try { await adminApi.deleteUser(t.username); await refresh(); }
    catch (e: any) { setErr(e?.message ?? String(e)); }
  }

  return (
    <>
      <div className="flex items-start gap-4">
        <div className="grid place-items-center w-12 h-12 rounded-2xl shrink-0
                        bg-gradient-to-br from-cyan-400 to-med-500 shadow-glow">
          <ShieldCheck className="w-6 h-6 text-ink-950" strokeWidth={2.5}/>
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            User <span className="gradient-text">access</span>
          </h1>
          <p className="text-slate-400 mt-1 text-sm max-w-2xl">
            Only administrators can grant access. Create accounts for health
            officials and analysts, set their role, and disable access at any time.
          </p>
        </div>
      </div>

      {/* Create account */}
      <form onSubmit={create} className="glass-strong p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <UserPlus className="w-4 h-4 text-cyan-300"/> Grant new access
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="block">
            <span className="text-[11px] uppercase tracking-wide text-slate-400">Username</span>
            <input value={u} onChange={e => setU(e.target.value)} required
                   placeholder="e.g. j.mensah"
                   className="mt-1 w-full px-3 py-2.5 rounded-lg bg-ink-900/80
                              border border-white/10 text-sm focus:outline-none
                              focus:border-cyan-400 placeholder-slate-600"/>
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-wide text-slate-400">Temp password</span>
            <input value={p} onChange={e => setP(e.target.value)} required minLength={4}
                   type="text" placeholder="min 4 characters"
                   className="mt-1 w-full px-3 py-2.5 rounded-lg bg-ink-900/80
                              border border-white/10 text-sm focus:outline-none
                              focus:border-cyan-400 placeholder-slate-600"/>
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-wide text-slate-400">Role</span>
            <select value={role} onChange={e => setRole(e.target.value)}
                    className="mt-1 w-full px-3 py-2.5 rounded-lg bg-ink-900/80
                               border border-white/10 text-sm focus:outline-none
                               focus:border-cyan-400">
              <option value="analyst">Analyst (view dashboard)</option>
              <option value="admin">Admin (full + manage users)</option>
            </select>
          </label>
        </div>
        <button type="submit" disabled={busy}
                className="btn-primary text-sm disabled:opacity-60">
          {busy ? <><Loader2 className="w-4 h-4 animate-spin"/> Creating…</>
                : <><UserPlus className="w-4 h-4"/> Create account</>}
        </button>
      </form>

      {msg && (
        <div className="glass p-3 flex items-center gap-2 text-emerald-300 text-sm">
          <CheckCircle2 className="w-4 h-4"/> {msg}
        </div>
      )}
      {err && (
        <div className="glass p-3 flex items-start gap-2 text-amber-300 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5"/> {err}
        </div>
      )}

      {/* User list */}
      <div className="glass p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
          <Users className="w-4 h-4 text-cyan-300"/> Accounts
          {users && <span className="text-xs text-slate-500">· {users.length}</span>}
        </div>
        {!users && !err && <Loading/>}
        {users && (
          <div className="divide-y divide-white/5">
            {users.map(t => {
              const isMe = t.username.toLowerCase() === me.toLowerCase();
              return (
                <div key={t.username}
                     className="py-3 flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium flex items-center gap-2">
                      {t.username}
                      {isMe && <span className="text-[10px] text-cyan-300">(you)</span>}
                      {!t.active && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded
                                         bg-slate-500/20 text-slate-400">disabled</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      added by {t.created_by ?? "—"}
                    </div>
                  </div>

                  <select value={t.role}
                          onChange={e => changeRole(t, e.target.value)}
                          disabled={isMe}
                          className="px-2 py-1.5 rounded-md text-xs bg-ink-900/80
                                     border border-white/10 focus:outline-none
                                     focus:border-cyan-400 disabled:opacity-50">
                    <option value="analyst">Analyst</option>
                    <option value="admin">Admin</option>
                  </select>

                  <button onClick={() => toggleActive(t)} disabled={isMe}
                          title={t.active ? "Disable access" : "Enable access"}
                          className="text-xs flex items-center gap-1 px-2 py-1.5 rounded-md
                                     border border-white/10 hover:border-cyan-500/40
                                     disabled:opacity-40 transition-colors">
                    <Power className="w-3.5 h-3.5"/>
                    {t.active ? "Disable" : "Enable"}
                  </button>

                  <button onClick={() => remove(t)} disabled={isMe}
                          title="Delete account"
                          className="text-xs flex items-center gap-1 px-2 py-1.5 rounded-md
                                     border border-white/10 hover:border-red-500/40
                                     text-red-300 disabled:opacity-40 transition-colors">
                    <Trash2 className="w-3.5 h-3.5"/> Delete
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
