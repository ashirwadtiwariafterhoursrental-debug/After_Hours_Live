import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { ArrowRight, Gamepad, Users, Building2, Package } from "lucide-react";

const offerings = [
  {
    title: "Personal Experiences",
    description: "VIP birthday arenas, house party tech bundles, and private gaming nights for high-net-worth individuals.",
    icon: Users,
    color: "afterhours-cyan",
    link: "/experiences",
    image: "https://picsum.photos/seed/party/800/600",
    priority: "70%"
  },
  {
    title: "Corporate Events",
    description: "High-adrenaline employee engagement and team-building activations for premium workspaces.",
    icon: Building2,
    color: "afterhours-purple",
    link: "/corporate",
    image: "https://picsum.photos/seed/office/800/600",
    priority: "20%"
  },
  {
    title: "Equipment Rentals",
    description: "Premium PS5, Projectors, and JBL sound systems for those who just need the gear.",
    icon: Package,
    color: "white",
    link: "/rentals",
    image: "https://picsum.photos/seed/ps5/800/600",
    priority: "10%"
  }
];

export function Offerings() {
  return (
    <section className="py-24 bg-afterhours-gray">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-6xl font-black uppercase italic mb-6">
              Elite <span className="text-afterhours-cyan">Offerings</span>
            </h2>
            <p className="text-white/50 text-lg">
              We don't just rent equipment—we build premium, high-adrenaline pop-up arenas.
            </p>
          </div>
          <Link to="/experiences" className="text-afterhours-cyan font-bold uppercase tracking-widest flex items-center gap-2 group">
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
              className="group relative bg-afterhours-black border border-white/5 rounded-3xl overflow-hidden hover:border-white/20 transition-all"
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
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-${item.color}/10 text-${item.color}`}>
                  <item.icon size={24} />
                </div>
                <h3 className="text-2xl font-bold uppercase italic mb-4">{item.title}</h3>
                <p className="text-white/50 mb-8 line-clamp-2">{item.description}</p>
                <Link
                  to={item.link}
                  className="inline-flex items-center gap-2 font-bold uppercase tracking-widest text-sm hover:text-afterhours-cyan transition-colors"
                >
                  Learn More <ArrowRight size={16} />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
