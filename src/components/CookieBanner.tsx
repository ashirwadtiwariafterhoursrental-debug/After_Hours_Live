import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Cookie, Shield, X } from "lucide-react";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if consent has already been given/saved
    const consent = localStorage.getItem("afterhours_cookie_consent");
    if (!consent) {
      // Delay presentation slightly for optimal user experience
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleConsent = (type: "all" | "necessary") => {
    localStorage.setItem("afterhours_cookie_consent", type);
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          id="cookie-consent-banner"
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,55,145,0.08)] z-50 font-sans"
        >
          <div className="max-w-7xl mx-auto px-6 py-6 md:py-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative">
            
            {/* Left side text and icon */}
            <div className="flex items-start gap-4 flex-1">
              <div className="hidden sm:flex p-3 bg-blue-50 border border-blue-100 rounded-2xl text-[#003791] shrink-0">
                <Cookie size={24} className="animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="flex sm:hidden text-[#003791] shrink-0">
                    <Cookie size={18} />
                  </span>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    Cookie & Tracking Settings
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-full text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    <Shield size={10} className="text-[#003791]" />
                    GDPR / CCPA Compliant
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed max-w-4xl font-medium">
                  After Hours uses cookies and optimized tracking technologies to securely manage your real-time booking cart, personalize pricing plans, streamline Delhi NCR concierge interactions, and analyze our traffic dynamically. You can accept all tracking cookies, or continue with only those strictly required to operate the application.
                </p>
              </div>
            </div>

            {/* Right side buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => handleConsent("necessary")}
                className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-800 bg-white border border-slate-300 hover:border-slate-500 rounded-xl transition-all cursor-pointer text-center"
              >
                Strictly Necessary Only
              </button>
              
              <button
                type="button"
                onClick={() => handleConsent("all")}
                className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white bg-[#003791] hover:bg-blue-800 rounded-xl transition-all shadow-md shadow-blue-900/15 cursor-pointer text-center hover:scale-[1.01] active:scale-[0.99]"
              >
                Accept & Continue
              </button>
            </div>

            {/* Subtle dismiss button */}
            <button
              onClick={() => handleConsent("necessary")}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1"
              title="Close and accept necessary only"
            >
              <X size={16} />
            </button>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
