'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { Code2, LogIn } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { profile, loading } = useAuth();

  return (
    <header className="fixed top-0 w-full z-50 bg-[#ffffff]/85 backdrop-blur-xl border-b border-[#c2c6d5]/20 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-16 max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0058bd] via-[#006e2c] to-[#fbbc06] p-[2px] shadow-sm transition-transform group-hover:scale-105">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
              <Code2 className="w-5 h-5 text-[#0058bd]" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-[#191b22] leading-tight tracking-tight">
              GDG <span className="text-[#0058bd]">on Campus</span>
            </span>
            <span className="text-[10px] font-semibold tracking-wider text-[#424753] uppercase">
              Telkom Purwokerto
            </span>
          </div>
        </Link>

        {/* Public Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors hover:text-[#0058bd] ${
              pathname === '/' ? 'text-[#0058bd] font-bold' : 'text-[#424753]'
            }`}
          >
            About
          </Link>
          <a
            href="#events"
            className="text-sm font-medium text-[#424753] hover:text-[#0058bd] transition-colors"
          >
            Events
          </a>
          <a
            href="#showcase"
            className="text-sm font-medium text-[#424753] hover:text-[#0058bd] transition-colors"
          >
            Showcase
          </a>
          <a
            href="#community"
            className="text-sm font-medium text-[#424753] hover:text-[#0058bd] transition-colors"
          >
            Community
          </a>
          {profile?.role === 'admin' ? (
            <Link
              href="/admin"
              className={`text-sm font-medium transition-colors hover:text-[#0058bd] ${
                pathname.startsWith('/admin') ? 'text-[#0058bd] font-bold' : 'text-[#424753]'
              }`}
            >
              Admin Dashboard
            </Link>
          ) : profile ? (
            <Link
              href="/dashboard"
              className={`text-sm font-medium transition-colors hover:text-[#0058bd] ${
                pathname.startsWith('/dashboard') ? 'text-[#0058bd] font-bold' : 'text-[#424753]'
              }`}
            >
              Dashboard
            </Link>
          ) : null}
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-20 h-9 bg-[#e1e2eb] rounded-xl animate-pulse" />
          ) : pathname === '/auth' ? (
            <Link
              href="/"
              className="px-4 py-2 bg-[#0058bd] text-white rounded-xl text-sm font-semibold hover:bg-[#2771df] transition-all shadow-md"
            >
              Public Home
            </Link>
          ) : profile?.role === 'admin' ? (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0058bd] text-white rounded-xl text-sm font-semibold hover:bg-[#2771df] transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              <span>Admin Panel</span>
            </Link>
          ) : profile ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0058bd] text-white rounded-xl text-sm font-semibold hover:bg-[#2771df] transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              <span>Dashboard</span>
            </Link>
          ) : (
            <Link
              href="/auth"
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0058bd] text-white rounded-xl text-sm font-semibold hover:bg-[#2771df] transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
