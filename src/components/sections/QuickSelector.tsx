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
    color: "blue-600",
    description: "Birthdays, House Parties, Private Tournaments",
    modalContent: (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl hover:border-[#003791]/40 hover:shadow-xs transition-all group cursor-pointer relative">
          <h4 className="text-slate-800 font-bold mb-2 uppercase tracking-tight text-sm">The Ultimate House Party</h4>
          <p className="text-slate-600 text-xs leading-relaxed mb-6">High-energy gaming, VR mind-benders, and heavy bass. Just add friends.</p>
          <div className="absolute bottom-4 right-6 text-[#003791] group-hover:translate-x-1 transition-transform">
            <ArrowRight size={14} />
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl hover:border-[#003791]/40 hover:shadow-xs transition-all group cursor-pointer relative">
          <h4 className="text-slate-800 font-bold mb-2 uppercase tracking-tight text-sm">Stadium & Cinema Nights</h4>
          <p className="text-slate-600 text-xs leading-relaxed mb-6">100-inch screens and premium soundbars. Perfect for IPL screenings, cozy movie marathons, or chill music nights.</p>
          <div className="absolute bottom-4 right-6 text-[#003791] group-hover:translate-x-1 transition-transform">
            <ArrowRight size={14} />
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl hover:border-[#003791]/40 hover:shadow-xs transition-all group cursor-pointer relative">
          <h4 className="text-slate-800 font-bold mb-2 uppercase tracking-tight text-sm">The VIP Birthday Bash</h4>
          <p className="text-slate-600 text-xs leading-relaxed mb-6">Fully hosted gaming arenas. We handle the screens, the tech, the lights, and the crowd control. You just celebrate.</p>
          <div className="absolute bottom-4 right-6 text-[#003791] group-hover:translate-x-1 transition-transform">
            <ArrowRight size={14} />
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl hover:border-[#003791]/40 hover:shadow-xs transition-all group cursor-pointer relative">
          <h4 className="text-slate-800 font-bold mb-2 uppercase tracking-tight text-sm">The Milestone Flex</h4>
          <p className="text-slate-600 text-xs leading-relaxed mb-6">PS5, F1 Racing Simulators or VR takeovers. For when you need a party centerpiece they will never forget.</p>
          <div className="absolute bottom-4 right-6 text-[#003791] group-hover:translate-x-1 transition-transform">
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
    color: "indigo-600",
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
          <div key={item.title} className="bg-slate-50 border border-slate-200 p-6 rounded-2xl hover:border-[#003791]/40 transition-all group relative">
            <item.icon className="text-[#003791] mb-4 group-hover:scale-110 transition-transform" size={24} />
            <h4 className="text-slate-800 font-bold mb-2 uppercase tracking-tight text-sm italic">{item.title}</h4>
            <p className="text-slate-600 text-[10px] leading-relaxed">{item.desc}</p>
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
    color: "blue-500",
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
            className="bg-slate-50 border border-slate-200 p-4 rounded-2xl hover:border-[#003791]/30 transition-all group text-center"
          >
            <item.icon className="text-[#003791] mx-auto mb-3 group-hover:scale-110 transition-transform" size={20} />
            <h4 className="text-slate-800 font-bold text-[10px] uppercase tracking-tight mb-1">{item.name}</h4>
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
    <section className="py-12 bg-slate-50 border-y border-slate-200">
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
                className="w-full text-left group block p-8 bg-white rounded-[32px] border border-slate-200 hover:border-[#003791]/30 transition-all hover:scale-[1.02] relative overflow-hidden shadow-xs cursor-pointer"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/10 blur-3xl -mr-16 -mt-16 group-hover:bg-blue-150/20 transition-colors" />
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#003791] border border-blue-100">
                    <opt.icon size={24} />
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase tracking-[0.3em] text-[#003791] font-bold font-mono">{opt.subtitle}</h4>
                    <h3 className="text-2xl font-black uppercase italic text-slate-800">{opt.title}</h3>
                  </div>
                </div>
                
                <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                  {opt.description}
                </p>
                
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#003791] group-hover:text-blue-900 transition-colors">
                  <span>Explore</span> <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedId && selectedOption && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedId(null)}
              className="absolute inset-0 cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-[40px] p-8 md:p-12 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/20 blur-[100px] -mr-32 -mt-32" />
              
              <button
                onClick={() => setSelectedId(null)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-all z-10 cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-[#003791] border border-blue-100">
                    <selectedOption.icon size={32} />
                  </div>
                  <div>
                    <h4 className="text-xs uppercase tracking-[0.3em] text-slate-500 font-bold font-mono">{selectedOption.subtitle}</h4>
                    <h3 className="text-4xl font-black uppercase italic text-slate-800">{selectedOption.title}</h3>
                  </div>
                </div>

                <div className="mb-12">
                  {typeof selectedOption.modalContent === 'string' ? (
                    <p className="text-slate-600 text-lg leading-relaxed font-sans">
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
                      className="mb-12 p-6 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-4"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#003791]/15 flex items-center justify-center text-[#003791] shrink-0">
                        <Sparkles size={20} />
                      </div>
                      <div className="flex-1">
                        {isInsightLoading ? (
                          <div className="flex items-center gap-2 text-[#003791] text-xs font-bold uppercase tracking-widest font-mono">
                            <Loader2 size={12} className="animate-spin" /> Analyzing Trends...
                          </div>
                        ) : insight ? (
                          <>
                            <h5 className="text-[#003791] text-[10px] font-bold uppercase tracking-widest mb-1 font-mono">{insight.title}</h5>
                            <p className="text-slate-700 text-sm italic">"{insight.content}"</p>
                          </>
                        ) : null}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-slate-200">
                  <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Link
                      to={selectedOption.ctaLink}
                      className="bg-slate-100 text-slate-700 px-8 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-slate-200 transition-all text-center text-sm cursor-pointer"
                    >
                      {selectedOption.ctaText}
                    </Link>
                    <a
                      href="https://wa.me/919711844884"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#003791] text-white px-8 py-4 rounded-full font-black uppercase tracking-widest hover:bg-blue-900 transition-colors text-center text-sm flex items-center justify-center gap-2 shadow-sm"
                    >
                      <span>Inquire via WhatsApp</span> <MessageSquare size={16} />
                    </a>
                  </div>
                  <button
                    onClick={() => setSelectedId(null)}
                    className="w-full sm:w-auto text-slate-500 hover:text-slate-800 font-bold uppercase tracking-widest text-sm transition-colors cursor-pointer"
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
