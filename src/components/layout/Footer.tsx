import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-afterhours-black border-t border-white/10 pt-20 pb-10 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-4 mb-6 group">
              <div className="relative w-10 h-10 flex items-center justify-center">
                <div className="absolute inset-0 bg-afterhours-cyan/20 rounded-full blur-md group-hover:bg-afterhours-pink/30 transition-colors" />
                <img 
                  src="https://i.postimg.cc/wTjysHrn/image.png" 
                  alt="After Hours Logo" 
                  className="relative w-8 h-8 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-xl font-black tracking-tighter uppercase italic leading-none">
                <span className="text-afterhours-purple">AFT</span><span className="text-white">ER H</span><span className="text-afterhours-cyan">OURS</span>
              </span>
            </Link>
            <p className="text-white/60 max-w-md mb-8 leading-relaxed">
              High-end experiential event agency based in Delhi NCR. We build premium, high-adrenaline Esports and VR pop-up arenas.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://www.instagram.com/afterhoursrental?igsh=dzd4NGZhaHgyc2h5" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-afterhours-pink hover:text-white transition-all">
                <Instagram size={18} />
              </a>
              <a href="https://www.linkedin.com/company/after-hours-rental/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-afterhours-purple hover:text-white transition-all">
                <Linkedin size={18} />
              </a>
              <a href="mailto:contact@afterhoursrental.in" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-afterhours-cyan hover:text-black transition-all">
                <Mail size={18} />
              </a>
              <a href="https://wa.me/919711844884" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-afterhours-green hover:text-black transition-all">
                <Phone size={18} />
              </a>
            </div>
          </div>

          {/* Navigation Column */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.3em] text-white/40 font-bold mb-8">Navigation</h4>
            <ul className="space-y-4">
              <li>
                <Link to="/experiences" className="text-white/60 hover:text-afterhours-pink transition-colors uppercase text-sm tracking-widest font-medium">Experiences</Link>
              </li>
              <li>
                <Link to="/rentals" className="text-white/60 hover:text-afterhours-cyan transition-colors uppercase text-sm tracking-widest font-medium">Rentals</Link>
              </li>
              <li>
                <Link to="/corporate" className="text-white/60 hover:text-afterhours-purple transition-colors uppercase text-sm tracking-widest font-medium">Corporate</Link>
              </li>
              <li>
                <Link to="/contact" className="text-white/60 hover:text-white transition-colors uppercase text-sm tracking-widest font-medium">Contact</Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.3em] text-white/40 font-bold mb-8">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-white/60">
                <Phone size={16} className="text-afterhours-cyan" />
                <a href="tel:9711844884" className="uppercase text-sm tracking-widest font-bold text-white hover:text-afterhours-cyan transition-colors">9711844884</a>
              </li>
              <li className="flex items-center gap-3 text-white/60">
                <Mail size={16} className="text-afterhours-purple" />
                <a href="mailto:contact@afterhoursrental.in" className="uppercase text-xs tracking-widest font-medium hover:text-afterhours-purple transition-colors">contact@afterhoursrental.in</a>
              </li>
              <li className="flex items-start gap-3 text-white/60">
                <MapPin size={16} className="text-afterhours-pink mt-1 flex-shrink-0" />
                <p className="uppercase text-xs tracking-widest font-medium leading-relaxed">
                  Serving Delhi & NCR Regions
                </p>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">
            © {currentYear} AFTER HOURS. ALL RIGHTS RESERVED.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-afterhours-pink animate-pulse" />
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/60 font-black italic">
              DESIGNED FOR THE ELITE.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
