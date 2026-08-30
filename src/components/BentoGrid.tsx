'use client';

import { useState } from 'react';
import { PastEvent, Organizer } from '@/types';
import { History, ArrowRight, Play, X, Calendar, Users, Award, Sparkles, Image as ImageIcon } from 'lucide-react';

const PAST_EVENTS: PastEvent[] = [
  {
    id: 'evt-1',
    title: 'DevFest Purwokerto 2025',
    date: 'Oct 12, 2025',
    month: 'Oct',
    day: 12,
    badgeColor: 'bg-[#ffdad6] text-[#ba1a1a]',
    category: 'Annual Tech Conference',
    description: 'The largest annual developer gathering in Banyumas featuring 8 keynotes, 4 hands-on workshops on GenAI, Flutter, and Google Cloud, attended by 450+ attendees.',
  },
  {
    id: 'evt-2',
    title: 'Flutter 101 & Material You',
    date: 'Sep 28, 2025',
    month: 'Sep',
    day: 28,
    badgeColor: 'bg-[#d8e2ff] text-[#0058bd]',
    category: 'UI/UX Mobile Workshop',
    description: 'Deep dive into building responsive cross-platform apps with Flutter 3.x and custom Material You dynamic color tokens.',
  },
  {
    id: 'evt-3',
    title: 'GCP Cloud Study Jam',
    date: 'Aug 15, 2025',
    month: 'Aug',
    day: 15,
    badgeColor: 'bg-[#86f898]/30 text-[#00722f]',
    category: 'Cloud Certification Prep',
    description: 'Hands-on Qwiklabs session deploying containerized microservices on Google Kubernetes Engine (GKE) and BigQuery analytics.',
  },
];

const ORGANIZERS: Organizer[] = [
  {
    id: 'org-1',
    name: 'Faiz Aulia',
    role: 'GDG Community Lead',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    track: 'AI & Full Stack',
    bio: 'Software Engineering student passionate about machine learning and building community developer ecosystems.',
  },
  {
    id: 'org-2',
    name: 'Dewi Rahmawati',
    role: 'Event Co-Lead',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    track: 'Mobile Development',
    bio: 'Flutter enthusiast and tech workshop coordinator for campus hackathons.',
  },
  {
    id: 'org-3',
    name: 'Budi Santoso',
    role: 'Technical Lead',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    track: 'Cloud & Infrastructure',
    bio: 'Google Cloud Certified Engineer mentoring students on DevOps and serverless architecture.',
  },
];

export default function BentoGrid() {
  const [selectedEvent, setSelectedEvent] = useState<PastEvent | null>(null);
  const [showOrganizersModal, setShowOrganizersModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <section id="showcase" className="py-20 px-4 md:px-8 bg-[#f2f3fd]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0058bd]/10 text-[#0058bd] rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Community Highlights
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#191b22] tracking-tight">
              Life at GDG Purwokerto
            </h2>
          </div>
          <p className="text-sm text-[#424753] max-w-md">
            Explore past events, meet the lead organizers, view event photo archives, and watch our community recap videos.
          </p>
        </div>

        {/* Bento Grid Container */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[300px]">
          
          {/* Item 1: Past Events Archive (Span 8) */}
          <div className="md:col-span-8 bg-white rounded-[24px] p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group overflow-hidden relative border border-[#c2c6d5]/20">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[#0058bd]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            
            <div>
              <div className="flex justify-between items-start mb-3 relative z-10">
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold text-[#191b22]">Past Events Archive</h3>
                  <span className="text-xs bg-[#0058bd]/10 text-[#0058bd] font-semibold px-2.5 py-0.5 rounded-full">3 Events</span>
                </div>
                <div className="p-2 rounded-full bg-[#f2f3fd] text-[#727785]">
                  <History className="w-5 h-5" />
                </div>
              </div>
              <p className="text-sm text-[#424753] max-w-lg relative z-10">
                Explore our previous workshops, hackathons, and tech talks. Click any card below to view detailed agenda and recap resources.
              </p>
            </div>

            {/* Event Cards Carousel Row */}
            <div className="flex gap-4 overflow-x-auto pb-2 relative z-10 scrollbar-hide">
              {PAST_EVENTS.map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className="min-w-[240px] bg-[#f9f9ff] rounded-2xl p-4 flex items-center gap-3 border border-[#c2c6d5]/40 hover:border-[#0058bd] transition-all cursor-pointer hover:-translate-y-1 shadow-xs hover:shadow-md"
                >
                  <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-mono text-xs ${evt.badgeColor} shrink-0`}>
                    <span className="text-[10px] uppercase font-bold">{evt.month}</span>
                    <span className="font-extrabold text-base leading-none">{evt.day}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-[#191b22] truncate">{evt.title}</p>
                    <p className="text-xs text-[#424753] truncate">{evt.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Item 2: Meet the Organizers (Span 4) */}
          <div
            onClick={() => setShowOrganizersModal(true)}
            className="md:col-span-4 bg-white rounded-[24px] shadow-sm overflow-hidden group cursor-pointer relative border border-[#c2c6d5]/20"
          >
            <div
              className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80')`,
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent"></div>
            
            <div className="absolute bottom-0 left-0 w-full p-6 text-white space-y-2">
              <span className="px-2.5 py-1 bg-[#86f898]/30 backdrop-blur-md text-[#89fa9b] rounded-full text-xs font-bold uppercase tracking-wider">
                Core Team
              </span>
              <h3 className="text-xl font-bold">Meet the Organizers</h3>
              <p className="text-xs text-white/80">The passionate student leaders driving GDG Purwokerto.</p>
              <div className="pt-2 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {ORGANIZERS.map((org) => (
                    <img key={org.id} src={org.avatar} alt={org.name} className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                  ))}
                </div>
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-[#0058bd] transition-colors">
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Item 3: Photos Gallery (Span 6) */}
          <div className="md:col-span-6 bg-white rounded-[24px] shadow-sm p-6 flex flex-col justify-between border border-[#c2c6d5]/20">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-lg font-bold text-[#191b22]">Community Gallery</h3>
                <p className="text-xs text-[#424753]">Snapshots from our campus tech jams</p>
              </div>
              <span className="text-xs font-bold text-[#0058bd] flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" /> 3 Photos
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
              <div
                onClick={() => setSelectedImage('https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80')}
                className="bg-slate-100 rounded-xl bg-cover bg-center cursor-pointer hover:opacity-90 transition-opacity"
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80')` }}
              ></div>
              <div className="grid grid-rows-2 gap-3">
                <div
                  onClick={() => setSelectedImage('https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80')}
                  className="bg-slate-100 rounded-xl bg-cover bg-center cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ backgroundImage: `url('https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80')` }}
                ></div>
                <div
                  onClick={() => setSelectedImage('https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=80')}
                  className="bg-slate-100 rounded-xl bg-cover bg-center cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ backgroundImage: `url('https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=80')` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Item 4: Video Highlights Rewind (Span 6) */}
          <div className="md:col-span-6 bg-white rounded-[24px] shadow-sm overflow-hidden relative group border border-[#c2c6d5]/20">
            <div
              className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&auto=format&fit=crop&q=80')` }}
            ></div>
            <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <button
                onClick={() => setShowVideoModal(true)}
                className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center group-hover:bg-white/30 transition-all group-hover:scale-110 shadow-lg"
              >
                <Play className="w-8 h-8 text-white fill-white ml-1" />
              </button>
            </div>
            <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
              <span className="px-2 py-0.5 bg-[#fbbc06] text-[#191b22] font-bold text-[10px] rounded uppercase">
                Video Highlight
              </span>
              <h3 className="text-xl font-bold drop-shadow-md">GDG Purwokerto 2025 Rewind</h3>
              <p className="text-xs text-white/80 drop-shadow-md">A look back at our community milestones & hackathons.</p>
            </div>
          </div>

        </div>

      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-fade-in-up border border-[#c2c6d5]/30">
            <div className="flex items-start justify-between">
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedEvent.badgeColor}`}>
                  {selectedEvent.category}
                </span>
                <h3 className="text-xl font-bold text-[#191b22] mt-2">{selectedEvent.title}</h3>
                <p className="text-xs text-[#727785] flex items-center gap-1.5 mt-1">
                  <Calendar className="w-3.5 h-3.5" /> {selectedEvent.date}
                </p>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="p-2 rounded-full hover:bg-[#ecedf7]">
                <X className="w-5 h-5 text-[#424753]" />
              </button>
            </div>
            <p className="text-sm text-[#424753] leading-relaxed bg-[#f9f9ff] p-4 rounded-2xl border border-[#c2c6d5]/30">
              {selectedEvent.description}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => setSelectedEvent(null)} className="px-4 py-2 text-sm font-semibold text-[#424753] hover:bg-[#ecedf7] rounded-xl">
                Close
              </button>
              <button onClick={() => alert('Accessing archived event slides & recordings...')} className="px-4 py-2 bg-[#0058bd] text-white text-sm font-semibold rounded-xl hover:bg-[#2771df]">
                Access Resources
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Organizers List Modal */}
      {showOrganizersModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 animate-fade-in-up border border-[#c2c6d5]/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#191b22]">Meet the Core Organizers</h3>
                <p className="text-xs text-[#727785]">GDG on Campus Telkom University Purwokerto</p>
              </div>
              <button onClick={() => setShowOrganizersModal(false)} className="p-2 rounded-full hover:bg-[#ecedf7]">
                <X className="w-5 h-5 text-[#424753]" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ORGANIZERS.map((org) => (
                <div key={org.id} className="bg-[#f9f9ff] p-4 rounded-2xl border border-[#c2c6d5]/30 text-center space-y-2">
                  <img src={org.avatar} alt={org.name} className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-[#0058bd]" />
                  <h4 className="font-bold text-sm text-[#191b22]">{org.name}</h4>
                  <p className="text-xs font-semibold text-[#0058bd]">{org.role}</p>
                  <p className="text-[11px] text-[#424753] leading-tight">{org.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Video Rewind Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-black rounded-3xl max-w-3xl w-full p-4 shadow-2xl space-y-4 animate-fade-in-up border border-white/20">
            <div className="flex items-center justify-between text-white px-2">
              <h3 className="font-bold text-lg">GDG Purwokerto 2025 Rewind Video</h3>
              <button onClick={() => setShowVideoModal(false)} className="p-2 rounded-full hover:bg-white/20">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="aspect-video bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center relative">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                title="GDG Rewind Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl w-full animate-fade-in-up">
            <img src={selectedImage} alt="Gallery Preview" className="w-full max-h-[80vh] object-contain rounded-2xl" />
            <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 p-3 rounded-full bg-black/60 text-white hover:bg-black">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

    </section>
  );
}
