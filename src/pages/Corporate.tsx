import { motion } from "motion/react";
import { Building2, Trophy, Target, Zap, CheckCircle2, XCircle, Gamepad2, Speaker, Users, Monitor, Camera, Dices } from "lucide-react";

export function Corporate() {
  const packages = [
    {
      title: "The Chill Lounge",
      subtitle: "Best for small teams (10-50 people).",
      price: "₹14,999",
      accent: "afterhours-cyan",
      includes: [
        { text: "1x PS5 Console + 2/4 Controllers", icon: Gamepad2 },
        { text: "1x JBL PartyBox Speaker", icon: Speaker },
        { text: "Uno & Jenga Sets included", icon: Dices },
      ],
      excludes: [
        { text: "No Projector (Client uses office TV)" },
        { text: "No Host (DIY)" },
      ]
    },
    {
      title: "THE CORPORATE ARENA",
      subtitle: "Turn your office into a Stadium. (30-100+ people).",
      price: "₹24,999",
      accent: "afterhours-purple",
      featured: true,
      includes: [
        { text: "120-Inch Giant Screen + 4K Projector", icon: Monitor },
        { text: "Pro-Host (Commentary & Bracket Management)", icon: Users },
        { text: "NEW: MetaShot Cricket / Smart Darts Zone", icon: Zap },
        { text: "Organized FIFA/Tekken Tournament", icon: Trophy },
        { text: "2-Hour High-Intensity Flow", icon: Zap },
        { text: "Basic Media Coverage", icon: Camera },
      ]
    },
    {
      title: "The Future Tech Arena",
      subtitle: "Next-Level Reality. VR & Simulators.",
      price: "₹39,999",
      accent: "afterhours-pink",
      includes: [
        { text: "120-Inch Giant Screen + 4K Projector", icon: Monitor },
        { text: "Pro-Host (Commentary & Bracket Management)", icon: Users },
        { text: "NEW: MetaShot Cricket / Smart Darts Zone", icon: Zap },
        { text: "Organized FIFA/Tekken Tournament", icon: Trophy },
        { text: "2-Hour High-Intensity Flow", icon: Zap },
        { text: "Racing Sim Cockpit (Wheel + Pedals)", icon: Gamepad2 },
        { text: "Premium Cinematic Media Coverage", icon: Camera },
      ]
    }
  ];

  return (
    <div className="pt-32 pb-24">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-32">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex flex-col gap-6 mb-6">
              <img 
                src="https://i.postimg.cc/wTjysHrn/image.png" 
                alt="After Hours Logo" 
                className="w-12 h-12 object-contain"
                referrerPolicy="no-referrer"
              />
              <span className="text-4xl font-black uppercase italic leading-none">
                <span className="text-afterhours-purple">AFT</span><span className="text-white">ER H</span><span className="text-afterhours-cyan">OURS</span>
              </span>
            </div>
            <span className="text-afterhours-purple font-bold uppercase tracking-[0.3em] text-xs mb-6 block">
              B2B Activation Specialists
            </span>
            <h1 className="text-5xl md:text-8xl font-black uppercase italic leading-[0.9] mb-8">
              Corporate <br />
              <span className="text-afterhours-cyan">Activations</span>
            </h1>
            <p className="text-white/60 text-xl leading-relaxed mb-12">
              We build high-adrenaline pop-up arenas directly inside your office. 
              From employee engagement to high-footfall activations, we deliver zero-disruption tech experiences.
              Trusted by premium hubs like Spring House, India Accelerator, and Hub 71.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="https://wa.me/919711844884"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-afterhours-cyan text-black px-10 py-5 rounded-full font-black uppercase tracking-widest hover:scale-105 transition-transform neon-glow-cyan"
              >
                Book a Demo
              </a>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="aspect-video rounded-[40px] overflow-hidden border border-white/10 bg-afterhours-gray shadow-2xl">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/kgmaKS9f67Y?autoplay=1&mute=1&loop=1&playlist=kgmaKS9f67Y"
                title="After Hours Corporate Events"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full object-cover"
              ></iframe>
            </div>
            <div className="absolute -bottom-10 -right-10 bg-afterhours-black p-8 rounded-3xl border border-white/10 shadow-2xl max-w-xs hidden md:block">
              <Building2 className="text-afterhours-purple mb-4" size={32} />
              <p className="text-sm font-medium text-white/80 italic">
                "After Hours transformed our Fun Friday into a legendary tournament. The F1 simulators were the highlight of the year."
              </p>
              <p className="text-[10px] uppercase tracking-widest text-white/40 mt-4">
                — HR Director, Tech Hub
              </p>
            </div>
          </motion.div>
        </div>

        {/* Use Cases */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
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
            <div key={item.title} className="p-10 bg-afterhours-gray rounded-[40px] border border-white/5 hover:border-afterhours-purple/30 transition-all group">
              <item.icon className="text-afterhours-purple mb-6 group-hover:scale-110 transition-transform" size={40} />
              <h3 className="text-2xl font-bold uppercase italic mb-4">{item.title}</h3>
              <p className="text-white/40 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Packages Section */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black uppercase italic mb-4">Corporate Packages</h2>
            <p className="text-white/40 uppercase tracking-widest text-sm">Scalable tech experiences for your workspace</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {packages.map((pkg, i) => (
              <motion.div
                key={pkg.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`relative p-8 md:p-12 rounded-[40px] border transition-all group overflow-hidden ${
                  pkg.featured 
                    ? `bg-afterhours-gray border-${pkg.accent}/20 hover:border-${pkg.accent}/50 shadow-2xl` 
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                {pkg.featured && (
                  <div className={`absolute top-0 right-0 bg-${pkg.accent} text-black px-6 py-2 rounded-bl-2xl font-black uppercase text-[10px] tracking-widest`}>
                    Most Popular
                  </div>
                )}

                <div className="relative z-10">
                  <div className="mb-8">
                    <h3 className="text-2xl font-black uppercase italic mb-2">{pkg.title}</h3>
                    <p className="text-white/40 text-sm mb-6">{pkg.subtitle}</p>
                    <div className="text-4xl font-black text-white">{pkg.price}</div>
                  </div>

                  <div className="space-y-4 mb-10">
                    {pkg.includes.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-sm text-white/70">
                        <CheckCircle2 size={18} className={`text-${pkg.accent} shrink-0 mt-0.5`} />
                        <span>{item.text}</span>
                      </div>
                    ))}
                    {pkg.excludes?.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-sm text-white/30">
                        <XCircle size={18} className="text-red-500/50 shrink-0 mt-0.5" />
                        <span className="line-through">{item.text}</span>
                      </div>
                    ))}
                  </div>

                  <a 
                    href={`https://wa.me/919711844884?text=${encodeURIComponent(`Hi After Hours, I'm interested in the ${pkg.title} package for our corporate event.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-5 rounded-full font-black uppercase tracking-widest text-center block transition-all ${
                      pkg.featured 
                        ? `bg-${pkg.accent} text-black hover:scale-[1.02] neon-glow-${pkg.accent.split('-')[1]}` 
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    Enquiry Now
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Trusted By */}
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 mb-12">Trusted By Industry Leaders</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40 grayscale">
            <span className="text-2xl font-black italic uppercase tracking-tighter hover:text-afterhours-cyan transition-colors">Spring House</span>
            <span className="text-2xl font-black italic uppercase tracking-tighter hover:text-afterhours-purple transition-colors">India Accelerator</span>
            <span className="text-2xl font-black italic uppercase tracking-tighter hover:text-afterhours-pink transition-colors">Hub 71</span>
            <span className="text-2xl font-black italic uppercase tracking-tighter hover:text-afterhours-cyan transition-colors">Co-Works</span>
          </div>
        </div>
      </div>
    </div>
  );
}
