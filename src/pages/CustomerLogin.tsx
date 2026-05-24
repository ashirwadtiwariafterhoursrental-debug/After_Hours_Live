import { useState, useEffect, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { motion, AnimatePresence } from "motion/react";
import { 
  KeyRound, Mail, AlertCircle, Loader2, User, 
  ArrowRight, Shield, Sparkles, Smartphone, Check, Lock
} from "lucide-react";

export function CustomerLogin() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [usePhoneAuth, setUsePhoneAuth] = useState(false);
  
  // Email Auth state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // Phone Auth state
  const [phone, setPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

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

  const handleSocialLoginSuccess = async (user: any) => {
    const userRef = doc(db, "users", user.uid);
    try {
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) {
        await setDoc(userRef, {
          name: user.displayName || "Elite Guest",
          email: user.email || "",
          phone: user.phoneNumber || "",
          address: "",
          kycUrl: "",
          kycStatus: "unverified",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error("Error creating user entry in Firestore:", err);
    }
    navigate("/profile");
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await handleSocialLoginSuccess(result.user);
    } catch (err: any) {
      console.error("Google auth failure:", err);
      setError(err.message || "Google Authentication flow was aborted.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError("");
    setIsLoading(true);
    try {
      const provider = new OAuthProvider("apple.com");
      const result = await signInWithPopup(auth, provider);
      await handleSocialLoginSuccess(result.user);
    } catch (err: any) {
      console.error("Apple auth failure:", err);
      setError(err.message || "Apple Authentication flow was aborted.");
    } finally {
      setIsLoading(false);
    }
  };

  const setupRecaptcha = () => {
    if ((window as any).recaptchaVerifier) {
      return (window as any).recaptchaVerifier;
    }
    const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: () => {
        // reCAPTCHA solved
      }
    });
    (window as any).recaptchaVerifier = verifier;
    return verifier;
  };

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!phone) {
      setError("Please supply a valid WhatsApp contact number with country code (e.g. +919999988888).");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const appVerifier = setupRecaptcha();
      const confirmation = await signInWithPhoneNumber(auth, phone, appVerifier);
      setConfirmationResult(confirmation);
    } catch (err: any) {
      console.error("Error triggering Phone OTP:", err);
      setError(err.message || "Failed to initiate verification code. Double-check phone number formatting.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!verificationCode) {
      setError("Please enter the 6-digit confirmation code.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const result = await confirmationResult.confirm(verificationCode);
      await handleSocialLoginSuccess(result.user);
    } catch (err: any) {
      console.error("OTP verification failure:", err);
      setError("Invalid OTP code. Please verify and enter the correct pin.");
    } finally {
      setIsLoading(false);
    }
  };

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
      } else {
        // Log In Mode
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/profile");
    } catch (err: any) {
      console.error("Auth action failed:", err);
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
      {/* Invisible Recaptcha Mount Point */}
      <div id="recaptcha-container"></div>

      {/* Glow Orbs in Background */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-afterhours-purple/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-afterhours-cyan/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-afterhours-gray/30 border border-white/5 backdrop-blur-xl rounded-[40px] p-8 md:p-10 shadow-[0_30px_60px_rgba(0,0,0,0.6)] border-t-afterhours-cyan/20"
      >
        {/* Toggle buttons between Sign In and Sign Up */}
        <div className="flex bg-white/5 p-1 rounded-2xl mb-6 border border-white/5">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setError("");
              setConfirmationResult(null);
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
              setUsePhoneAuth(false);
              setError("");
              setConfirmationResult(null);
            }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              isSignUp ? "bg-white/10 text-white shadow-md font-black" : "text-white/40 hover:text-white/60"
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="text-center mb-6">
          <span className="text-[10px] uppercase tracking-[0.40em] text-afterhours-cyan font-bold block mb-1">
            {isSignUp ? "JOIN THE ELITE CLUB" : "WELCOME BACK TO THE CAFE"}
          </span>
          <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white">
            {isSignUp ? "Elite Member Portal" : "Sign In to Portal"}
          </h2>
          <p className="text-[11px] text-white/40 mt-1.5 max-w-xs mx-auto leading-relaxed">
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

        {/* Dynamic Switch: Email VS Phone Login for existing users */}
        {!isSignUp && (
          <div className="flex bg-black/40 p-1.5 rounded-xl mb-6 border border-white/5 text-[10px] uppercase font-bold justify-center gap-4">
            <button
               type="button"
               onClick={() => {
                 setUsePhoneAuth(false);
                 setError("");
                 setConfirmationResult(null);
               }}
               className={`px-3 py-1.5 rounded-lg transition-all ${!usePhoneAuth ? "text-afterhours-cyan bg-white/5 font-black" : "text-white/40 hover:text-white"}`}
            >
              Email Login
            </button>
            <button
               type="button"
               onClick={() => {
                 setUsePhoneAuth(true);
                 setError("");
                 setConfirmationResult(null);
               }}
               className={`px-3 py-1.5 rounded-lg transition-all ${usePhoneAuth ? "text-afterhours-cyan bg-white/5 font-black" : "text-white/40 hover:text-white"}`}
            >
              Phone OTP Login
            </button>
          </div>
        )}

        {/* Dynamic Sign-In options logic */}
        {isSignUp ? (
          /* MANDATORY Google or Phone OTP Registration View */
          <div className="space-y-6">
            <div className="bg-afterhours-cyan/10 border border-afterhours-cyan/25 p-4 rounded-2xl text-[11px] text-white/80 leading-relaxed text-center font-semibold">
              🔒 <span className="text-afterhours-cyan font-bold">Registration Rule:</span> Creating an account requires verified Google Authentication or a verified WhatsApp Phone Number OTP to ensure reliable member profiles.
            </div>

            {/* If not in phone OTP verification state, show both options nicely and prominently */}
            {!confirmationResult ? (
              <div className="space-y-4">
                {/* 1. Google Register Button */}
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-white/40 block mb-2 font-mono text-center">
                    Method A: Fast Setup with Google
                  </label>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-afterhours-purple to-afterhours-pink hover:brightness-110 text-white font-black uppercase tracking-wider text-xs italic py-4 rounded-2xl transition-all shadow-[0_4px_15px_rgba(168,85,247,0.2)] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-55"
                  >
                    <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
                      <path fill="white" d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955.938 15.342 0 12.24 0 5.58 0 0 5.37 0 12s5.58 12 12.24 12c6.96 0 11.57-4.89 11.57-11.79 0-.79-.086-1.393-.193-1.925H12.24z"/>
                    </svg>
                    <span>Register with Google Account</span>
                  </button>
                </div>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-white/5"></div>
                  <span className="flex-shrink mx-4 text-white/20 text-[9px] uppercase tracking-[0.2em] font-mono">Or security option B</span>
                  <div className="flex-grow border-t border-white/5"></div>
                </div>

                {/* 2. Phone OTP Form Inline */}
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-widest text-white/40 block mb-2 font-mono text-center">
                      Method B: Register via WhatsApp OTP
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-white/30">
                        <Smartphone size={16} />
                      </span>
                      <input
                        required
                        type="tel"
                        placeholder="e.g. +91 9999988888"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-afterhours-cyan transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 hover:text-white font-black uppercase tracking-wider text-[11px] py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55 opacity-90 hover:opacity-100"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending Token...</span>
                      </>
                    ) : (
                      <>
                        <span>Get Registration OTP</span>
                        <ArrowRight size={12} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              /* OTP Code Entry Screen during Registration */
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 block font-mono">
                      Enter 6-Digit Registration PIN
                    </label>
                    <button
                      type="button"
                      onClick={() => setConfirmationResult(null)}
                      className="text-[10px] text-afterhours-cyan hover:underline uppercase tracking-wide cursor-pointer"
                    >
                      Change Number
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-white/30">
                      <Lock size={16} />
                    </span>
                    <input
                      required
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 123456"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm tracking-[0.4em] font-bold text-center text-white placeholder-white/20 focus:outline-none focus:border-afterhours-cyan transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-afterhours-green to-afterhours-cyan text-black font-black uppercase tracking-wider text-xs italic py-4 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Verifying PIN...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Account Registration</span>
                      <Check size={14} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* Existing Sign-In Options (Email or Phone switch based) */
          usePhoneAuth ? (
            /* Phone OTP Sign-In View */
            <div>
              {!confirmationResult ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 block ml-1 font-mono">
                      WhatsApp Phone Number
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-white/30">
                        <Smartphone size={16} />
                      </span>
                      <input
                        required
                        type="tel"
                        placeholder="e.g. +91 9999988888"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-afterhours-cyan transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-afterhours-purple to-afterhours-pink hover:brightness-110 text-white font-black uppercase tracking-wider text-xs italic py-4 rounded-2xl transition-all shadow-[0_4px_15px_rgba(168,85,247,0.2)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Secure Token...</span>
                      </>
                    ) : (
                      <>
                        <span>Transmit verification PIN</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 block font-mono">
                        Enter 6-Digit Verification PIN
                      </label>
                      <button
                        type="button"
                        onClick={() => setConfirmationResult(null)}
                        className="text-[10px] text-afterhours-cyan hover:underline uppercase tracking-wide cursor-pointer"
                      >
                        Change Number
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-white/30">
                        <Lock size={16} />
                      </span>
                      <input
                        required
                        type="text"
                        maxLength={6}
                        placeholder="e.g. 123456"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm tracking-[0.4em] font-bold text-center text-white placeholder-white/20 focus:outline-none focus:border-afterhours-cyan transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-afterhours-green to-afterhours-cyan text-black font-black uppercase tracking-wider text-xs italic py-4 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                        <span>Verifying PIN...</span>
                      </>
                    ) : (
                      <>
                        <span>Unseal Membership Card</span>
                        <Check size={14} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* Email Auth View */
            <form onSubmit={handleSubmit} className="space-y-5">
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
                className="w-full mt-2 bg-gradient-to-r from-afterhours-purple to-afterhours-pink hover:brightness-110 text-white font-black uppercase tracking-wider text-xs italic py-4 rounded-2xl transition-all shadow-[0_4px_15px_rgba(168,85,247,0.2)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Authorization...</span>
                  </>
                ) : (
                  <>
                    <span>Access Personal Hub</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          )
        )}

        {/* Global Social Login Accents */}
        {!isSignUp && (
          <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
            <div className="relative flex justify-center text-xs uppercase font-mono tracking-widest">
              <span className="bg-afterhours-black/80 px-3 text-white/30">Or shortcut credentials</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Google provider button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="py-3 px-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/5 text-xs text-white uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955.938 15.342 0 12.24 0 5.58 0 0 5.37 0 12s5.58 12 12.24 12c6.96 0 11.57-4.89 11.57-11.79 0-.79-.086-1.393-.193-1.925H12.24z"/>
                </svg>
                <span>Google</span>
              </button>

              {/* Apple provider button */}
              <button
                type="button"
                onClick={handleAppleSignIn}
                disabled={isLoading}
                className="py-3 px-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/5 text-xs text-white uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55"
              >
                <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.68-1.12 1.83-.98 2.94.1.08.31.22.42.22.86-.01 1.73-.74 2.39-1.55z"/>
                </svg>
                <span>Apple</span>
              </button>
            </div>
          </div>
        )}

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
