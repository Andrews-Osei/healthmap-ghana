"use client";
import Link from "next/link";
import { Activity, Stethoscope, LogIn, LogOut, Menu, X, User as UserIcon, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

const links = [
  { href: "/#features",     label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/dashboard",     label: "Dashboard" },
  { href: "/assistant",     label: "Triage Assistant", icon: Stethoscope },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navLinks = (isAuthenticated && user?.role === "admin")
    ? [...links, { href: "/admin", label: "Admin", icon: ShieldCheck }]
    : links;

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-ink-950/60
                       border-b border-white/10">
      <nav className="max-w-7xl mx-auto px-5 sm:px-8 py-3 flex items-center
                      justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="grid place-items-center w-9 h-9 rounded-xl
                           bg-gradient-to-br from-cyan-400 to-med-500
                           shadow-glow transition-transform group-hover:scale-105">
            <Activity className="w-5 h-5 text-ink-950" strokeWidth={2.5}/>
          </span>
          <span className="font-semibold text-lg tracking-tight">
            HealthMap <span className="gradient-text">Ghana</span>
          </span>
        </Link>

        <ul className="hidden md:flex items-center gap-7 text-sm text-slate-300">
          {navLinks.map(l => {
            const Icon = (l as any).icon;
            return (
              <li key={l.href}>
                <Link href={l.href}
                      className="hover:text-cyan-300 transition-colors
                                 flex items-center gap-1.5">
                  {Icon && <Icon className="w-3.5 h-3.5 text-cyan-300"/>}
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="flex items-center gap-2 text-xs text-slate-300
                               px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                <UserIcon className="w-3.5 h-3.5 text-cyan-300"/>
                {user!.username}
                <span className="text-[10px] text-slate-500 uppercase">
                  {user!.role}
                </span>
              </span>
              <button onClick={logout} className="btn-ghost text-sm">
                <LogOut className="w-4 h-4"/> Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost text-sm">
                <LogIn className="w-4 h-4"/> Sign in
              </Link>
              <Link href="/dashboard" className="btn-primary text-sm">
                Open dashboard
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden text-slate-300"
                onClick={() => setOpen(v => !v)} aria-label="Toggle menu">
          {open ? <X/> : <Menu/>}
        </button>
      </nav>

      {open && (
        <ul className="md:hidden border-t border-white/10 px-5 py-4 space-y-3
                       bg-ink-950/90">
          {navLinks.map(l => (
            <li key={l.href}>
              <Link href={l.href} onClick={() => setOpen(false)}
                    className="block py-2 text-slate-200 hover:text-cyan-300">
                {l.label}
              </Link>
            </li>
          ))}
          {isAuthenticated ? (
            <>
              <li className="text-xs text-slate-400 pt-2 border-t border-white/10">
                Signed in as <b className="text-cyan-300">{user!.username}</b>
                <span className="ml-2 text-[10px] uppercase text-slate-500">
                  {user!.role}
                </span>
              </li>
              <li>
                <button onClick={() => { logout(); setOpen(false); }}
                        className="btn-ghost w-full text-sm">
                  <LogOut className="w-4 h-4"/> Sign out
                </button>
              </li>
            </>
          ) : (
            <>
              <li><Link href="/login" onClick={() => setOpen(false)}
                        className="btn-ghost w-full text-sm">
                <LogIn className="w-4 h-4"/> Sign in
              </Link></li>
              <li><Link href="/dashboard" onClick={() => setOpen(false)}
                        className="btn-primary w-full text-sm">
                Open dashboard
              </Link></li>
            </>
          )}
        </ul>
      )}
    </header>
  );
}
