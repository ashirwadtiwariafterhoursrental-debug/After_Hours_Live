import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowRight, Loader2, Zap, Target, Trophy, Monitor, Gamepad2, Speaker, X, Package } from "lucide-react";

import { getEventPlan } from "../../services/gemini";

interface PlanResult {
  packageName: string;
  plan: string;
  gearList: string[];
  estimatedPrice: string;
  proTip: string;
}

export function AIPlanner() {
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PlanResult | null>(null);

  const handlePlan = async () => {
    if (!description.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const data = await getEventPlan(description);
      setResult(data);
    } catch (error) {
      console.error("Planner Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-blue-50/30 blur-[120px] rounded-full -z-10" />
      
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-[#003791]/30 bg-blue-50 text-[#003791] text-xs font-bold uppercase tracking-[0.2em] mb-6">
              <Sparkles size={14} /> AI Event Architect
            </div>
            <h2 className="text-4xl md:text-6xl font-black uppercase italic mb-6 text-slate-800">
              Plan Your <span className="text-[#003791]">Ultimate</span> Arena
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Describe your event (e.g., "A 30th birthday for 20 people with a focus on F1 racing") and let our AI architect the perfect setup.
            </p>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-[32px] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
            <div className="relative bg-white border border-slate-200 rounded-[32px] p-8 md:p-12 shadow-sm">
              <div className="flex flex-col md:flex-row gap-6">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us about your event... (e.g., 'Office Fun Friday for 50 people with VR and PS5 tournaments')"
                  className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#003791]/50 transition-all min-h-[120px] resize-none"
                />
                <button
                  onClick={handlePlan}
                  disabled={isLoading || !description.trim()}
                  className="md:w-48 bg-[#003791] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:hover:scale-100 flex flex-col items-center justify-center gap-2 py-8 group cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 size={32} className="animate-spin text-white" />
                  ) : (
                    <>
                      <Zap size={32} className="group-hover:scale-110 transition-transform text-white" />
                      <span className="text-sm">Architect Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                className="mt-12 bg-white border border-slate-200 rounded-[40px] p-8 md:p-12 relative overflow-hidden shadow-md"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/40 blur-[100px] -mr-32 -mt-32" />
                
                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-12">
                    <div>
                      <h4 className="text-[#003791] text-xs font-bold uppercase tracking-[0.3em] mb-2 font-mono">Custom Package</h4>
                      <h3 className="text-4xl font-black uppercase italic text-slate-800">{result.packageName}</h3>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 px-6 py-3 rounded-2xl">
                      <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest block mb-1 font-mono">Estimated Price</span>
                      <span className="text-2xl font-black italic text-[#003791]">{result.estimatedPrice}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                    <div>
                      <h5 className="text-slate-800 font-bold uppercase tracking-tight text-sm mb-4 flex items-center gap-2">
                        <Target size={16} className="text-[#003791]" /> The Event Plan
                      </h5>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {result.plan}
                      </p>
                    </div>
                    <div>
                      <h5 className="text-slate-800 font-bold uppercase tracking-tight text-sm mb-4 flex items-center gap-2">
                        <Package size={16} className="text-[#003791]" /> Gear Included
                      </h5>
                      <ul className="space-y-3">
                        {result.gearList.map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-slate-600 text-xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#003791]" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl mb-12 animate-pulse-slow">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-[#003791] shrink-0">
                        <Trophy size={20} />
                      </div>
                      <div>
                        <h5 className="text-[#003791] text-[10px] font-bold uppercase tracking-widest mb-1 font-mono">Pro Architect Tip</h5>
                        <p className="text-slate-700 text-sm italic">"{result.proTip}"</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <a
                      href={`https://wa.me/919711844884?text=${encodeURIComponent(`Hey! I just used your AI Planner for my event: ${result.packageName}. I'm interested in booking!`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-[#003791] text-white px-8 py-4 rounded-full font-black uppercase tracking-widest hover:bg-blue-800 transition-all text-center text-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Book This Plan <ArrowRight size={18} />
                    </a>
                    <button
                      onClick={() => setResult(null)}
                      className="px-8 py-4 rounded-full border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all font-bold uppercase tracking-widest text-sm cursor-pointer"
                    >
                      Reset Architect
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
