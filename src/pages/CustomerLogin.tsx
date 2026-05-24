import { useState, useEffect, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { motion, AnimatePresence } from "motion/react";
import { KeyRound, Mail, AlertCircle, Loader2, User, ArrowRight, Shield, Sparkles } from "lucide-react";

export function CustomerLogin() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Auto-redirect if already logged in to profile page
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/profile");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !name)) {
      setError("Please fill in all required fields.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Sign Up Mode
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update Auth Profile with Name
        await updateProfile(user, { displayName: name });

        // Initialize user document in Firestore under 'users/{uid}'
        const userRef = doc(db, "users", user.uid);
        
        // Check if doc exists (just in case)
        const docSnap = await getDoc(userRef);
        if (!docSnap.exists()) {
          await setDoc(userRef, {
            name: name,
            email: email,
            phone: "",
            address: "",
            kycUrl: "",
            kycStatus: "unverified",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      } else {
        // Log In Mode
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/profile");
    } catch (err: any) {
      console.error("Auth action failed:", err);
      // Friendly, specific error message depending on firebase auth codes
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Invalid credentials. Please verify your email and password.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("An account already exists with this email address.");
      } else if (err.code === "auth/weak-password") {
        setError("Your password should contain at least 6 characters.");
      } else {
        setError(err.message || "Authentication process failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="customer-login-view" className="min-h-screen bg-afterhours-black flex items-center justify-center pt-32 pb-16 px-6 relative overflow-hidden">
      {/* Glow Orbs in Background */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-afterhours-purple/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-afterhours-cyan/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-afterhours-gray/30 border border-white/5 backdrop-blur-xl rounded-[40px] p-8 md:p-10 shadow-[0_30px_60px_rgba(0,0,0,0.6)] border-t-afterhours-cyan/20"
      >
        {/* Toggle buttons */}
        <div className="flex bg-white/5 p-1 rounded-2xl mb-8 border border-white/5">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setError("");
            }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              !isSignUp ? "bg-white/10 text-white shadow-md font-black" : "text-white/40 hover:text-white/60"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setError("");
            }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              isSignUp ? "bg-white/10 text-white shadow-md font-black" : "text-white/40 hover:text-white/60"
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="text-center mb-8">
          <span className="text-[10px] uppercase tracking-[0.40em] text-afterhours-cyan font-bold block mb-2">
            {isSignUp ? "JOIN THE ELITE CLUB" : "WELCOME BACK TO THE CAFE"}
          </span>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">
            {isSignUp ? "Elite Member Portal" : "Sign In to Portal"}
          </h2>
          <p className="text-xs text-white/40 mt-2 max-w-xs mx-auto leading-relaxed">
            {isSignUp 
              ? "Gain secure access to premium high-end hardware rentals and custom tournament profiles."
              : "Access your persistent dashboard, pending rentals, and verified KYC reports."
            }
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-950/30 border border-red-500/20 text-rose-300 rounded-2xl flex items-start gap-3 text-xs"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
            <span className="font-mono leading-relaxed">{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <AnimatePresence mode="popLayout">
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2 overflow-hidden"
              >
                <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 block ml-1 font-mono">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-white/30">
                    <User size={16} />
                  </span>
                  <input
                    id="signup-name-input"
                    type="text"
                    required={isSignUp}
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-afterhours-cyan transition-colors"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 block ml-1 font-mono">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-white/30">
                <Mail size={16} />
              </span>
              <input
                id="customer-email-input"
                type="email"
                required
                placeholder="you@corporate.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-afterhours-cyan transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 block ml-1 font-mono">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-white/30">
                <KeyRound size={16} />
              </span>
              <input
                id="customer-password-input"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-afterhours-cyan transition-colors"
              />
            </div>
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-gradient-to-r from-afterhours-purple to-afterhours-pink hover:brightness-110 text-white font-black uppercase tracking-wider text-xs italic py-4 rounded-2xl transition-all shadow-[0_4px_15px_rgba(168,85,247,0.2)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Authorization...</span>
              </>
            ) : (
              <>
                <span>{isSignUp ? "Construct Elite Profiler" : "Access Personal Hub"}</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center flex flex-col gap-2">
          <p className="text-[10px] text-white/30 tracking-wider">
            🔒 Fully encrypted private sessions backed by secure Firebase auth.
          </p>
          <p className="text-[10px] text-white/30">
            Are you a system operator?{" "}
            <Link to="/admin" className="text-afterhours-purple font-bold hover:underline">
              System Admin Gateway
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
