'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/AuthContext';
import { UserRole } from '@/types';
import { 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  Eye,
  EyeOff,
  AlertCircle,
  IdCard,
  UserCheck,
  Rocket,
  Globe,
  Award,
  CheckCircle2
} from 'lucide-react';

type AuthMode = 'login' | 'register';

export default function AuthPage() {
  const router = useRouter();
  const { loginWithEmail, registerWithEmail, loginWithGoogle, profile, loading: authLoading } = useAuth();

  const [authMode, setAuthMode] = useState<AuthMode>('login');
  
  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regStudentId, setRegStudentId] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('member');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // UI Feedback States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // If already logged in, redirect directly according to role
  useEffect(() => {
    if (profile && !authLoading) {
      router.replace(profile.role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [profile, authLoading, router]);

  const handleSwitchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!loginEmail || !loginPassword) {
      setErrorMsg('Harap isi email dan kata sandi Anda.');
      return;
    }

    setLoading(true);
    const res = await loginWithEmail(loginEmail, loginPassword);
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Berhasil masuk! Mengalihkan ke dashboard...');
      // AuthContext will update profile and trigger the useEffect redirect
    } else {
      setErrorMsg(res.error || 'Email atau kata sandi salah.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regName || !regEmail || !regPassword) {
      setErrorMsg('Harap lengkapi semua kolom wajib (*).');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok dengan kata sandi.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter.');
      return;
    }

    if (!agreeTerms) {
      setErrorMsg('Anda harus menyetujui Syarat dan Ketentuan GDG Telkom.');
      return;
    }

    setLoading(true);
    const res = await registerWithEmail(regName, regEmail, regPassword, regStudentId, regRole);
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Akun berhasil dibuat! Mengalihkan...');
      setTimeout(() => {
        router.replace(regRole === 'admin' ? '/admin' : '/dashboard');
      }, 800);
    } else {
      setErrorMsg(res.error || 'Gagal mendaftarkan akun.');
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setErrorMsg(null);
    const res = await loginWithGoogle();
    setLoading(false);
    if (res.success) {
      setSuccessMsg('Berhasil masuk dengan Google!');
      // AuthContext will update profile and trigger the useEffect redirect
    } else {
      setErrorMsg(res.error || 'Login Google gagal.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#191b22] flex flex-col font-product">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 flex items-center justify-center px-4 md:px-8">
        
        {/* LANDSCAPE 2-COLUMN WEB LAYOUT CARD */}
        <div className="max-w-6xl w-full bg-white rounded-[32px] shadow-2xl border border-[#c2c6d5]/30 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px] animate-fade-in-up">
          
          {/* LEFT COLUMN: LANDSCAPE SHOWCASE & BRAND HERO */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#0f172a] via-[#0058bd] to-[#004494] text-white p-8 md:p-10 flex flex-col justify-between relative overflow-hidden">
            
            {/* Background Glow Orbs */}
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#fbbc06]/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-[#006e2c]/30 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 space-y-6">
              {/* Brand Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-white">
                <div className="w-2 h-2 rounded-full bg-[#fbbc06] animate-pulse"></div>
                <span>GDG on Campus • Telkom University</span>
              </div>

              {/* Title & Description */}
              <div className="space-y-3">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-white">
                  Build the Future with Google Developer Technologies.
                </h1>
                <p className="text-sm text-white/80 leading-relaxed">
                  Join Purwokerto&apos;s premier campus developer community. Team up, innovate, and compete in the global Google Solution Challenge 2026.
                </p>
              </div>

              {/* Feature Highlights List */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                    <Rocket className="w-4 h-4 text-[#86f898]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">1-User 1-Team System</h4>
                    <p className="text-[11px] text-white/70">Seamless workspace management for solution challenges.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                    <Globe className="w-4 h-4 text-[#adc6ff]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Google Tech Tracks</h4>
                    <p className="text-[11px] text-white/70">Web, Mobile, AI/ML, Cloud & UI/UX specialization.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                    <Award className="w-4 h-4 text-[#ffdea0]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Global Solution Challenge 2026</h4>
                    <p className="text-[11px] text-white/70">Win mentorship & prizes directly from Google Experts.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>


          {/* RIGHT COLUMN: AUTHENTICATION FORM (LOGIN / REGISTER) */}
          <div className="lg:col-span-7 p-8 md:p-12 flex flex-col justify-center space-y-6 bg-white">
            
            {/* Header & Tabs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-[#191b22]">
                    {authMode === 'login' ? 'Selamat Datang Kembali' : 'Buat Akun GDG Baru'}
                  </h2>
                  <p className="text-xs text-[#424753] mt-1">
                    {authMode === 'login' 
                      ? 'Masukkan kredensial Anda untuk mengakses dashboard tim.' 
                      : 'Daftar dengan email Telkom University untuk mulai kolaborasi.'}
                  </p>
                </div>

                <div className="hidden sm:block">
                  <span className="text-xs text-[#727785]">
                    {authMode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}
                  </span>
                  <button
                    onClick={() => handleSwitchMode(authMode === 'login' ? 'register' : 'login')}
                    className="ml-2 text-xs font-bold text-[#0058bd] hover:underline"
                  >
                    {authMode === 'login' ? 'Daftar' : 'Masuk'}
                  </button>
                </div>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="flex bg-[#f2f3fd] p-1 rounded-2xl border border-[#c2c6d5]/30">
                <button
                  onClick={() => handleSwitchMode('login')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    authMode === 'login'
                      ? 'bg-white text-[#0058bd] shadow-sm'
                      : 'text-[#424753] hover:text-[#191b22]'
                  }`}
                >
                  Masuk (Login)
                </button>
                <button
                  onClick={() => handleSwitchMode('register')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    authMode === 'register'
                      ? 'bg-white text-[#0058bd] shadow-sm'
                      : 'text-[#424753] hover:text-[#191b22]'
                  }`}
                >
                  Daftar (Register)
                </button>
              </div>
            </div>

            {/* Error / Success Feedback Banners */}
            {errorMsg && (
              <div className="bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#93000a] p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between animate-fade-in-up">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#ba1a1a] shrink-0" />
                  <span>{errorMsg}</span>
                </div>
                <button onClick={() => setErrorMsg(null)} className="text-[#93000a] font-bold">×</button>
              </div>
            )}

            {successMsg && (
              <div className="bg-[#86f898]/30 border border-[#00722f]/30 text-[#00722f] p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in-up">
                <UserCheck className="w-4 h-4 text-[#00722f] shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full py-3.5 px-4 bg-white border border-[#c2c6d5] hover:border-[#0058bd] rounded-2xl font-bold text-xs text-[#191b22] hover:bg-[#f2f3fd] transition-all flex items-center justify-center gap-3 shadow-xs hover:shadow-md disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{loading ? 'Memproses...' : `${authMode === 'login' ? 'Masuk' : 'Daftar'} dengan Google SSO`}</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-[#c2c6d5]/40 w-full"></div>
              <span className="bg-white px-3 text-[10px] uppercase font-bold text-[#727785]">Atau Email Telkom</span>
            </div>

            {/* FORM LOGIN */}
            {authMode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#191b22] mb-1">
                    Email Mahasiswa / Akun GDG
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="nama@student.telkomuniversity.ac.id"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#f9f9ff] border border-[#c2c6d5]/60 rounded-xl text-xs focus:border-[#0058bd] focus:outline-none"
                    />
                    <Mail className="w-4 h-4 text-[#727785] absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#191b22] mb-1">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 bg-[#f9f9ff] border border-[#c2c6d5]/60 rounded-xl text-xs focus:border-[#0058bd] focus:outline-none"
                    />
                    <Lock className="w-4 h-4 text-[#727785] absolute left-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3.5 top-3.5 text-[#727785] hover:text-[#191b22]"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-[#424753]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-[#c2c6d5] text-[#0058bd] focus:ring-0"
                    />
                    <span>Ingat saya</span>
                  </label>
                  <a href="#" className="text-[#0058bd] font-semibold hover:underline">
                    Lupa kata sandi?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#0058bd] text-white rounded-xl font-bold text-xs hover:bg-[#2771df] transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <span>{loading ? 'Memverifikasi...' : 'Masuk Sekarang'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              
              /* FORM REGISTER */
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#191b22] mb-1">
                    Nama Lengkap *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Ikhsan Setiawan"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#f9f9ff] border border-[#c2c6d5]/60 rounded-xl text-xs focus:border-[#0058bd] focus:outline-none"
                    />
                    <UserIcon className="w-4 h-4 text-[#727785] absolute left-3.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#191b22] mb-1">
                    Email Mahasiswa Telkom *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="student@student.telkomuniversity.ac.id"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#f9f9ff] border border-[#c2c6d5]/60 rounded-xl text-xs focus:border-[#0058bd] focus:outline-none"
                    />
                    <Mail className="w-4 h-4 text-[#727785] absolute left-3.5 top-3" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#191b22] mb-1">
                      NIM / Student ID (Opsional)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="1203220000"
                        value={regStudentId}
                        onChange={(e) => setRegStudentId(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#f9f9ff] border border-[#c2c6d5]/60 rounded-xl text-xs focus:border-[#0058bd] focus:outline-none font-mono"
                      />
                      <IdCard className="w-4 h-4 text-[#727785] absolute left-3.5 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#191b22] mb-1">
                      Role Pendaftaran
                    </label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2.5 bg-[#f9f9ff] border border-[#c2c6d5]/60 rounded-xl text-xs focus:border-[#0058bd] focus:outline-none"
                    >
                      <option value="member">Member / Developer</option>
                      <option value="admin">Lead Admin</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#191b22] mb-1">
                      Kata Sandi *
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        placeholder="Min. 6 karakter"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 bg-[#f9f9ff] border border-[#c2c6d5]/60 rounded-xl text-xs focus:border-[#0058bd] focus:outline-none"
                      />
                      <Lock className="w-4 h-4 text-[#727785] absolute left-3.5 top-3" />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3 top-3 text-[#727785] hover:text-[#191b22]"
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#191b22] mb-1">
                      Konfirmasi Sandi *
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        placeholder="Ulangi sandi"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 bg-[#f9f9ff] border border-[#c2c6d5]/60 rounded-xl text-xs focus:border-[#0058bd] focus:outline-none"
                      />
                      <Lock className="w-4 h-4 text-[#727785] absolute left-3.5 top-3" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 text-xs">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="rounded border-[#c2c6d5] text-[#0058bd] focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-[#424753] cursor-pointer">
                    Saya menyetujui <span className="text-[#0058bd] font-semibold">Syarat & Ketentuan</span> GDG Telkom
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#006e2c] text-white rounded-xl font-bold text-xs hover:bg-[#00722f] transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 mt-2"
                >
                  <span>{loading ? 'Mendaftarkan Akun...' : 'Daftar Akun Baru'}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </form>
            )}

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
