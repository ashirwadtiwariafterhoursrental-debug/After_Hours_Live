import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { motion, AnimatePresence } from "motion/react";
import { QuickSelector } from "../components/sections/QuickSelector";
import { AIPlanner } from "../components/sections/AIPlanner";
import { Process } from "../components/sections/Process";
import { Gallery } from "../components/sections/Gallery";
import { ArrowRight, Star, Users, Building2, Calendar, Zap, Target, Trophy } from "lucide-react";

export function Home() {
  const [slides, setSlides] = useState<string[]>([]);
  const [slideLoading, setSlideLoading] = useState(true);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Fetch slide images from homepage_slides collection in Firestore
  useEffect(() => {
    const slidesRef = collection(db, "homepage_slides");
    const q = query(slidesRef, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: string[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.url) {
          list.push(data.url);
        }
      });

      if (list.length === 0) {
        // Fallback placeholder images
        setSlides([
          "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2000&auto=format&fit=crop"
        ]);
      } else {
        setSlides(list);
      }
      setSlideLoading(false);
    }, (err) => {
      console.error("Error reading homepage slides:", err);
      setSlides([
        "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2000&auto=format&fit=crop"
      ]);
      setSlideLoading(false);
      handleFirestoreError(err, OperationType.LIST, "homepage_slides");
    });

    return () => unsubscribe();
  }, []);

  // Slide rotation interval
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [slides]);

  return (
    <main className="bg-slate-50 overflow-hidden">
      {/* Massive Full-Screen Auto-Rotating Image Slider Hero */}
      <section id="homepage-carousel-hero" className="relative w-full h-[100vh] bg-slate-50 overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="popLayout">
            {!slideLoading && slides.length > 0 && (
              <motion.img
                key={currentSlideIndex}
                src={slides[currentSlideIndex]}
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1.09 }}
                exit={{ opacity: 0 }}
                transition={{ 
                  opacity: { duration: 1.2, ease: "easeInOut" },
                  scale: { duration: 5.5, ease: "linear" }
                }}
                className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
              />
            )}
          </AnimatePresence>
        </div>

        {/* Premium light slate/white gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-white/70 to-white/90 z-10 select-none pointer-events-none" />

        {/* Hero Overlay Center Content */}
        <div className="relative z-20 text-center max-w-5xl mx-auto px-6 flex flex-col items-center justify-center gap-6 mt-12 select-none">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#003791]/10 border border-[#003791]/20 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[#003791] animate-ping" />
              <span className="text-[10px] uppercase font-mono font-bold tracking-[0.3em] text-[#003791]">
                CORPORATE & PRIVATE ACTIVATIONS
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase italic tracking-tighter text-slate-800 leading-tight">
              NEXT-GEN INTERACTIVE <br />
              <span className="text-[#003791] drop-shadow-sm font-black">
                ENTERTAINMENT
              </span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.6 }}
            className="text-slate-600 text-sm sm:text-lg md:text-xl max-w-2xl font-medium leading-relaxed tracking-wide font-sans mb-4"
          >
            Engineer engagement and build connection. We transform standard workspaces and private venues into premium interactive Esports and VR arenas with white-glove setup.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.9, type: "spring" }}
          >
            <Link
              id="carousel-explore-cta"
              to="/rentals"
              className="group relative inline-flex items-center justify-center px-10 py-5 bg-[#003791] hover:bg-blue-900 text-white font-bold uppercase tracking-[0.2em] text-xs rounded-xl transition-all duration-300 shadow-lg cursor-pointer"
            >
              <span className="relative z-10 flex items-center gap-2 text-white">
                EXPLORE PREMIUM FLEET
                <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform text-white" />
              </span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Corporate & Personal Arenas Side-by-Side Cards */}
      <section id="arena-cards-section" className="py-16 bg-slate-50 relative z-10 -mt-12 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card 1: Corporate Office Activations */}
          <Link 
            to="/experiences" 
            className="group relative block p-8 md:p-10 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-[#003791]/40 hover:shadow-md transition-all overflow-hidden"
          >
            <div className="flex flex-col h-full justify-between gap-8 relative z-10">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#003791] block mb-3 font-mono">
                  🏢 B2B / Enterprise Solutions
                </span>
                <h3 className="text-2xl md:text-3xl font-black uppercase italic text-slate-800 group-hover:text-[#003791] transition-colors mb-4">
                  Corporate Activations
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Solve the "Boring Friday" problem. Bring premium virtual reality simulation, flight cabins, and full esports competition hubs directly into your office floor to boost team synergy.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-600 group-hover:text-[#003791] transition-all pt-4">
                <span>View Corporate Packages</span>
                <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card 2: Personal House Parties */}
          <Link 
            to="/experiences" 
            className="group relative block p-8 md:p-10 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-[#003791]/40 hover:shadow-md transition-all overflow-hidden"
          >
            <div className="flex flex-col h-full justify-between gap-8 relative z-10">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#003791] block mb-3 font-mono">
                  🏠 Elite Private Events
                </span>
                <h3 className="text-2xl md:text-3xl font-black uppercase italic text-slate-800 group-hover:text-[#003791] transition-colors mb-4">
                  VIP House Parties
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Transform birthdays, anniversaries, or backyard parties into immersive arcade lobbies. Premium racing pods, next-gen hardware, and custom-managed game lounges delivered to your door.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-600 group-hover:text-[#003791] transition-all pt-4">
                <span>View Private Experiences</span>
                <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>
          </Link>

        </div>
      </section>

      {/* Main Sections */}
      <QuickSelector />
      <AIPlanner />
      <Process />
      <Gallery />

      {/* Curated Interactive Experiences Section */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="p-12 md:p-20 bg-white rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="relative z-10 text-center max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-black uppercase italic text-slate-800 mb-6">Unforgettable <br/><span className="text-[#003791]">Event Engineering</span></h2>
              <p className="text-slate-500 text-lg leading-relaxed mb-12 max-w-2xl mx-auto">
                We don't just drop off equipment. We curate entire experiences. From F1 Simulator showdowns and VR Mind-Benders to managed PS5 Tournaments, we handle the tech so you can handle the networking.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { label: "VIP Birthdays", icon: Star },
                  { label: "House Parties", icon: Users },
                  { label: "Corporate Offsites", icon: Building2 },
                  { label: "Custom Activations", icon: Calendar }
                ].map((item) => (
                  <div key={item.label} className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center border border-slate-200">
                      <item.icon className="text-[#003791]" size={24} />
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-600 font-bold">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Operator Portal Banner (Admin & Publishing Hub) */}
      <section className="py-12 bg-white border-t border-b border-slate-200">
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 bg-slate-50 rounded-2xl border border-slate-200 hover:border-[#003791]/30 transition-all max-w-4xl mx-auto">
            <div className="flex items-center gap-5 text-left">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-slate-200 text-[#003791] shadow-sm">
                <Users size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800">Operator & Partner Hub</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Authorized team members and asset investors can log in to manage fleet inventory and track ROI.
                </p>
              </div>
            </div>
            <Link
              to="/admin"
              className="px-6 py-3 bg-white hover:bg-slate-100 border border-slate-200 text-[#003791] font-bold uppercase tracking-wider text-[10px] rounded-lg transition-all shadow-sm flex items-center gap-2"
            >
              <span>Access Portal</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
      
      {/* Final CTA Section */}
      <section className="py-24 bg-[#003791] relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-black uppercase italic text-white mb-6">
            Elevate Your <span className="text-blue-200 font-black">Culture.</span>
          </h2>
          <p className="text-white/90 text-lg max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
            Ready to upgrade your next team-building day or private event? Lock in your dates with our Concierge today.
          </p>
          <a
            href="https://wa.me/919711844884"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-white text-[#003791] hover:bg-slate-100 shadow-lg px-10 py-5 rounded-xl font-bold uppercase tracking-widest transition-transform hover:-translate-y-1"
          >
            Contact Concierge <ArrowRight size={20} />
          </a>
        </div>
      </section>
    </main>
  );
}