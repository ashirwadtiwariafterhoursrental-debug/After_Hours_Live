import { motion } from "motion/react";
import { Link, useLocation } from "react-router-dom";
import { Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const location = useLocation();

  if (location.pathname.startsWith('/partner-dashboard') || location.pathname.startsWith('/partner-hub')) {
    return null;
  }

  return (
    <footer className="bg-[#003791] border-t border-blue-900/30 pt-20 pb-10 px-6 overflow-hidden text-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-12 mb-20">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-4 mb-6 group">
              <div className="relative w-10 h-10 flex items-center justify-center">
                <div className="absolute inset-0 bg-white/10 rounded-full blur-md group-hover:bg-white/20 transition-colors" />
                <img 
                  src="https://i.postimg.cc/wTjysHrn/image.png" 
                  alt="After Hours Logo" 
                  className="relative w-8 h-8 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-xl font-black tracking-tighter uppercase italic leading-none text-white">
                AFTER HOURS
              </span>
            </Link>
            <p className="text-blue-100/90 max-w-md mb-8 leading-relaxed text-sm">
              High-end experiential event agency based in Delhi NCR. We build premium, high-adrenaline Esports and VR pop-up arenas.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://www.instagram.com/afterhoursrental?igsh=dzd4NGZhaHgyc2h5" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white hover:text-[#003791] text-white transition-all">
                <Instagram size={18} />
              </a>
              <a href="https://www.linkedin.com/company/after-hours-rental/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white hover:text-[#003791] text-white transition-all">
                <Linkedin size={18} />
              </a>
              <a href="mailto:contact@afterhoursrental.in" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white hover:text-[#003791] text-white transition-all">
                <Mail size={18} />
              </a>
              <a href="https://wa.me/919711844884" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white hover:text-[#003791] text-white transition-all">
                <Phone size={18} />
              </a>
            </div>
          </div>

          {/* Navigation Column */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.3em] text-blue-200/70 font-bold mb-8">Navigation</h4>
            <ul className="space-y-4">
              <li>
                <Link to="/experiences" className="text-blue-100 hover:text-white transition-colors uppercase text-sm tracking-widest font-semibold">Experiences</Link>
              </li>
              <li>
                <Link to="/rentals" className="text-blue-100 hover:text-white transition-colors uppercase text-sm tracking-widest font-semibold">Rentals</Link>
              </li>
              <li>
                <Link to="/experiences" className="text-blue-100 hover:text-white transition-colors uppercase text-sm tracking-widest font-semibold">Corporate</Link>
              </li>
              <li>
                <Link to="/contact" className="text-blue-100 hover:text-white transition-colors uppercase text-sm tracking-widest font-bold">Contact</Link>
              </li>
            </ul>
          </div>

          {/* Legal & Platform Column */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.3em] text-blue-200/70 font-bold mb-8">Legal & Platform</h4>
            <ul className="space-y-4">
              <li>
                <Link to="/terms" className="text-blue-100 hover:text-white transition-colors uppercase text-sm tracking-widest font-semibold">Terms & Conditions</Link>
              </li>
              <li>
                <Link to="/admin" className="text-blue-100 hover:text-white transition-colors uppercase text-sm tracking-widest font-semibold">Admin Portal</Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.3em] text-blue-200/70 font-bold mb-8">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-blue-100">
                <Phone size={16} className="text-white" />
                <a href="tel:9711844884" className="uppercase text-sm tracking-widest font-black text-white hover:text-blue-200 transition-colors">9711844884</a>
              </li>
              <li className="flex items-center gap-3 text-blue-100">
                <Mail size={16} className="text-white" />
                <a href="mailto:contact@afterhoursrental.in" className="uppercase text-xs tracking-widest font-semibold hover:text-blue-200 transition-colors">contact@afterhoursrental.in</a>
              </li>
              <li className="flex items-start gap-3 text-blue-100">
                <MapPin size={16} className="text-white mt-1 flex-shrink-0" />
                <p className="uppercase text-xs tracking-widest font-semibold leading-relaxed">
                  Serving Delhi & NCR Regions
                </p>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-blue-200/60 font-bold">
            © {currentYear} AFTER HOURS. ALL RIGHTS RESERVED.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <p className="text-[10px] uppercase tracking-[0.4em] text-white font-black italic">
              DESIGNED FOR THE ELITE.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
