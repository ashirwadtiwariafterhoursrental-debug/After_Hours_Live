import { motion, AnimatePresence } from "motion/react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/src/lib/utils";
import { Menu, X, Gamepad2, User, PartyPopper, Building2, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { PartnerNavbar } from "./PartnerNavbar";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "Rentals", path: "/rentals" },
  { name: "Experiences", path: "/experiences" },
  { name: "Blog", path: "/blog" },
  { name: "Contact", path: "/contact" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data()?.role || null);
          } else {
            setUserRole(null);
          }
        } catch (error) {
          console.error("Error fetching user role in Navbar:", error);
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Safeguard: Waitlist/Admin Fetching Fix
  useEffect(() => {
    if (userRole === "admin") {
      // Subscriptions here
    }
  }, [userRole]);

  const isPartnerDashboard = location.pathname.startsWith('/partner-dashboard') || location.pathname.startsWith('/partner-hub');
  const isAdminPath = location.pathname.startsWith('/admin');

  if (isPartnerDashboard) {
    return <PartnerNavbar />;
  }

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4",
        "bg-[#003791] border-b border-blue-800 shadow-md text-white"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-4 group">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute inset-0 bg-white/10 rounded-full blur-md group-hover:bg-white/20 transition-colors" />
            <img 
              src="https://i.postimg.cc/wTjysHrn/image.png" 
              alt="After Hours Logo" 
              className="relative w-10 h-10 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tighter uppercase italic leading-none text-white">
              AFTER HOURS
            </span>
            <span className="text-[7px] uppercase tracking-[0.3em] font-bold text-blue-200">
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
                "text-sm font-semibold uppercase tracking-widest hover:text-white transition-colors",
                location.pathname === link.path ? "text-white underline decoration-2 underline-offset-4" : "text-blue-200"
              )}
            >
              {link.name}
            </Link>
          ))}
          
          {/* Distinct Partner Portal Link */}
          <Link
            to="/partner-login"
            className={cn(
              "text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-[#003791] transition-all flex items-center gap-1.5 border border-white/20 px-3.5 py-1.5 rounded-full bg-white/10 text-white",
              location.pathname === "/partner-login" ? "bg-white text-[#003791] border-white font-bold" : ""
            )}
          >
            <Lock size={12} className="text-current" />
            <span>Partner Portal</span>
          </Link>
          {currentUser ? (
            <Link
              to="/profile"
              className="text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-colors flex items-center gap-1.5 border border-white/20 px-4 py-2 rounded-full bg-white/10 text-white"
              title="My Profile"
            >
              <User size={12} className="text-white" />
              <span>My Account</span>
            </Link>
          ) : (
            <Link
              to="/customer-login"
              className="text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-colors flex items-center gap-1.5 border border-white/20 px-4 py-2 rounded-full bg-white/10 text-white"
            >
              <span>Login / Sign Up</span>
            </Link>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-white text-[#003791] hover:bg-slate-100 px-6 py-2 rounded-full text-sm font-bold uppercase tracking-widest transition-all cursor-pointer font-sans shadow-sm"
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
          className="absolute top-full left-0 right-0 bg-[#003791] border-b border-blue-800 p-6 flex flex-col gap-6 md:hidden text-white shadow-xl"
        >
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className="text-lg font-bold uppercase tracking-widest text-blue-100 hover:text-white transition-colors"
            >
              {link.name}
            </Link>
          ))}
          <Link
            to="/partner-login"
            onClick={() => setIsOpen(false)}
            className="text-lg font-bold uppercase tracking-widest text-blue-100 hover:text-white flex items-center gap-2 border-t border-blue-800 pt-4 transition-colors"
          >
            <Lock size={18} className="text-white" />
            <span>Partner Portal</span>
          </Link>
          {currentUser ? (
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="text-lg font-bold uppercase tracking-widest text-blue-100 hover:text-white flex items-center gap-2"
            >
              <User size={18} className="text-white" />
              <span>My Account</span>
            </Link>
          ) : (
            <Link
              to="/customer-login"
              onClick={() => setIsOpen(false)}
              className="text-lg font-bold uppercase tracking-widest text-blue-100 hover:text-white"
            >
              <span>Login / Sign Up</span>
            </Link>
          )}
          <button
            onClick={() => {
              setIsOpen(false);
              setIsModalOpen(true);
            }}
            className="bg-white text-[#003791] text-center py-4 rounded-xl font-bold uppercase tracking-widest cursor-pointer w-full text-sm font-sans hover:bg-slate-100"
          >
            Book Now
          </button>
        </motion.div>
      )}

      {/* INTELLIGENT ROUTING MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl z-10"
            >
              <div className="absolute top-0 right-0 h-40 w-40 bg-[#003791]/10 blur-3xl rounded-full pointer-events-none" />
              <div className="absolute bottom-0 left-0 h-40 w-40 bg-[#003791]/10 blur-3xl rounded-full pointer-events-none" />

              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1.5 rounded-full hover:bg-slate-100"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-8">
                <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#003791] font-bold block mb-2">
                  Plan Your Experience
                </span>
                <h2 className="text-2xl sm:text-3xl font-black uppercase italic text-slate-800 tracking-wider">
                  What are you planning?
                </h2>
                <p className="text-xs text-slate-500 mt-2 font-mono">
                  Select a category to explore bespoke options.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-20">
                {/* Choice 1: Premium Rentals */}
                <Link
                  to="/rentals"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-[#003791] rounded-2xl p-5 text-center flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-1 group shadow-sm"
                >
                  <div className="bg-[#003791]/10 p-3 rounded-xl border border-blue-100 group-hover:bg-[#003791]/25 transition-all text-[#003791]">
                    <Gamepad2 className="shrink-0" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider mb-1 font-sans">
                      Premium Rentals
                    </h3>
                    <p className="text-[10px] text-slate-500 leading-normal font-sans">
                      Consoles, VR kits, and professional simulators at your location.
                    </p>
                  </div>
                </Link>

                {/* Choice 2: Personal House Parties */}
                <Link
                  to="/experiences"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-[#003791] rounded-2xl p-5 text-center flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-1 group shadow-sm"
                >
                  <div className="bg-[#003791]/10 p-3 rounded-xl border border-blue-100 group-hover:bg-[#003791]/25 transition-all text-[#003791]">
                    <PartyPopper className="shrink-0" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider mb-1 font-sans">
                      Personal House Parties
                    </h3>
                    <p className="text-[10px] text-slate-500 leading-normal font-sans">
                      Multiplayer arenas and immersive visual setups for private guests.
                    </p>
                  </div>
                </Link>

                {/* Choice 3: Corporate Events */}
                <Link
                  to="/experiences"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-[#003791] rounded-2xl p-5 text-center flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-1 group shadow-sm"
                >
                  <div className="bg-[#003791]/10 p-3 rounded-xl border border-blue-100 group-hover:bg-[#003791]/25 transition-all text-[#003791]">
                    <Building2 className="shrink-0" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider mb-1 font-sans">
                      Corporate Events
                    </h3>
                    <p className="text-[10px] text-slate-500 leading-normal font-sans">
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