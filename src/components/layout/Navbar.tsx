import { motion } from "motion/react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/src/lib/utils";
import { Menu, X, Gamepad2 } from "lucide-react";
import { useState, useEffect } from "react";

const navLinks = [
  { name: "Experiences", path: "/experiences" },
  { name: "Rentals", path: "/rentals" },
  { name: "Corporate", path: "/corporate" },
  { name: "Contact", path: "/contact" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4",
        scrolled ? "bg-afterhours-black/80 backdrop-blur-md border-b border-white/10" : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-4 group">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute inset-0 bg-afterhours-cyan/20 rounded-full blur-md group-hover:bg-afterhours-purple/30 transition-colors" />
            <img 
              src="https://i.postimg.cc/wTjysHrn/image.png" 
              alt="After Hours Logo" 
              className="relative w-10 h-10 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tighter uppercase italic leading-none">
              <span className="text-afterhours-purple">AFT</span><span className="text-white">ER H</span><span className="text-afterhours-cyan">OURS</span>
            </span>
            <span className="text-[7px] uppercase tracking-[0.3em] text-white/40 font-bold">
              Premium Experiences. Delivered.
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={cn(
                "text-sm font-medium uppercase tracking-widest hover:text-afterhours-cyan transition-colors",
                location.pathname === link.path ? "text-afterhours-cyan" : "text-white/70"
              )}
            >
              {link.name}
            </Link>
          ))}
          <a
            href="https://wa.me/919711844884"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-afterhours-purple text-white px-6 py-2 rounded-full text-sm font-bold uppercase tracking-widest hover:scale-105 transition-transform neon-glow-purple"
          >
            Book Now
          </a>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 bg-afterhours-black border-b border-white/10 p-6 flex flex-col gap-6 md:hidden"
        >
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className="text-lg font-bold uppercase tracking-widest"
            >
              {link.name}
            </Link>
          ))}
          <a
            href="https://wa.me/919711844884"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="bg-afterhours-cyan text-black text-center py-4 rounded-xl font-bold uppercase tracking-widest"
          >
            Book Now
          </a>
        </motion.div>
      )}
    </nav>
  );
}
