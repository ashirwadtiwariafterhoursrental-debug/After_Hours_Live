import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
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
    });

    return () => unsubscribe();
  }, []);

  // Slide rotation interval
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, 4500); // Fades every 4.5 seconds

    return () => clearInterval(interval);
  }, [slides]);

  return (
    <main className="bg-afterhours-black overflow-hidden">
      {/* TASK 1: Massive Full-Screen Auto-Rotating Image Slider Hero */}
      <section id="homepage-carousel-hero" className="relative w-full h-[100vh] bg-black overflow-hidden flex items-center justify-center">
        {/* Carousel Transition View */}
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

        {/* Dark sleek gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-afterhours-black via-black/45 to-black/75 z-10 select-none pointer-events-none" />

        {/* Hero Overlay Center Content */}
        <div className="relative z-20 text-center max-w-5xl mx-auto px-6 flex flex-col items-center justify-center gap-6 mt-12 select-none">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-afterhours-purple/10 border border-afterhours-purple/35 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-afterhours-pink animate-ping" />
              <span className="text-[10px] uppercase font-mono font-black tracking-[0.4em] text-afterhours-pink">
                AFTER HOURS PREMIUM
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black uppercase italic tracking-tighter text-white leading-none">
              PREMIUM GAMING <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-afterhours-cyan via-afterhours-purple to-afterhours-pink drop-shadow-[0_0_25px_rgba(168,85,247,0.3)]">
                ASSETS ON RENT
              </span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.6 }}
            className="text-white/60 text-sm sm:text-lg md:text-xl max-w-2xl font-semibold leading-relaxed tracking-wide font-sans mb-4"
          >
            Transform your space into an elite gaming arena. Rent PS5, Projectors, Speakers, and Popular Games delivered directly to you.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.9, type: "spring" }}
          >
            <Link
              id="carousel-explore-cta"
              to="/rentals"
              className="group relative inline-flex items-center justify-center px-10 py-5 bg-gradient-to-r from-afterhours-purple to-afterhours-pink hover:from-afterhours-pink hover:to-afterhours-purple text-white font-black uppercase tracking-[0.25em] text-xs italic rounded-2xl transition-all duration-300 transform hover:scale-[1.04] active:scale-[0.98] shadow-[0_0_40px_rgba(168,85,247,0.45)] hover:shadow-[0_0_60px_rgba(236,72,153,0.6)] cursor-pointer"
            >
              <span className="relative z-10 flex items-center gap-2">
                RENT PS5, PROJECTORS & MORE
                <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
              </span>
              <span className="absolute inset-0 rounded-2xl bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* TASK 2: Secondary Sections (Corporate & Personal Arenas Side-by-Side Cards) */}
      <section id="arena-cards-section" className="py-16 bg-afterhours-black relative z-10 -mt-12 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card 1: Corporate Office Activations */}
          <Link 
            to="/experiences" 
            className="group relative block p-8 md:p-10 rounded-[40px] bg-afterhours-gray/35 border border-white/5 hover:border-afterhours-purple/35 transition-all overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-afterhours-purple/5 group-hover:bg-afterhours-purple/10 rounded-full blur-[80px] pointer-events-none transition-all" />
            
            <div className="flex flex-col h-full justify-between gap-8 relative z-10">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-afterhours-purple block mb-3 font-mono">
                  🏢 Premium Workspace Activations
                </span>
                <h3 className="text-2xl md:text-3xl font-black uppercase italic text-white group-hover:text-afterhours-purple transition-colors mb-4">
                  Corporate Office Activations
                </h3>
                <p className="text-white/50 text-xs md:text-sm leading-relaxed">
                  Boost workplace connection and drive synergy. Bring premium virtual reality simulation, flight cabins, and full esports competition hubs directly into your office floor.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/80 group-hover:text-afterhours-purple transition-all pt-4">
                <span>View Experiences</span>
                <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card 2: Personal House Parties */}
          <Link 
            to="/experiences" 
            className="group relative block p-8 md:p-10 rounded-[40px] bg-afterhours-gray/35 border border-white/5 hover:border-afterhours-cyan/35 transition-all overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-afterhours-cyan/5 group-hover:bg-afterhours-cyan/10 rounded-full blur-[80px] pointer-events-none transition-all" />
            
            <div className="flex flex-col h-full justify-between gap-8 relative z-10">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-afterhours-cyan block mb-3 font-mono">
                  🏠 Ultimate Private Parties
                </span>
                <h3 className="text-2xl md:text-3xl font-black uppercase italic text-white group-hover:text-afterhours-cyan transition-colors mb-4">
                  Personal House Parties
                </h3>
                <p className="text-white/50 text-xs md:text-sm leading-relaxed">
                  Transform birthdays, anniversaries, or backyard parties into immersive arcade lobbies. Premium racing pods, next-gen hardware, and custom-managed game lounges.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/80 group-hover:text-afterhours-cyan transition-all pt-4">
                <span>View Experiences</span>
                <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>
          </Link>

        </div>
      </section>

      {/* Existing Sections Below */}
      <QuickSelector />
      <AIPlanner />
      <Process />
      <Gallery />

      {/* Your After-Hours HQ Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="p-12 md:p-20 rounded-[60px] bg-afterhours-gray border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-afterhours-purple/10 blur-[120px] -mr-48 -mt-48" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-afterhours-cyan/10 blur-[120px] -ml-48 -mb-48" />
            
            <div className="relative z-10 text-center max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-7xl font-black uppercase italic mb-6">Events for Birthday & House Parties</h2>
              <h3 className="text-afterhours-pink text-xl md:text-2xl font-bold uppercase tracking-widest mb-8">
                Premium Gaming Assets on Rent
              </h3>
              <p className="text-white/60 text-xl leading-relaxed mb-12">
                Turn your living room into an Arcade. We are the fun after the sun sets. 
                F1 Simulator Showdowns, VR Mind-Benders, PS5 Tournaments, and 'many more' tailored events.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { label: "Birthday Parties", icon: Star },
                  { label: "House Parties", icon: Users },
                  { label: "Corporate Events", icon: Building2 },
                  { label: "Custom Events", icon: Calendar }
                ].map((item) => (
                  <div key={item.label} className="flex flex-col items-center gap-3">
                    <item.icon className="text-afterhours-cyan" size={24} />
                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Corporate Explore Section */}
      <section className="py-24 bg-afterhours-black/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black uppercase italic mb-4">Corporate <span className="text-afterhours-purple">Activations</span></h2>
            <p className="text-white/40 uppercase tracking-widest text-sm">Scalable tech experiences for your workspace</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Fun Fridays",
                desc: "Break the routine with VR challenges and casual PS5 tournaments.",
                icon: Zap
              },
              {
                title: "Team Engagement",
                desc: "Build real synergy through competitive F1 racing and team-based VR.",
                icon: Target
              },
              {
                title: "Gaming Tournaments",
                desc: "Full-scale managed Esports tournaments with leaderboards and prizes.",
                icon: Trophy
              }
            ].map((item, i) => (
              <motion.div 
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-10 bg-afterhours-gray rounded-[40px] border border-white/5 hover:border-afterhours-purple/30 transition-all group"
              >
                <item.icon className="text-afterhours-purple mb-6 group-hover:scale-110 transition-transform" size={40} />
                <h3 className="text-2xl font-bold uppercase italic mb-4">{item.title}</h3>
                <p className="text-white/40 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <Link 
              to="/experiences" 
              className="inline-flex items-center gap-2 text-afterhours-cyan font-bold uppercase tracking-widest hover:gap-4 transition-all"
            >
              Explore Corporate Solutions <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Operator Portal Banner (Admin & Publishing Hub) */}
      <section className="py-12 bg-black/20 border-t border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-afterhours-purple/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-3xl bg-white/[0.01] border border-white/5 hover:border-afterhours-purple/20 transition-all max-w-4xl mx-auto">
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-2xl bg-afterhours-purple/10 flex items-center justify-center border border-afterhours-purple/20 text-afterhours-purple">
                <Users size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black uppercase tracking-widest text-white italic">Operator & Blog Portal</h4>
                <p className="text-xs text-white/40 mt-1 leading-relaxed">
                  Authorized team members and moderators can log in to publish latest press releases, event coverages, and custom updates.
                </p>
              </div>
            </div>
            <Link
              to="/admin"
              className="px-6 py-3 bg-gradient-to-r from-afterhours-purple to-afterhours-pink hover:brightness-110 text-white font-black uppercase tracking-wider text-xs italic rounded-xl transition-all shadow-[0_4px_15px_rgba(168,85,247,0.2)] whitespace-nowrap flex items-center gap-2"
            >
              <span>Access Admin Hub</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-24 bg-afterhours-purple relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-multiply" />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="text-4xl md:text-7xl font-black uppercase italic text-white mb-8">
            Ready to <span className="text-black">Level Up?</span>
          </h2>
          <p className="text-white/80 text-xl max-w-2xl mx-auto mb-12 font-medium">
            Stop hosting boring events. Bring the premium Esports arena to your doorstep.
          </p>
          <a
            href="https://wa.me/919711844884"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-4 bg-black text-white px-12 py-6 rounded-full font-black uppercase tracking-widest hover:scale-105 transition-transform"
          >
            Lock Your Date <ArrowRight size={24} />
          </a>
        </div>
      </section>
    </main>
  );
}
