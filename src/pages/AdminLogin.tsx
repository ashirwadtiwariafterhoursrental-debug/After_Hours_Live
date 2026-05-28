import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { KeyRound, Mail, AlertCircle, Loader2 } from "lucide-react";

export function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Auto-redirect admin to dashboard if already authenticated in local storage
  useEffect(() => {
    const isAdminAuthenticated = localStorage.getItem("isAdminAuthenticated") === "true";
    if (isAdminAuthenticated) {
      navigate("/admin/dashboard");
    }
  }, [navigate]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    const sanitizedEmail = email.trim();
    if (!sanitizedEmail || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setError("");
    setIsLoading(true);

    // Simulate a brief secure check delay
    setTimeout(() => {
      const emailLower = sanitizedEmail.toLowerCase();
      const isValid =
        (emailLower === "afterhoursrental@gmail.com" && password === "Yara@2026") ||
        (emailLower === "arjuntiwari8604@gmail.com" && password === "Ashu@8604");

      if (isValid) {
        localStorage.setItem("isAdminAuthenticated", "true");
        localStorage.setItem("adminEmail", emailLower);
        setIsLoading(false);
        navigate("/admin/dashboard");
      } else {
        setError("Invalid email or password. Please verify your credentials.");
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <div id="admin-login-view" className="min-h-screen bg-black flex items-center justify-center pt-24 pb-12 px-6 relative overflow-hidden">
      {/* Glow Orbs in Background */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-afterhours-purple/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-afterhours-cyan/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-afterhours-gray/30 border border-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-t-afterhours-purple/30"
      >
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-[0.4em] text-afterhours-purple font-black block mb-2">
            ADMIN SECURE GATE
          </span>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">
            Portal Control
          </h2>
          <p className="text-xs text-white/50 mt-1 uppercase tracking-widest font-mono">
            AFTER HOURS PRIVATE SYSTEM
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-950/40 border border-red-500/30 text-rose-300 rounded-2xl flex items-start gap-3 text-xs"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
            <span className="font-mono leading-relaxed">{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 block">
              Operator Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-white/30">
                <Mail size={16} />
              </span>
              <input
                id="admin-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-afterhours-purple focus:ring-1 focus:ring-afterhours-purple/50 font-mono transition-all"
                placeholder="operator@afterhours.in"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 block">
              Authorization Key
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-white/30">
                <KeyRound size={16} />
              </span>
              <input
                id="admin-password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-afterhours-purple focus:ring-1 focus:ring-afterhours-purple/50 font-mono transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            id="admin-login-submit"
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-afterhours-purple to-afterhours-pink text-white font-black text-xs uppercase tracking-[0.2em] italic rounded-2xl transition-all shadow-[0_4px_20px_rgba(168,85,247,0.3)] hover:shadow-[0_4px_30px_rgba(168,85,247,0.5)] hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <span>Authorize Operator ➔</span>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
