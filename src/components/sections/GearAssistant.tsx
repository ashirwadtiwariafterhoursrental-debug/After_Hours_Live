import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Loader2, Zap, Target, Search, Check } from "lucide-react";

import { getGearRecommendation } from "../../services/gemini";

interface GearRecommendation {
  recommendation: string;
  reasoning: string;
  itemIds: string[];
}

interface GearAssistantProps {
  onAddItems: (itemIds: string[]) => void;
}

export function GearAssistant({ onAddItems }: GearAssistantProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GearRecommendation | null>(null);

  const handleAsk = async () => {
    if (!query.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const data = await getGearRecommendation(query);
      setResult(data);
    } catch (error) {
      console.error("Gear Assistant Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-24">
      <div className="bg-slate-50 border border-slate-200 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-xs">
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#003791]/10 flex items-center justify-center text-[#003791]">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase italic text-slate-800">AI Gear Assistant</h3>
              <p className="text-slate-600 text-xs uppercase tracking-widest font-semibold">Not sure what to pick? Ask me.</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              placeholder="e.g., 'I want to host a movie night for 5 friends' or 'I love racing games'"
              className="flex-1 bg-white border border-slate-200 rounded-2xl px-6 py-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#003791] focus:ring-1 focus:ring-[#003791] transition-all"
            />
            <button
              onClick={handleAsk}
              disabled={isLoading || !query.trim()}
              className="bg-[#003791] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-800 transition duration-300 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
              Ask AI
            </button>
          </div>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-8 pt-8 border-t border-slate-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-[#003791] text-[10px] font-bold uppercase tracking-widest mb-2">Recommendation</h4>
                    <p className="text-slate-800 font-bold text-lg mb-4">{result.recommendation}</p>
                    <p className="text-slate-600 text-sm leading-relaxed">{result.reasoning}</p>
                  </div>
                  <div className="flex flex-col justify-center">
                    <button
                      onClick={() => {
                        onAddItems(result.itemIds);
                        setResult(null);
                        setQuery("");
                      }}
                      className="w-full bg-white border border-slate-200 hover:border-[#003791] hover:bg-slate-50 transition-all p-6 rounded-2xl flex items-center justify-between group cursor-pointer shadow-xs"
                    >
                      <div className="text-left">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Ready to book?</span>
                        <span className="text-slate-800 font-black uppercase italic group-hover:text-[#003791] transition-colors">Add Recommended Gear to Cart</span>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-[#003791]/10 text-[#003791] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Zap size={24} />
                      </div>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
