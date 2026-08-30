'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BentoGrid from '@/components/BentoGrid';
import { MapPin, Users, UserPlus, LayoutDashboard, Bell, Terminal, CheckCircle, Mail, Map, Sparkles, Send } from 'lucide-react';

export default function LandingPage() {
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [subscribedEmail, setSubscribedEmail] = useState('');
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);

  const handleSubscribeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subscribedEmail) {
      setSubscribeSuccess(true);
      setTimeout(() => {
        setSubscribeSuccess(false);
        setShowSubscribeModal(false);
        setSubscribedEmail('');
      }, 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#191b22] flex flex-col font-product">
      <Navbar />

      <main className="flex-1 pt-16">
        
        {/* ================= HERO SECTION ================= */}
        <section className="relative pt-12 pb-24 px-4 md:px-8 max-w-7xl mx-auto w-full flex flex-col items-center text-center overflow-hidden">
          
          {/* Background Decorative Gradient Orbs */}
          <div className="absolute top-10 left-1/4 w-72 h-72 bg-[#0058bd]/15 rounded-full blur-[90px] pointer-events-none"></div>
          <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-[#006e2c]/15 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-[#fbbc06]/20 rounded-full blur-[130px] pointer-events-none"></div>

          <div className="relative z-10 flex flex-col items-center max-w-4xl space-y-6">
            
            {/* Location Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-md rounded-full shadow-xs border border-[#c2c6d5]/40 animate-fade-in-up">
              <MapPin className="w-4 h-4 text-[#0058bd] fill-[#0058bd]/20" />
              <span className="font-mono text-xs font-semibold text-[#424753] uppercase tracking-wider">
                Purwokerto, Indonesia
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#191b22] tracking-tight leading-[1.15] animate-fade-in-up">
              Google Developer Groups <br />
              <span className="bg-gradient-to-r from-[#0058bd] via-[#006e2c] to-[#fbbc06] bg-clip-text text-transparent">
                on Campus
              </span> <br />
              Telkom University Purwokerto
            </h1>

            {/* Metric Pill */}
            <div className="flex flex-col sm:flex-row items-center gap-3 bg-white px-5 py-2.5 rounded-full shadow-sm border border-[#c2c6d5]/30 animate-fade-in-up">
              <div className="flex -space-x-2.5">
                <img
                  className="w-8 h-8 rounded-full border-2 border-white object-cover"
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt="Member Avatar 1"
                />
                <img
                  className="w-8 h-8 rounded-full border-2 border-white object-cover"
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80"
                  alt="Member Avatar 2"
                />
                <img
                  className="w-8 h-8 rounded-full border-2 border-white object-cover"
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                  alt="Member Avatar 3"
                />
                <div className="w-8 h-8 rounded-full bg-[#0058bd] text-white flex items-center justify-center font-bold text-xs border-2 border-white">
                  +
                </div>
              </div>
              <div className="text-sm font-semibold text-[#191b22]">
                <span className="font-extrabold text-[#0058bd]">3,694</span>{' '}
                <span className="text-[#424753]">Registered Members</span>
              </div>
            </div>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2 animate-fade-in-up">
              <Link
                href="/auth"
                className="px-8 py-4 bg-[#0058bd] text-white rounded-2xl font-bold text-base shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group"
              >
                <span>Join us</span>
                <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </Link>
              <Link
                href="/dashboard"
                className="px-8 py-4 bg-white border-2 border-[#0058bd] text-[#0058bd] rounded-2xl font-bold text-base hover:bg-[#0058bd]/5 transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Explore Dashboard</span>
                <LayoutDashboard className="w-5 h-5" />
              </Link>
            </div>

          </div>

          {/* Hero Tech Banner Graphics */}
          <div className="w-full max-w-5xl mt-16 h-[320px] md:h-[420px] relative rounded-[32px] overflow-hidden shadow-2xl border border-[#c2c6d5]/30 group">
            <div
              className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-1000"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80')`,
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#191b22]/90 via-[#191b22]/40 to-transparent flex items-end p-8 md:p-12 text-left">
              <div className="max-w-2xl text-white space-y-2">
                <span className="px-3 py-1 bg-[#0058bd] text-white font-mono text-xs font-bold rounded-md uppercase">
                  Community Hub
                </span>
                <h3 className="text-2xl md:text-3xl font-extrabold">Empowering Telkom University Purwokerto Developers</h3>
                <p className="text-sm text-white/80">Building solution challenges, cloud study jams, and industry-grade AI applications together.</p>
              </div>
            </div>
          </div>

        </section>

        {/* ================= ABOUT SECTION ================= */}
        <section id="about" className="py-20 px-4 md:px-8 bg-white border-y border-[#c2c6d5]/30">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="relative inline-block">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#191b22] relative z-10">
                About GDG on Campus
              </h2>
              <div className="absolute bottom-1 left-0 w-full h-3 bg-[#86f898]/60 z-0 transform -skew-x-12"></div>
            </div>

            <div className="space-y-4 text-base text-[#424753] leading-relaxed">
              <p>
                Google Developer Groups (GDG) on Campus are university-based community groups for students interested in Google developer technologies. Students from all undergraduate or graduate programs with an interest in growing as a developer are welcome.
              </p>
              <p>
                By joining GDG on Campus Telkom University Purwokerto, students grow their knowledge in a peer-to-peer learning environment, collaborate on team projects, and build solutions for local businesses and our campus community.
              </p>

              {/* Code Snippet Terminal Box */}
              <div className="bg-[#191b22] text-white p-6 rounded-2xl shadow-lg font-mono text-xs md:text-sm space-y-2 border border-[#727785]/30">
                <div className="flex items-center gap-2 pb-3 border-b border-white/10 text-white/60">
                  <Terminal className="w-4 h-4 text-[#0058bd]" />
                  <span>gdg-purwokerto-cli --init</span>
                </div>
                <div className="pt-2">
                  <span className="text-[#0058bd] font-bold">&gt;</span> print(&quot;Welcome to IT Telkom Purwokerto Developer Community!&quot;)
                </div>
                <div>
                  <span className="text-[#006e2c] font-bold">&gt;</span> Initializing environment... Success.
                </div>
                <div>
                  <span className="text-[#fbbc06] font-bold">&gt;</span> Ready to build, learn, and grow.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= UPCOMING EVENTS SECTION ================= */}
        <section id="events" className="py-20 px-4 md:px-8 bg-[#f9f9ff]">
          <div className="max-w-7xl mx-auto space-y-8">
            
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-[#191b22]">Upcoming Events</h2>
                <p className="text-sm text-[#424753]">Stay tuned for upcoming campus tech workshops</p>
              </div>
              <span className="hidden md:inline-flex items-center gap-2 px-3 py-1 bg-[#956e00]/10 text-[#765700] rounded-full text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#fbbc06] animate-pulse"></span>
                Live Sync
              </span>
            </div>

            {/* Empty State Card */}
            <div className="w-full bg-[#ecedf7] rounded-[24px] p-12 flex flex-col items-center justify-center text-center shadow-xs border border-[#c2c6d5]/30 space-y-4">
              <div className="w-20 h-20 bg-[#0058bd]/10 rounded-full flex items-center justify-center text-[#0058bd]">
                <Bell className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-[#191b22]">No Upcoming Events Scheduled</h3>
              <p className="text-sm text-[#424753] max-w-md">
                We are brewing up something exciting behind the scenes for the upcoming semester. Subscribe to get notified instantly when new workshops drop!
              </p>
              <button
                onClick={() => setShowSubscribeModal(true)}
                className="px-6 py-3 bg-[#006e2c] text-white rounded-xl font-bold text-sm shadow-sm hover:bg-[#00722f] transition-all flex items-center gap-2 group"
              >
                <Bell className="w-4 h-4 group-hover:animate-bounce" />
                <span>Subscribe to Notifications</span>
              </button>
            </div>

          </div>
        </section>

        {/* ================= BENTO GRID SECTION ================= */}
        <BentoGrid />

        {/* ================= CAMPUS LOCATION & MAP SECTION ================= */}
        <section id="community" className="py-20 px-4 md:px-8 bg-white border-t border-[#c2c6d5]/30">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12 items-center">
            
            {/* Map Container */}
            <div className="flex-1 w-full relative">
              <div className="absolute -inset-3 bg-gradient-to-r from-[#ba1a1a]/10 to-[#fbbc06]/10 rounded-[32px] transform -rotate-2 z-0"></div>
              <div className="w-full h-[400px] bg-[#ecedf7] rounded-[24px] shadow-lg relative z-10 overflow-hidden border border-[#c2c6d5]/40">
                <iframe
                  title="Telkom University Purwokerto Map"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3956.270960533355!2d109.2468307!3d-7.4352136!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e655ea49d799017%3A0xe543e390c5220c38!2sTelkom%20University%20Purwokerto!5e0!3m2!1sen!2sid!4v1700000000000!5m2!1sen!2sid"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>

            {/* Address Details */}
            <div className="flex-1 w-full space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#ffdad6] text-[#ba1a1a] rounded-full text-xs font-bold">
                <MapPin className="w-3.5 h-3.5" />
                <span>Campus Location</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#191b22]">
                Find us on campus
              </h2>
              <p className="text-base text-[#424753] leading-relaxed">
                We hold our regular meetings, workshops, and study jams at the main campus of Telkom University Purwokerto. Connect with local student developers in a collaborative academic environment.
              </p>

              <div className="space-y-4 pt-2 font-mono text-xs md:text-sm text-[#424753]">
                <div className="flex items-start gap-4">
                  <Map className="w-5 h-5 text-[#0058bd] shrink-0 mt-1" />
                  <div>
                    <strong className="text-[#191b22] block font-sans font-bold text-sm mb-0.5">Address</strong>
                    Jl. D.I. Panjaitan No.128, Karangreja, Purwokerto Kidul, Kec. Purwokerto Sel., Kabupaten Banyumas, Jawa Tengah 53147
                  </div>
                </div>

                <div className="w-full h-px bg-[#c2c6d5]/30"></div>

                <div className="flex items-start gap-4">
                  <Mail className="w-5 h-5 text-[#006e2c] shrink-0 mt-1" />
                  <div>
                    <strong className="text-[#191b22] block font-sans font-bold text-sm mb-0.5">Contact</strong>
                    hello@gdgpurwokerto.com
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

      </main>

      <Footer />

      {/* Subscribe to Notifications Modal */}
      {showSubscribeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fade-in-up border border-[#c2c6d5]/30">
            {subscribeSuccess ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle className="w-12 h-12 text-[#006e2c] mx-auto animate-bounce" />
                <h3 className="text-xl font-bold text-[#191b22]">Subscription Confirmed!</h3>
                <p className="text-xs text-[#424753]">
                  You will receive email updates whenever a new GDG event or hackathon is announced.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubscribeSubmit} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[#0058bd]" />
                    <h3 className="text-lg font-bold text-[#191b22]">Event Notification Sign-Up</h3>
                  </div>
                  <button type="button" onClick={() => setShowSubscribeModal(false)} className="text-xs text-[#727785] hover:underline">
                    Cancel
                  </button>
                </div>
                <p className="text-xs text-[#424753]">
                  Enter your student email to stay informed about GDG Telkom Purwokerto workshops & study jams.
                </p>
                <div>
                  <input
                    type="email"
                    required
                    placeholder="student@student.telkomuniversity.ac.id"
                    value={subscribedEmail}
                    onChange={(e) => setSubscribedEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#c2c6d5]/60 focus:border-[#0058bd] focus:outline-none text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-[#0058bd] text-white rounded-xl font-bold text-xs hover:bg-[#2771df] transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" /> Subscribe Now
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
