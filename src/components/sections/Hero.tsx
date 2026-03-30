import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { ArrowRight, Zap, Trophy, Users } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-afterhours-purple/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-afterhours-cyan/20 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay" />
      </div>

      <div className="container mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex flex-col items-center justify-center gap-8 mb-8">
            <img 
              src="https://i.postimg.cc/wTjysHrn/image.png" 
              alt="After Hours Logo" 
              className="w-20 h-20 md:w-24 md:h-24 object-contain"
              referrerPolicy="no-referrer"
            />
            <span className="text-4xl md:text-8xl font-black uppercase italic leading-none tracking-tighter">
              <span className="text-afterhours-purple">AFT</span><span className="text-white">ER H</span><span className="text-afterhours-cyan">OURS</span>
            </span>
          </div>
          <span className="inline-block px-4 py-1 rounded-full border border-afterhours-cyan/30 bg-afterhours-cyan/10 text-afterhours-cyan text-xs font-bold uppercase tracking-[0.2em] mb-6">
            Delhi NCR's Premier Event Agency
          </span>
          <h1 className="text-6xl md:text-8xl font-black uppercase leading-[0.9] mb-8 italic">
            Premium <span className="text-afterhours-cyan">Gaming Assets</span> <br />
            on <span className="text-afterhours-purple">Rent.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-white/60 text-lg md:text-xl mb-12 font-medium">
            Delhi NCR's high-end experiential agency. We specialize in premium gaming assets on rent for birthday parties, house parties, and high-impact corporate events.
          </p>
        </motion.div>

        {/* Stats / Trust */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/10 pt-12"
        >
          <div className="flex flex-col items-center">
            <Zap className="text-afterhours-cyan mb-2" size={24} />
            <span className="text-2xl font-bold italic uppercase">500+</span>
            <span className="text-[10px] uppercase tracking-widest text-white/40">Events Hosted</span>
          </div>
          <div className="flex flex-col items-center">
            <Users className="text-afterhours-purple mb-2" size={24} />
            <span className="text-2xl font-bold italic uppercase">VIP</span>
            <span className="text-[10px] uppercase tracking-widest text-white/40">Private Setups</span>
          </div>
          <div className="flex flex-col items-center">
            <Trophy className="text-afterhours-cyan mb-2" size={24} />
            <span className="text-2xl font-bold italic uppercase">Zero</span>
            <span className="text-[10px] uppercase tracking-widest text-white/40">Disruption Policy</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-afterhours-purple mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="6" y1="12" x2="10" y2="12" />
                <line x1="8" y1="10" x2="8" y2="14" />
                <line x1="15" y1="13" x2="15.01" y2="13" />
                <line x1="18" y1="11" x2="18.01" y2="11" />
                <rect width="20" height="12" x="2" y="6" rx="2" />
              </svg>
            </div>
            <span className="text-2xl font-bold italic uppercase">Elite</span>
            <span className="text-[10px] uppercase tracking-widest text-white/40">Gaming Tech</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Gamepad2({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="6" y1="12" x2="10" y2="12" />
      <line x1="8" y1="10" x2="8" y2="14" />
      <line x1="15" y1="13" x2="15.01" y2="13" />
      <line x1="18" y1="11" x2="18.01" y2="11" />
      <rect width="20" height="12" x="2" y="6" rx="2" />
    </svg>
  );
}
