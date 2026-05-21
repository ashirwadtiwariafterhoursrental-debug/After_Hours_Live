import { motion } from "motion/react";
import { 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Shield, 
  Users, 
  Plus, 
  Minus, 
  Trophy, 
  Monitor, 
  Gamepad2, 
  MessageSquare,
  ShieldCheck,
  Star,
  Building2,
  Calendar,
  Eye,
  Speaker
} from "lucide-react";
import { useState } from "react";

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

const upsells = [
  { title: "The Champion's Package", price: "+₹1,000", desc: "Custom-engraved medals/trophy for the tournament winner.", icon: Trophy },
  { title: "The Big Screen Upgrade", price: "+₹2,500", desc: "Swap a 43\" TV for the 100-inch Projector setup.", icon: Monitor },
  { title: "Extra Controllers", price: "+₹499 each", desc: "Add more players to the action.", icon: Gamepad2 },
  { title: "Extra Premium Games", price: "+₹199 each", desc: "Choose from our elite library.", icon: Zap },
  { title: "Meta Shots Bat Accessory", price: "+₹299 each", desc: "Immersive VR sports experience.", icon: Zap }
];

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

export function Experiences() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="bg-afterhours-black text-white selection:bg-afterhours-purple selection:text-black">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://picsum.photos/seed/experience-hero/1920/1080?blur=4" 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-40 grayscale"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-linear-to-b from-afterhours-black/80 via-afterhours-black/40 to-afterhours-black" />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <img 
              src="https://i.postimg.cc/wTjysHrn/image.png" 
              alt="After Hours Logo" 
              className="w-24 h-24 mx-auto mb-8 object-contain"
              referrerPolicy="no-referrer"
            />
            <h1 className="text-6xl md:text-8xl font-black uppercase italic leading-none mb-8">
              Turn Your Home Into <br />
              <span className="text-afterhours-purple neon-glow-purple">The Ultimate Arena</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/60 max-w-3xl mx-auto leading-relaxed mb-12">
              Premium At-Home Gaming, Cinema, and VIP Birthday Experiences in Delhi NCR. 
              We bring the tech, the lights, and the staff. You host the ultimate night.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <a 
                href="#packages" 
                className="bg-white text-black px-10 py-5 rounded-full font-black uppercase tracking-widest hover:scale-105 transition-transform"
              >
                Explore Packages
              </a>
              <a 
                href="https://wa.me/919711844884" 
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#90e0d0] text-black px-10 py-5 rounded-full font-black uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2"
              >
                Book Now <MessageSquare size={20} />
              </a>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center p-2">
            <div className="w-1 h-2 bg-afterhours-purple rounded-full" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 border-y border-white/5">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black uppercase italic mb-4">How It Works</h2>
            <p className="text-white/40 uppercase tracking-widest font-bold">Zero Hassle. Pure Adrenaline.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative p-8 bg-white/5 rounded-[32px] border border-white/5"
              >
                <span className="text-6xl font-black text-white/5 absolute top-4 right-8">{step.number}</span>
                <h3 className="text-2xl font-bold uppercase italic mb-4">{step.title}</h3>
                <p className="text-white/40 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section id="packages" className="py-24">
        <div className="container mx-auto px-6">
          {categories.map((category, catIndex) => (
            <div key={category.name} className="mb-32 last:mb-0">
              <div className="max-w-3xl mb-16">
                <h2 className="text-3xl md:text-5xl font-black uppercase italic mb-4">{category.name}</h2>
                <p className="text-white/40 text-lg">{category.description}</p>
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
                        ? `bg-afterhours-gray border-${pkg.accent}/20 hover:border-${pkg.accent}/50 shadow-2xl` 
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {pkg.premium && (
                      <div className={`absolute top-0 right-0 bg-${pkg.accent} text-black px-6 py-2 rounded-bl-2xl font-black uppercase text-xs tracking-widest`}>
                        VIP Choice
                      </div>
                    )}
                    
                    <div className={`absolute -top-24 -right-24 w-64 h-64 bg-${pkg.accent}/5 blur-[100px] rounded-full group-hover:bg-${pkg.accent}/10 transition-colors`} />

                    <div className="relative z-10">
                      <div className="mb-8">
                        <h3 className="text-3xl font-black uppercase italic mb-1">{pkg.title}</h3>
                        {pkg.subtitle && <p className="text-white/40 uppercase tracking-widest text-xs font-bold mb-4">{pkg.subtitle}</p>}
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-black text-white">{pkg.price}</span>
                          <span className="text-white/40 text-sm">{pkg.period}</span>
                        </div>
                      </div>

                      <div className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-sm font-bold uppercase tracking-widest text-white/60 mb-2 italic">The Vibe:</p>
                        <p className="text-white/80">{pkg.vibe}</p>
                      </div>

                      <div className="space-y-4 mb-10">
                        <p className="text-xs font-black uppercase tracking-widest text-white/40">What's Included:</p>
                        {pkg.includes.map((item) => (
                          <div key={item} className="flex items-start gap-3 text-sm text-white/70">
                            <CheckCircle2 size={18} className={`text-${pkg.accent} shrink-0 mt-0.5`} />
                            {item}
                          </div>
                        ))}
                      </div>

                      {pkg.duration && (
                        <div className="mb-10 flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                          <Zap size={20} className={`text-${pkg.accent}`} />
                          <p className="text-sm font-bold uppercase tracking-widest">{pkg.duration}</p>
                        </div>
                      )}

                      <a 
                        href="https://wa.me/919711844884"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-5 rounded-full font-black uppercase tracking-widest text-center block transition-all bg-[#90e0d0] text-black hover:scale-[1.02]"
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

      {/* Upsells */}
      <section className="py-24 bg-white/5">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black uppercase italic mb-4">The VIP Upsells</h2>
            <p className="text-white/40 uppercase tracking-widest font-bold">Level Up Your Experience</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upsells.map((upsell) => (
              <div key={upsell.title} className="p-6 bg-afterhours-black rounded-3xl border border-white/5 flex gap-6 group hover:border-afterhours-purple/30 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-afterhours-purple shrink-0 group-hover:bg-afterhours-purple group-hover:text-black transition-all">
                  <upsell.icon size={24} />
                </div>
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold uppercase italic">{upsell.title}</h4>
                    <span className="text-afterhours-green font-black text-sm">{upsell.price}</span>
                  </div>
                  <p className="text-white/40 text-xs leading-relaxed">{upsell.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Banner */}
      <section className="py-24 border-y border-white/5">
        <div className="container mx-auto px-6">
          <div className="bg-afterhours-purple/10 border border-afterhours-purple/20 rounded-[40px] p-12 md:p-20 flex flex-col md:flex-row items-center gap-12">
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
                <p className="font-black uppercase tracking-widest text-afterhours-purple">Shivani, Co-Founder</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Zero Security Deposit Section */}
      <section className="py-24">
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
              <h2 className="text-3xl md:text-5xl font-black uppercase italic mb-4">Zero Security Deposit</h2>
              <p className="text-white/80 text-lg mb-4">
                Using Your Corporate ID. No Cash Hold. Pure After-Hours Access. 
                Trust Is Our Currency. Pure Play. Zero Hassle.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest">No Cash Hold</span>
                <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest">Pure Play</span>
                <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest">Zero Hassle</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black uppercase italic mb-4">Common Questions</h2>
            <p className="text-white/40 uppercase tracking-widest font-bold">Everything You Need to Know</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white/5 rounded-3xl border border-white/5 overflow-hidden">
                <button 
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-8 flex items-center justify-between text-left"
                >
                  <span className="text-xl font-bold uppercase italic">{faq.q}</span>
                  {openFaq === index ? <Minus size={20} className="text-afterhours-purple" /> : <Plus size={20} className="text-white/40" />}
                </button>
                {openFaq === index && (
                  <div className="px-8 pb-8 text-white/60 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Form */}
      <section className="py-24 bg-afterhours-purple/5">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black uppercase italic mb-4">Request Your Experience</h2>
            <p className="text-white/40 uppercase tracking-widest font-bold">Let's Build Your Arena</p>
          </div>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-4">Name</label>
                <input 
                  type="text" 
                  placeholder="John Doe"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-afterhours-purple transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-4">Phone</label>
                <input 
                  type="tel" 
                  placeholder="+91 98765 43210"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-afterhours-purple transition-colors"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-4">Email</label>
                <input 
                  type="email" 
                  placeholder="john@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-afterhours-purple transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-4">Event Date</label>
                <input 
                  type="date" 
                  onKeyDown={(e) => e.preventDefault()}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-afterhours-purple transition-colors"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-4">Select Your Vibe</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-afterhours-purple transition-colors appearance-none">
                <option className="bg-afterhours-black">The Living Room Arcade</option>
                <option className="bg-afterhours-black">The Next-Gen Night In</option>
                <option className="bg-afterhours-black">The Ultimate Birthday Bash</option>
                <option className="bg-afterhours-black">The VIP Grand Prix</option>
                <option className="bg-afterhours-black">The Backyard Cinema & Co-Op Lounge</option>
              </select>
            </div>
            <button 
              type="submit"
              className="w-full bg-[#90e0d0] text-black py-6 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] transition-transform mt-8"
            >
              Book Now
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

