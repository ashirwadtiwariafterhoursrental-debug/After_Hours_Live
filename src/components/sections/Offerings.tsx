import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { ArrowRight, Users, Building2, Package } from "lucide-react";

const offerings = [
  {
    title: "Personal Experiences",
    description: "VIP birthday arenas, house party tech bundles, and private gaming nights for high-net-worth individuals.",
    icon: Users,
    link: "/experiences",
    image: "https://picsum.photos/seed/party/800/600",
  },
  {
    title: "Corporate Events",
    description: "High-adrenaline employee engagement and team-building activations for premium workspaces.",
    icon: Building2,
    link: "/corporate",
    image: "https://picsum.photos/seed/office/800/600",
  },
  {
    title: "Equipment Rentals",
    description: "Premium PS5, Projectors, and JBL sound systems for those who just need the gear.",
    icon: Package,
    link: "/rentals",
    image: "https://picsum.photos/seed/ps5/800/600",
  }
];

export function Offerings() {
  return (
    <section className="py-24 bg-slate-50 border-t border-slate-200">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-6xl font-black uppercase italic text-slate-800 mb-6">
              Elite <span className="text-[#003791]">Offerings</span>
            </h2>
            <p className="text-slate-600 text-lg">
              We don't just rent equipment—we build premium, high-adrenaline pop-up arenas.
            </p>
          </div>
          <Link to="/experiences" className="text-[#003791] hover:text-blue-900 font-bold uppercase tracking-widest flex items-center gap-2 group transition-colors">
            View All Packages <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {offerings.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative bg-white border border-slate-200 rounded-3xl overflow-hidden hover:border-[#003791]/30 transition-all shadow-sm hover:shadow-md"
            >
              <div className="aspect-video overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-8">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-blue-50 text-[#003791] border border-blue-100">
                  <item.icon size={24} />
                </div>
                <h3 className="text-2xl font-black uppercase italic text-slate-800 mb-4">{item.title}</h3>
                <p className="text-slate-600 mb-8 line-clamp-2 text-sm">{item.description}</p>
                <Link
                  to={item.link}
                  className="inline-flex items-center gap-2 font-black uppercase tracking-widest text-xs text-[#003791] hover:text-blue-900 transition-colors"
                >
                  <span>Learn More</span> <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
