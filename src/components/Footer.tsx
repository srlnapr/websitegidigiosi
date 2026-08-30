import Link from 'next/link';
import { MapPin, Mail, Globe, Code2, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#f2f3fd] border-t border-[#c2c6d5]/30 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#c2c6d5]/30">
          
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0058bd] via-[#006e2c] to-[#fbbc06] p-[2px]">
                <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                  <Code2 className="w-4 h-4 text-[#0058bd]" />
                </div>
              </div>
              <span className="font-bold text-lg text-[#191b22]">
                GDG <span className="text-[#0058bd]">on Campus</span>
              </span>
            </div>
            <p className="text-sm text-[#424753] max-w-md leading-relaxed">
              Google Developer Groups (GDG) on Campus Telkom University Purwokerto is a student community group for learning, building real-world solutions, and growing together with Google technologies.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#006e2c] bg-[#86f898]/20 px-3 py-1.5 rounded-full w-fit">
              <span className="w-2 h-2 rounded-full bg-[#006e2c] animate-pulse"></span>
              Official University Community Chapter
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-[#191b22] uppercase tracking-wider">Navigation</h4>
            <ul className="space-y-2 text-sm text-[#424753]">
              <li><Link href="/" className="hover:text-[#0058bd] transition-colors">About GDG</Link></li>
              <li><a href="#events" className="hover:text-[#0058bd] transition-colors">Upcoming Events</a></li>
              <li><a href="#showcase" className="hover:text-[#0058bd] transition-colors">Project Showcase</a></li>
              <li><Link href="/dashboard" className="hover:text-[#0058bd] transition-colors">Member Dashboard</Link></li>
              <li><Link href="/auth" className="hover:text-[#0058bd] transition-colors">Student Login</Link></li>
            </ul>
          </div>

          {/* Location & Contact */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-[#191b22] uppercase tracking-wider">Campus Secretariat</h4>
            <div className="space-y-3 text-xs text-[#424753]">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#0058bd] shrink-0 mt-0.5" />
                <span>
                  Jl. D.I. Panjaitan No.128, Karangreja, Purwokerto Kidul, Kec. Purwokerto Sel., Kabupaten Banyumas, Jawa Tengah 53147
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#006e2c] shrink-0" />
                <a href="mailto:hello@gdgpurwokerto.com" className="hover:underline">hello@gdgpurwokerto.com</a>
              </div>
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-[#fbbc06] shrink-0" />
                <span>purwokerto.dev / gdg</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#424753]">
          <p>© 2026 GDG on Campus Telkom University Purwokerto. Built for the developer community.</p>
          <div className="flex items-center gap-1">
            <span>Designed with Google Material You aesthetics &</span>
            <Heart className="w-3.5 h-3.5 text-[#ba1a1a] fill-[#ba1a1a]" />
          </div>
        </div>
      </div>
    </footer>
  );
}
