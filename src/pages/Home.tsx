import { motion } from "motion/react";
import { Hero } from "@/src/components/sections/Hero";
import { QuickSelector } from "@/src/components/sections/QuickSelector";
import { AIPlanner } from "@/src/components/sections/AIPlanner";
import { Process } from "@/src/components/sections/Process";
import { Gallery } from "@/src/components/sections/Gallery";
import { Link } from "react-router-dom";
import { ArrowRight, Instagram, Mail, Phone, Star, Users, Building2, Calendar, Zap, Target, Trophy } from "lucide-react";

export function Home() {
  return (
    <main>
      <Hero />
      <QuickSelector />
      <AIPlanner />
      <Process />
      <Gallery />

      {/* Your After-Hours HQ Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="p-12 md:p-20 rounded-[60px] bg-afterhours-gray border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-afterhours-purple/10 blur-[120px] -mr-48 -mt-48"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-afterhours-cyan/10 blur-[120px] -ml-48 -mb-48"></div>
            
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
              to="/corporate" 
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
