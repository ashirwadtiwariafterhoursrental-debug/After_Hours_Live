import { useState } from "react";
import { motion } from "motion/react";
import { 
  Building2, 
  Trophy, 
  Target, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  Gamepad2, 
  Speaker, 
  Users, 
  Monitor, 
  Camera, 
  Dices,
  ArrowRight,
  Plus,
  Minus,
  MessageSquare,
  ShieldCheck,
  Calendar,
  Eye,
  Star
} from "lucide-react";

// Personal Experience Steps
const steps = [
  {
    number: "01",
    title: "Choose Your Vibe",
    desc: "Select the package that fits your celebration style."
  },
  {
    number: "02",
    title: "Secure Your Date",
    desc: "Quick KYC / Corporate ID verification on WhatsApp."
  },
  {
    number: "03",
    title: "White-Glove Setup",
    desc: "Our crew delivers, installs, and tests everything in your living room."
  }
];

// Personal Experience Categories & Packages
const categories = [
  {
    name: "The 'Drop-Off' House Party Series",
    description: "Zero effort. Maximum fun for smaller gatherings. We drop it off Friday, pick it up Monday.",
    type: "unstaffed",
    packages: [
      {
        title: "The Living Room Arcade",
        price: "₹3,500 - ₹5,000",
        period: "/ weekend",
        vibe: "High-stakes multiplayer gaming for the weekend.",
        includes: [
          "1x PS5 Console",
          "2x Wireless Controllers",
          "1 Premium Game of your choice",
          "100+ included via PS Plus",
          "HDMI/Power cables"
        ],
        accent: "afterhours-cyan"
      },
      {
        title: "The Next-Gen Night In",
        price: "₹6,500 - ₹8,000",
        period: "/ weekend",
        vibe: "The ultimate tech upgrade. Console racing plus virtual reality.",
        includes: [
          "1x PS5 Console (with 2 Controllers)",
          "1x Meta Quest VR Headset",
          "Pre-loaded with Beat Saber, Superhot"
        ],
        accent: "afterhours-purple"
      }
    ]
  },
  {
    name: "The VIP Hosted Arenas",
    description: "For the most important personal celebrations. We bring the gear, the atmosphere, and the staff.",
    type: "staffed",
    packages: [
      {
        title: "The Ultimate Birthday Bash",
        subtitle: "Organised House Party",
        price: "₹12,000 - ₹15,000",
        period: "",
        vibe: "We bring a futuristic arcade to your backyard. You relax, our team runs the chaos.",
        includes: [
          "2x PS5 Stations",
          "1x VR Casting Station",
          "Ambient LED floor lighting",
          "1 Dedicated Game Master"
        ],
        duration: "3 to 4 Hours (Extended hours available)",
        accent: "afterhours-green",
        premium: true
      },
      {
        title: "The VIP Grand Prix",
        price: "₹20,000 - ₹25,000+",
        period: "",
        vibe: "The Instagram-worthy ultimate party centerpiece. High adrenaline luxury.",
        includes: [
          "1x F1 Racing Simulator Setup",
          "2x PS5 Stations",
          "2x VR Stations",
          "2 Dedicated Game Masters",
          "Bonus: Dedicated cameraman for exclusive Insta and memory content"
        ],
        duration: "4 Hours",
        accent: "afterhours-pink",
        premium: true
      }
    ]
  },
  {
    name: "Stadium & Cinema Series",
    description: "Massive screens for the ultimate viewing and gaming experience.",
    type: "cinema",
    packages: [
      {
        title: "The Backyard Cinema & Co-Op Lounge",
        price: "₹8,000 - ₹10,000",
        period: "",
        vibe: "Massive screens for IPL matches or movies, with gaming on the side.",
        includes: [
          "100-inch HD Projector Setup",
          "Premium JBL Soundbar",
          "1x PS5 Station set up on the side"
        ],
        duration: "4 to 6 Hours",
        accent: "white"
      }
    ]
  }
];

// Personal Experience Upsells
const upsells = [
  { title: "The Champion's Package", price: "+₹1,000", desc: "Custom-engraved medals/trophy for the tournament winner.", icon: Trophy },
  { title: "The Big Screen Upgrade", price: "+₹2,500", desc: "Swap a 43\" TV for the 100-inch Projector setup.", icon: Monitor },
  { title: "Extra Controllers", price: "+₹499 each", desc: "Add more players to the action.", icon: Gamepad2 },
  { title: "Extra Premium Games", price: "+₹199 each", desc: "Choose from our elite library.", icon: Zap },
  { title: "Meta Shots Bat Accessory", price: "+₹299 each", desc: "Immersive VR sports experience.", icon: Zap }
];

// Personal Experience FAQs
const faqs = [
  {
    q: "Is there a security deposit?",
    a: "We offer a zero-deposit policy for verified corporate IDs."
  },
  {
    q: "Do you stay at the party?",
    a: "For our Drop-Off series, we leave you to the fun. For VIP Hosted Arenas, our Game Masters stay on-site to run the event seamlessly."
  },
  {
    q: "What areas do you cover?",
    a: "We proudly cover the entire Delhi NCR and Gurgaon region."
  }
];

// Corporate Packages
const corporatePackages = [
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

export function Experiences() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="bg-afterhours-black text-white selection:bg-afterhours-purple selection:text-black min-h-screen">
      
      {/* ========================================== */}
      {/* SECTION 1: CORPORATE EXPERIENCES & PACKAGES (AT THE TOP) */}
      {/* ========================================== */}
      <section className="pt-32 pb-24 border-b border-white/5 bg-gradient-to-b from-afterhours-black via-black/80 to-afterhours-black/90">
        <div id="corporate-experiences-block" className="container mx-auto px-6">
          
          {/* Corporate Hero Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-28">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
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
              <p className="text-white/60 text-lg leading-relaxed mb-12">
                We build high-adrenaline pop-up arenas directly inside your office. 
                From employee engagement to high-footfall activations, we deliver zero-disruption tech experiences.
                Trusted by premium hubs like Spring House, India Accelerator, and Hub 71.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="https://wa.me/919711844884"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-afterhours-cyan text-black px-10 py-5 rounded-full font-black uppercase tracking-widest hover:scale-105 transition-transform inline-block text-center cursor-pointer neon-glow-cyan"
                >
                  Book a Demo
                </a>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
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

          {/* Corporate Use Cases Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-28">
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
              <div key={item.title} className="p-10 bg-afterhours-gray/60 backdrop-blur-sm rounded-[32px] border border-white/5 hover:border-afterhours-purple/30 transition-all group">
                <item.icon className="text-afterhours-purple mb-6 group-hover:scale-110 transition-transform" size={40} />
                <h3 className="text-2xl font-bold uppercase italic mb-4">{item.title}</h3>
                <p className="text-white/40 leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Corporate Packages */}
          <div className="mb-28">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-black uppercase italic mb-3">Corporate Packages</h2>
              <p className="text-white/40 uppercase tracking-widest text-xs font-bold font-mono">Scalable tech experiences for your workspace</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {corporatePackages.map((pkg, i) => (
                <motion.div
                  key={pkg.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className={`relative p-8 md:p-12 rounded-[40px] border transition-all group overflow-hidden ${
                    pkg.featured 
                      ? 'bg-afterhours-gray border-afterhours-purple/20 hover:border-afterhours-purple/50 shadow-2xl shadow-afterhours-purple/5' 
                      : 'bg-white/[0.03] border-white/15 hover:border-white/30'
                  }`}
                >
                  {pkg.featured && (
                    <div className="absolute top-0 right-0 bg-afterhours-purple text-white px-6 py-2 rounded-bl-2xl font-black uppercase text-[10px] tracking-widest">
                      Most Popular
                    </div>
                  )}

                  <div className="relative z-10">
                    <div className="mb-8">
                      <h3 className="text-2xl font-black uppercase italic mb-2">{pkg.title}</h3>
                      <p className="text-white/40 text-xs mb-6 h-10">{pkg.subtitle}</p>
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
                      href={`https://wa.me/919711844884?text=${encodeURIComponent(`Hi After Hours, I'm interested in the B2B Corporate ${pkg.title} events package.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full py-5 rounded-full font-black uppercase tracking-widest text-center block transition-all text-xs ${
                        pkg.featured 
                          ? 'bg-afterhours-purple text-white hover:scale-[1.02] neon-glow-purple' 
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

          {/* Trusted By logo lists */}
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 mb-8 font-mono">Trusted By Industry Leaders</p>
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-30 grayscale hover:opacity-50 transition-opacity">
              <span className="text-xl md:text-2xl font-black italic uppercase tracking-tighter hover:text-afterhours-cyan transition-colors">Spring House</span>
              <span className="text-xl md:text-2xl font-black italic uppercase tracking-tighter hover:text-afterhours-purple transition-colors">India Accelerator</span>
              <span className="text-xl md:text-2xl font-black italic uppercase tracking-tighter hover:text-afterhours-pink transition-colors">Hub 71</span>
              <span className="text-xl md:text-2xl font-black italic uppercase tracking-tighter hover:text-afterhours-cyan transition-colors">Co-Works</span>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================== */}
      {/* SLEEK VISUAL DIVIDER & TRANSITION BANNER */}
      {/* ========================================== */}
      <div className="relative py-24 px-6 overflow-hidden bg-black">
        <div className="absolute inset-0 bg-linear-to-r from-afterhours-purple/10 via-afterhours-cyan/10 to-afterhours-pink/10 opacity-30" />
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center text-center relative z-10">
          <div className="h-[1px] w-48 bg-gradient-to-r from-transparent via-afterhours-purple to-transparent mb-8" />
          <span className="text-[10px] uppercase font-bold tracking-[0.45em] text-afterhours-purple mb-4 bg-afterhours-purple/10 px-5 py-2 rounded-full border border-afterhours-purple/20 font-mono">
            Private Residentials
          </span>
          <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white leading-none">
            At-Home Experience <br />
            <span className="text-afterhours-cyan">Arena Series</span>
          </h2>
          <p className="text-[11px] md:text-xs text-white/40 tracking-widest uppercase font-mono mt-4">
            Bringing the premium tech-lounge into your living room
          </p>
          <div className="h-[1px] w-48 bg-gradient-to-r from-transparent via-afterhours-cyan to-transparent mt-8" />
        </div>
      </div>

      {/* ========================================== */}
      {/* SECTION 2: PERSONAL & INDIVIDUAL EXPERIENCES DIRECTLY BELOW */}
      {/* ========================================== */}
      
      {/* How It Works section for residential */}
      <section className="py-24 border-y border-white/5 bg-gradient-to-b from-black to-afterhours-black/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20 animate-fade-in">
            <h2 className="text-4xl md:text-6xl font-black uppercase italic mb-4">How It Works</h2>
            <p className="text-white/40 uppercase tracking-widest font-bold text-xs font-mono">Zero Hassle. Pure Adrenaline.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative p-8 bg-white/[0.02] rounded-[32px] border border-white/5"
              >
                <span className="text-6xl font-black text-white/5 absolute top-4 right-8">{step.number}</span>
                <h3 className="text-2xl font-bold uppercase italic mb-4">{step.title}</h3>
                <p className="text-white/40 leading-relaxed text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Individual Vibe Packages */}
      <section id="packages" className="py-24 bg-afterhours-black">
        <div className="container mx-auto px-6">
          {categories.map((category, catIndex) => (
            <div key={category.name} className="mb-32 last:mb-0">
              <div className="max-w-3xl mb-16">
                <span className="text-[10px] text-afterhours-purple tracking-[0.3em] font-black uppercase mb-2 block font-mono">Series {catIndex + 1}</span>
                <h2 className="text-3xl md:text-5xl font-black uppercase italic mb-4">{category.name}</h2>
                <p className="text-white/45 text-base md:text-lg leading-relaxed">{category.description}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {category.packages.map((pkg, pkgIndex) => (
                  <motion.div
                    key={pkg.title}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: pkgIndex * 0.1 }}
                    viewport={{ once: true }}
                    className={`relative p-8 md:p-12 rounded-[40px] border transition-all group overflow-hidden ${
                      pkg.premium 
                        ? 'bg-afterhours-gray border-afterhours-green/20 hover:border-afterhours-green/50 shadow-2xl shadow-afterhours-green/5' 
                        : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                    }`}
                  >
                    {pkg.premium && (
                      <div className="absolute top-0 right-0 bg-[#25D366] text-black px-6 py-2 rounded-bl-2xl font-black uppercase text-[10px] tracking-widest">
                        VIP Choice
                      </div>
                    )}
                    
                    <div className={`absolute -top-24 -right-24 w-64 h-64 bg-white/5 blur-[100px] rounded-full group-hover:bg-white/10 transition-colors`} />

                    <div className="relative z-10">
                      <div className="mb-8">
                        <h3 className="text-3xl font-black uppercase italic mb-1">{pkg.title}</h3>
                        {pkg.subtitle && <p className="text-white/40 uppercase tracking-widest text-[10px] font-bold mb-4 font-mono">{pkg.subtitle}</p>}
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-4xl font-black text-white">{pkg.price}</span>
                          <span className="text-white/40 text-xs font-mono">{pkg.period}</span>
                        </div>
                      </div>

                      <div className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1.5 italic font-mono">The Vibe:</p>
                        <p className="text-white/80 text-xs leading-relaxed">{pkg.vibe}</p>
                      </div>

                      <div className="space-y-4 mb-10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 font-mono">What's Included:</p>
                        {pkg.includes.map((item) => (
                          <div key={item} className="flex items-start gap-3 text-sm text-white/70">
                            <CheckCircle2 size={16} className={`text-afterhours-cyan shrink-0 mt-0.5`} />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>

                      {pkg.duration && (
                        <div className="mb-10 flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                          <Zap size={16} className="text-afterhours-pink" />
                          <p className="text-xs font-bold uppercase tracking-widest font-mono text-white/80">{pkg.duration}</p>
                        </div>
                      )}

                      <a 
                        href={`https://wa.me/919711844884?text=${encodeURIComponent(`Hi After Hours, I want to book ${pkg.title} experience vibe for our residential celebration.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-5 rounded-full font-black uppercase tracking-widest text-center block transition-all bg-[#90e0d0] text-black hover:scale-[1.02] text-xs cursor-pointer"
                      >
                        Book This Vibe
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Upsells Addons */}
      <section className="py-24 bg-white/[0.01] border-y border-white/5">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black uppercase italic mb-4">The VIP Upsells</h2>
            <p className="text-white/40 uppercase tracking-widest font-bold text-xs font-mono">Level Up Your Experience</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upsells.map((upsell) => (
              <div key={upsell.title} className="p-6 bg-afterhours-black rounded-3xl border border-white/5 flex gap-6 group hover:border-afterhours-purple/30 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center text-afterhours-purple shrink-0 group-hover:bg-afterhours-purple group-hover:text-black transition-all">
                  <upsell.icon size={22} />
                </div>
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold uppercase italic text-sm">{upsell.title}</h4>
                    <span className="text-afterhours-green font-black text-xs font-mono">{upsell.price}</span>
                  </div>
                  <p className="text-white/45 text-xs leading-relaxed">{upsell.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founders Trust Banner */}
      <section className="py-24 bg-afterhours-black">
        <div className="container mx-auto px-6">
          <div className="bg-afterhours-purple/10 border border-afterhours-purple/15 rounded-[40px] p-12 md:p-20 flex flex-col md:flex-row items-center gap-12">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-afterhours-purple shrink-0">
              <img 
                src="https://picsum.photos/seed/shivani/400/400" 
                alt="Shivani, Co-Founder" 
                className="w-full h-full object-cover grayscale"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h2 className="text-3xl md:text-5xl font-black uppercase italic mb-8">Trusted by the Best</h2>
              <blockquote className="text-xl md:text-2xl text-white/80 italic leading-relaxed mb-8">
                "Major tech companies and community houses like Spring House trust After Hours for their zero-hassle event experiences."
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="w-12 h-1 bg-afterhours-purple" />
                <p className="font-black uppercase tracking-widest text-afterhours-purple text-xs font-mono">Shivani, Co-Founder</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Zero Security Deposit Guard */}
      <section className="py-24 border-t border-white/5">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-12 rounded-[40px] bg-linear-to-r from-afterhours-purple/20 to-afterhours-cyan/20 border-2 border-white/10 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden"
          >
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-3xl bg-afterhours-black border border-afterhours-pink/50 flex items-center justify-center neon-glow-pink">
                <ShieldCheck size={64} className="text-afterhours-pink" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-black uppercase italic mb-4">Zero Security Deposit</h2>
              <p className="text-white/80 text-base leading-relaxed mb-4">
                Using Your Corporate ID. No Cash Hold. Pure After-Hours Access. 
                Trust Is Our Currency. Pure Play. Zero Hassle.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest font-mono">No Cash Hold</span>
                <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest font-mono">Pure Play</span>
                <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest font-mono">Zero Hassle</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-24 bg-white/[0.01] border-t border-white/5">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black uppercase italic mb-4">Common Questions</h2>
            <p className="text-white/40 uppercase tracking-widest font-bold text-xs font-mono">Everything You Need to Know</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white/5 rounded-3xl border border-white/5 overflow-hidden">
                <button 
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-8 flex items-center justify-between text-left cursor-pointer"
                >
                  <span className="text-lg font-bold uppercase italic">{faq.q}</span>
                  {openFaq === index ? <Minus size={18} className="text-afterhours-purple" /> : <Plus size={18} className="text-white/40" />}
                </button>
                {openFaq === index && (
                  <div className="px-8 pb-8 text-white/50 leading-relaxed text-sm">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final booking Request Form */}
      <section className="py-24 bg-afterhours-purple/[0.03] border-t border-white/5">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black uppercase italic mb-4 animate-pulse">Request Your Experience</h2>
            <p className="text-white/40 uppercase tracking-widest font-bold text-xs font-mono">Let's Build Your Arena</p>
          </div>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-4 font-mono">Name</label>
                <input 
                  type="text" 
                  placeholder="John Doe"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-afterhours-purple transition-colors text-xs"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-4 font-mono">Phone</label>
                <input 
                  type="tel" 
                  placeholder="+91 98765 43210"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-afterhours-purple transition-colors text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-4 font-mono">Email</label>
                <input 
                  type="email" 
                  placeholder="john@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-afterhours-purple transition-colors text-xs"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-4 font-mono">Event Date</label>
                <input 
                  type="date" 
                  onKeyDown={(e) => e.preventDefault()}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-afterhours-purple transition-colors text-xs"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-4 font-mono font-bold text-afterhours-cyan">Select Your Celebration vibe</label>
              <select className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-afterhours-purple transition-colors appearance-none text-xs text-white">
                <option className="bg-afterhours-black text-white">The Living Room Arcade</option>
                <option className="bg-afterhours-black text-white">The Next-Gen Night In</option>
                <option className="bg-afterhours-black text-white">The Ultimate Birthday Bash</option>
                <option className="bg-afterhours-black text-white">The VIP Grand Prix</option>
                <option className="bg-afterhours-black text-white">The Backyard Cinema & Co-Op Lounge</option>
              </select>
            </div>
            <button 
              type="submit"
              className="w-full bg-[#90e0d0] text-black py-6 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.01] transition-transform mt-8 text-xs cursor-pointer shadow-[0_4px_15px_rgba(144,224,208,0.2)]"
            >
              Book Now ➔
            </button>
          </form>
        </div>
      </section>

    </div>
  );
}
