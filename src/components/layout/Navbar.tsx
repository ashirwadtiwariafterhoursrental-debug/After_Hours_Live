import { motion, AnimatePresence } from "motion/react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/src/lib/utils";
import { Menu, X, Gamepad2, User, PartyPopper, Building2 } from "lucide-react";
import { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "../../firebase";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "Rentals", path: "/rentals" },
  { name: "Experiences", path: "/experiences" },
  { name: "Blog", path: "/blog" },
  { name: "Partner Portal", path: "/partner-dashboard" },
  { name: "Contact", path: "/contact" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
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
          {currentUser ? (
            <Link
              to="/profile"
              className="text-xs font-black uppercase tracking-widest hover:text-afterhours-cyan transition-colors flex items-center gap-1.5 border border-white/10 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10"
              title="My Profile"
            >
              <User size={12} className="text-afterhours-purple" />
              <span>My Account</span>
            </Link>
          ) : (
            <Link
              to="/customer-login"
              className="text-xs font-black uppercase tracking-widest hover:text-afterhours-cyan transition-colors flex items-center gap-1.5 border border-white/10 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10"
            >
              <span>Login / Sign Up</span>
            </Link>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-afterhours-purple text-white px-6 py-2 rounded-full text-sm font-bold uppercase tracking-widest hover:scale-105 transition-transform neon-glow-purple cursor-pointer font-sans"
          >
            Book Now
          </button>
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
          {currentUser ? (
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="text-lg font-bold uppercase tracking-widest text-[#90e0d0] flex items-center gap-2"
            >
              <User size={18} className="text-afterhours-purple" />
              <span>My Account</span>
            </Link>
          ) : (
            <Link
              to="/customer-login"
              onClick={() => setIsOpen(false)}
              className="text-lg font-bold uppercase tracking-widest text-[#90e0d0]"
            >
              <span>Login / Sign Up</span>
            </Link>
          )}
          <button
            onClick={() => {
              setIsOpen(false);
              setIsModalOpen(true);
            }}
            className="bg-afterhours-cyan text-black text-center py-4 rounded-xl font-bold uppercase tracking-widest cursor-pointer w-full text-sm font-sans"
          >
            Book Now
          </button>
        </motion.div>
      )}

      {/* INTELLIGENT ROUTING MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-2xl bg-afterhours-gray border border-white/10 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl z-10"
            >
              {/* Decorative Glow */}
              <div className="absolute top-0 right-0 h-40 w-40 bg-afterhours-purple/10 blur-3xl rounded-full pointer-events-none" />
              <div className="absolute bottom-0 left-0 h-40 w-40 bg-afterhours-cyan/10 blur-3xl rounded-full pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors cursor-pointer p-1.5 rounded-full hover:bg-white/5"
              >
                <X size={20} />
              </button>

              {/* Header */}
              <div className="text-center mb-8">
                <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-afterhours-cyan font-bold block mb-2">
                  Plan Your Experience
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold uppercase italic font-display text-white tracking-wider">
                  What are you planning?
                </h2>
                <p className="text-xs text-white/50 mt-2 font-mono">
                  Select a category to explore bespoke options.
                </p>
              </div>

              {/* Grid of Choices */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-20">
                {/* Choice 1: Premium Rentals */}
                <Link
                  to="/rentals"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-afterhours-cyan rounded-2xl p-5 text-center flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-1 group"
                >
                  <div className="bg-afterhours-cyan/10 p-3 rounded-xl border border-afterhours-cyan/10 group-hover:bg-afterhours-cyan/20 transition-all">
                    <Gamepad2 className="text-afterhours-cyan shrink-0" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase text-white tracking-wider mb-1 font-sans">
                      Premium Rentals
                    </h3>
                    <p className="text-[10px] text-white/40 leading-normal font-sans">
                      Consoles, VR kits, and professional simulators at your location.
                    </p>
                  </div>
                </Link>

                {/* Choice 2: Personal House Parties */}
                <Link
                  to="/experiences"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-afterhours-pink rounded-2xl p-5 text-center flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-1 group"
                >
                  <div className="bg-afterhours-pink/10 p-3 rounded-xl border border-afterhours-pink/10 group-hover:bg-afterhours-pink/20 transition-all">
                    <PartyPopper className="text-afterhours-pink shrink-0" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase text-white tracking-wider mb-1 font-sans">
                      Personal House Parties
                    </h3>
                    <p className="text-[10px] text-white/40 leading-normal font-sans">
                      Multiplayer arenas and immersive visual setups for private guests.
                    </p>
                  </div>
                </Link>

                {/* Choice 3: Corporate Events */}
                <Link
                  to="/experiences"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-afterhours-purple rounded-2xl p-5 text-center flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-1 group"
                >
                  <div className="bg-afterhours-purple/10 p-3 rounded-xl border border-afterhours-purple/10 group-hover:bg-afterhours-purple/20 transition-all">
                    <Building2 className="text-afterhours-purple shrink-0" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase text-white tracking-wider mb-1 font-sans">
                      Corporate Events
                    </h3>
                    <p className="text-[10px] text-white/40 leading-normal font-sans">
                      Esports pop-up arenas, team-building, and digital gaming lounges.
                    </p>
                  </div>
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </nav>
  );
}
