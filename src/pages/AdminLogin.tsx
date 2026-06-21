import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { KeyRound, Mail, AlertCircle, Loader2 } from "lucide-react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

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

    const emailLower = sanitizedEmail.toLowerCase();

    try {
      // 1. Authenticate user using standard Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, emailLower, password);
      const user = userCredential.user;

      // 2. Fetch user's profile document from Firestore 'users' collection
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        await signOut(auth);
        throw new Error("Access Denied: Unauthorized account.");
      }

      const userData = userDocSnap.data();

      // 3. Confirm user has the 'admin' role
      if (userData?.role !== "admin") {
        await signOut(auth);
        throw new Error("Access Denied: Unauthorized account.");
      }

      // Successful verification
      localStorage.setItem("isAdminAuthenticated", "true");
      localStorage.setItem("adminEmail", emailLower);
      setIsLoading(false);
      navigate("/admin/dashboard");
    } catch (err: any) {
      console.error("Firebase sign-in error:", err);
      
      // Clean up firebase error prefixes if present to keep it user friendly
      let errorMsg = err?.message || "Firebase Auth signature verification failed.";
      if (errorMsg.includes("auth/invalid-credential") || errorMsg.includes("auth/wrong-password") || errorMsg.includes("auth/user-not-found")) {
        errorMsg = "Invalid email or password. Please verify your credentials.";
      } else if (errorMsg.includes("Firebase:")) {
        errorMsg = errorMsg.replace(/Firebase:\s*/, "");
      }
      
      setError(errorMsg);
      setIsLoading(false);
    }
  };


  return (
    <div id="admin-login-view" className="min-h-screen bg-slate-50 flex items-center justify-center pt-24 pb-12 px-6 relative overflow-hidden">
      {/* Soft blue accent backdrop light */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-[#003791]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-[0.4em] text-[#003791] font-black block mb-2">
            ADMIN SECURE GATE
          </span>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-slate-950">
            Portal Control
          </h2>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-mono font-medium">
            AFTER HOURS PRIVATE SYSTEM
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-start gap-3 text-xs"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
            <span className="font-mono leading-relaxed">{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">
              Operator Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <Mail size={16} />
              </span>
              <input
                id="admin-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#003791] font-mono transition-all"
                placeholder="operator@afterhours.in"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">
              Authorization Key
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <KeyRound size={16} />
              </span>
              <input
                id="admin-password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#003791] font-mono transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            id="admin-login-submit"
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-[#003791] hover:bg-blue-800 text-white font-black text-xs uppercase tracking-[0.2em] italic rounded-2xl transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer mt-2"
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
