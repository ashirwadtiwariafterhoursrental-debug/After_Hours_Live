import { useState, useEffect, FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { motion } from "motion/react";
import { Lock, Mail, AlertCircle, Loader2, ArrowRight, Shield, Sparkles } from "lucide-react";

export function PartnerLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Read Access Denied state if redirected from ProtectedRoute
  useEffect(() => {
    const stateError = (location.state as any)?.error;
    if (stateError) {
      setError(stateError);
    }
  }, [location]);

  // Clean login listener: if already signed in and has role, redirect them.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists() && userDocSnap.data().role === "partner") {
            navigate("/partner-hub");
          }
        } catch (err) {
          console.error("Silent session check error:", err);
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Please supply both a valid email and matching security password.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      // 1. Firebase Authentication login
      const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      const user = userCredential.user;

      // 2. Query Firestore 'users' collection for the verified role
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (userData.role === "partner") {
          // Success: Use React Router to navigate to /partner-hub
          navigate("/partner-hub");
        } else {
          // Logged in but not a B2B partner role: sign out and raise strict unrecognized credentials error
          await signOut(auth);
          setError("Error: Unrecognized Partner Credentials.");
        }
      } else {
        // Document does not exist: sign out and raise unrecognized credentials error
        await signOut(auth);
        setError("Error: Unrecognized Partner Credentials.");
      }
    } catch (err: any) {
      console.error("Partner Login Failure:", err);
      // Map standard firebase auth errors gently to match high-security dashboards
      const code = err.code || "";
      if (
        code === "auth/wrong-password" ||
        code === "auth/user-not-found" ||
        code === "auth/invalid-credential" ||
        err.message?.includes("invalid-credential") ||
        err.message?.includes("user-not-found") ||
        err.message?.includes("wrong-password")
      ) {
        setError("Invalid partner credentials. Please verify your corporate email and secure key.");
      } else {
        setError("Authentication service unavailable. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="partner-login-view" className="min-h-screen bg-black flex items-center justify-center pt-32 pb-16 px-6 relative overflow-hidden text-slate-100">
      
      {/* Decorative Brand Grid of PlayStation Blue Theme */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#003791_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[450px] h-[450px] bg-[#003791]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-[#003791]/5 rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md bg-slate-900/40 border border-[#003791]/15 backdrop-blur-2xl rounded-[32px] p-8 md:p-10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.85)] border-t-[#003791]/30"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#003791]/10 border border-[#003791]/25 rounded-full text-[10px] text-blue-300 font-extrabold uppercase font-mono tracking-widest mb-4">
            <Shield className="w-3.5 h-3.5" />
            <span>Secure Investor Terminal</span>
          </div>
          
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-blue-200">
            Partner Portal
          </h2>
          <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
            Provide authorized corporate credentials to audit dynamic asset yields, FIFO standbys, and balance payouts.
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-950/20 border border-red-500/20 text-rose-300 rounded-2xl flex items-start gap-3 text-xs font-mono"
            id="partner-login-error"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400 animate-pulse" />
            <span className="leading-relaxed">{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block ml-1 font-mono">
              Corporate Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                <Mail size={16} />
              </span>
              <input
                id="partner-email"
                type="email"
                required
                placeholder="partner@yourfirm.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/60 border border-slate-800 focus:border-[#003791] rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none transition-all duration-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block ml-1 font-mono">
              Portal Access Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                <Lock size={16} />
              </span>
              <input
                id="partner-password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/60 border border-slate-800 focus:border-[#003791] rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none transition-all duration-200"
              />
            </div>
          </div>

          <button
            id="partner-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-[#003791] hover:bg-blue-800 text-white font-black uppercase tracking-wider text-xs py-4 rounded-2xl transition-all duration-200 shadow-[0_4px_20px_rgba(0,55,145,0.35)] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-55"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Authorizing Security Keys...</span>
              </>
            ) : (
              <>
                <span>Secure Login</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/60 text-center space-y-3">
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-mono">
            <Sparkles className="w-3 h-3 text-[#003791]" />
            <span>Encrypted Dual-Layer Verification Active</span>
          </div>
          <p className="text-[10px] text-slate-600">
            For access requests or enrollment inquiries, please reach out to After Hours Capital Relations.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
