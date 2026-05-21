import { motion, AnimatePresence } from "motion/react";
import { Users, Building2, Package, ArrowRight, X, MessageSquare, Zap, Target, Trophy, Monitor, Gamepad2, Speaker, Sparkles, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { getCategoryInsight } from "../../services/gemini";

const options = [
  {
    id: "personal",
    title: "Personal",
    subtitle: "VIP Home Arenas",
    icon: Users,
    color: "afterhours-cyan",
    description: "Birthdays, House Parties, Private Tournaments",
    modalContent: (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-afterhours-purple/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all group cursor-pointer relative">
          <h4 className="text-white font-bold mb-2 uppercase tracking-tight text-sm">The Ultimate House Party</h4>
          <p className="text-white/40 text-xs leading-relaxed mb-6">High-energy gaming, VR mind-benders, and heavy bass. Just add friends.</p>
          <div className="absolute bottom-4 right-6 text-afterhours-purple group-hover:translate-x-1 transition-transform">
            <ArrowRight size={14} />
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-afterhours-purple/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all group cursor-pointer relative">
          <h4 className="text-white font-bold mb-2 uppercase tracking-tight text-sm">Stadium & Cinema Nights</h4>
          <p className="text-white/40 text-xs leading-relaxed mb-6">100-inch screens and premium soundbars. Perfect for IPL screenings, cozy movie marathons, or chill music nights.</p>
          <div className="absolute bottom-4 right-6 text-afterhours-purple group-hover:translate-x-1 transition-transform">
            <ArrowRight size={14} />
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-afterhours-purple/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all group cursor-pointer relative">
          <h4 className="text-white font-bold mb-2 uppercase tracking-tight text-sm">The VIP Birthday Bash</h4>
          <p className="text-white/40 text-xs leading-relaxed mb-6">Fully hosted gaming arenas. We handle the screens, the tech, the lights, and the crowd control. You just celebrate.</p>
          <div className="absolute bottom-4 right-6 text-afterhours-purple group-hover:translate-x-1 transition-transform">
            <ArrowRight size={14} />
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-afterhours-purple/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all group cursor-pointer relative">
          <h4 className="text-white font-bold mb-2 uppercase tracking-tight text-sm">The Milestone Flex</h4>
          <p className="text-white/40 text-xs leading-relaxed mb-6">PS5, F1 Racing Simulators or VR takeovers. For when you need a party centerpiece they will never forget.</p>
          <div className="absolute bottom-4 right-6 text-afterhours-purple group-hover:translate-x-1 transition-transform">
            <ArrowRight size={14} />
          </div>
        </div>
      </div>
    ),
    ctaText: "View All Experiences ➔",
    ctaLink: "/experiences"
  },
  {
    id: "corporate",
    title: "Corporate",
    subtitle: "Office Activations",
    icon: Building2,
    color: "afterhours-purple",
    description: "Team Building, Fun Fridays, Office Arenas",
    modalContent: (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
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
        ].map((item) => (
          <div key={item.title} className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-afterhours-purple/50 transition-all group relative">
            <item.icon className="text-afterhours-purple mb-4 group-hover:scale-110 transition-transform" size={24} />
            <h4 className="text-white font-bold mb-2 uppercase tracking-tight text-sm italic">{item.title}</h4>
            <p className="text-white/40 text-[10px] leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    ),
    ctaText: "Plan Your Corporate Event ➔",
    ctaLink: "/corporate"
  },
  {
    id: "rentals",
    title: "Rentals",
    subtitle: "Pure Equipment",
    icon: Package,
    color: "white",
    description: "PS5, VR, Sound, Projectors",
    modalContent: (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        {[
          { name: "Gaming Theatre", price: "₹1999", icon: Monitor },
          { name: "Racing Combo", price: "₹1999", icon: Zap },
          { name: "Party Setup", price: "₹1799", icon: Speaker },
          { name: "PS VR2", price: "₹1599", icon: Zap },
          { name: "PS5 Console", price: "₹1299", icon: Gamepad2 },
          { name: "Racing Wheel", price: "₹1199", icon: Zap },
          { name: "JBL Speaker", price: "₹1199", icon: Speaker },
          { name: "HD Projector", price: "₹999", icon: Monitor },
        ].map((item) => (
          <Link 
            key={item.name} 
            to="/rentals"
            className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:border-afterhours-cyan/50 transition-all group text-center"
          >
            <item.icon className="text-afterhours-cyan mx-auto mb-3 group-hover:scale-110 transition-transform" size={20} />
            <h4 className="text-white font-bold text-[10px] uppercase tracking-tight mb-1">{item.name}</h4>
          </Link>
        ))}
      </div>
    ),
    ctaText: "View Rental Catalog ➔",
    ctaLink: "/rentals"
  }
];

export function QuickSelector() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [insight, setInsight] = useState<{ title: string; content: string } | null>(null);
  const [isInsightLoading, setIsInsightLoading] = useState(false);

  const selectedOption = options.find(opt => opt.id === selectedId);

  useEffect(() => {
    const fetchInsight = async (category: string) => {
      setIsInsightLoading(true);
      try {
        const data = await getCategoryInsight(category);
        setInsight(data);
      } catch (error) {
        console.error("Insight Error:", error);
      } finally {
        setIsInsightLoading(false);
      }
    };

    if (selectedId) {
      fetchInsight(selectedId);
    } else {
      setInsight(null);
    }
  }, [selectedId]);

  return (
    <section className="py-12 bg-afterhours-black border-y border-white/5">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {options.map((opt, index) => (
            <motion.div
              key={opt.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <button
                onClick={() => setSelectedId(opt.id)}
                className="w-full text-left group block p-8 bg-afterhours-gray rounded-[32px] border border-white/5 hover:border-white/20 transition-all hover:scale-[1.02] relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-${opt.color}/5 blur-3xl -mr-16 -mt-16 group-hover:bg-${opt.color}/10 transition-colors`} />
                
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 rounded-2xl bg-${opt.color}/10 flex items-center justify-center text-${opt.color}`}>
                    <opt.icon size={24} />
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold">{opt.subtitle}</h4>
                    <h3 className="text-2xl font-black uppercase italic">{opt.title}</h3>
                  </div>
                </div>
                
                <p className="text-white/40 text-sm mb-6 leading-relaxed">
                  {opt.description}
                </p>
                
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white group-hover:text-afterhours-cyan transition-colors">
                  Explore <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedId && selectedOption && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedId(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-afterhours-gray border border-white/10 rounded-[40px] p-8 md:p-12 shadow-2xl overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-64 h-64 bg-${selectedOption.color}/5 blur-[100px] -mr-32 -mt-32`} />
              
              <button
                onClick={() => setSelectedId(null)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all z-10"
              >
                <X size={20} />
              </button>

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className={`w-16 h-16 rounded-2xl bg-${selectedOption.color}/10 flex items-center justify-center text-${selectedOption.color}`}>
                    <selectedOption.icon size={32} />
                  </div>
                  <div>
                    <h4 className="text-xs uppercase tracking-[0.3em] text-white/40 font-bold">{selectedOption.subtitle}</h4>
                    <h3 className="text-4xl font-black uppercase italic">{selectedOption.title}</h3>
                  </div>
                </div>

                <div className="mb-12">
                  {typeof selectedOption.modalContent === 'string' ? (
                    <p className="text-white/60 text-lg leading-relaxed">
                      {selectedOption.modalContent}
                    </p>
                  ) : (
                    selectedOption.modalContent
                  )}
                </div>

                <AnimatePresence>
                  {(isInsightLoading || insight) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="mb-12 p-6 bg-afterhours-purple/10 border border-afterhours-purple/20 rounded-2xl flex items-start gap-4"
                    >
                      <div className="w-10 h-10 rounded-xl bg-afterhours-purple/20 flex items-center justify-center text-afterhours-purple shrink-0">
                        <Sparkles size={20} />
                      </div>
                      <div className="flex-1">
                        {isInsightLoading ? (
                          <div className="flex items-center gap-2 text-afterhours-purple text-xs font-bold uppercase tracking-widest">
                            <Loader2 size={12} className="animate-spin" /> Analyzing Trends...
                          </div>
                        ) : insight ? (
                          <>
                            <h5 className="text-afterhours-purple text-[10px] font-bold uppercase tracking-widest mb-1">{insight.title}</h5>
                            <p className="text-white/80 text-sm italic">"{insight.content}"</p>
                          </>
                        ) : null}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-white/5">
                  <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Link
                      to={selectedOption.ctaLink}
                      className="bg-white/10 text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-white/20 transition-all text-center text-sm"
                    >
                      {selectedOption.ctaText}
                    </Link>
                    <a
                      href="https://wa.me/919711844884"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-afterhours-purple text-white px-8 py-4 rounded-full font-black uppercase tracking-widest hover:scale-105 transition-transform neon-glow-purple text-center text-sm flex items-center justify-center gap-2"
                    >
                      Inquire via WhatsApp <MessageSquare size={16} />
                    </a>
                  </div>
                  <button
                    onClick={() => setSelectedId(null)}
                    className="w-full sm:w-auto text-white/40 hover:text-white font-bold uppercase tracking-widest text-sm transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
