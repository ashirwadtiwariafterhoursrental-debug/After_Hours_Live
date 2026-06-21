import React, { useState, FormEvent } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, firebaseConfig } from "../firebase";
import { motion, AnimatePresence } from "motion/react";
import { User, Mail, Phone, Coins, Key, Loader2, CheckCircle, ShieldAlert } from "lucide-react";

// Initialize a secondary Firebase Auth instance to prevent logging out the main admin session
const secondaryApp = initializeApp(firebaseConfig, "SecondaryOnboardingApp");
const secondaryAuth = getAuth(secondaryApp);

export default function PartnerOnboarding() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [investedAmount, setInvestedAmount] = useState("");
  const [password, setPassword] = useState("AfterHours2026");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleOnboard = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    const termName = name.trim();
    const termEmail = email.trim();
    const termPhone = phone.trim();
    const amountVal = Number(investedAmount);

    if (!termName) {
      setErrorMessage("Enter the partner's full name.");
      setIsLoading(false);
      return;
    }
    if (!termEmail || !termEmail.includes("@")) {
      setErrorMessage("Enter a valid email address.");
      setIsLoading(false);
      return;
    }
    if (!termPhone) {
      setErrorMessage("Enter the partner's contact phone number.");
      setIsLoading(false);
      return;
    }
    if (!investedAmount || isNaN(amountVal) || amountVal < 0) {
      setErrorMessage("Enter a valid initial capital amount (₹0 or more).");
      setIsLoading(false);
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage("Temporary password must be at least 6 characters.");
      setIsLoading(false);
      return;
    }

    try {
      // Step 1: Create Account via Secondary Auth
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, termEmail, password);
      const { uid } = userCredential.user;

      // Step 2: Establish User database schema profile
      await setDoc(doc(db, "users", uid), {
        name: termName,
        email: termEmail.toLowerCase(),
        phone: termPhone,
        investedAmount: amountVal,
        role: "partner",
        withdrawnFunds: 0,
        createdAt: serverTimestamp()
      });

      // Step 3: Clear the local Secondary App session immediately to remain pristine
      await signOut(secondaryAuth);

      // Reset form states
      setName("");
      setEmail("");
      setPhone("");
      setInvestedAmount("");
      setPassword("AfterHours2026");

      setSuccessMessage(
        `Onboarding Complete! Partner "${termName}" registered successfully with UID: ${uid}.`
      );
    } catch (err: any) {
      console.error("Partner Onboarding Handshake Error:", err);
      // Show clean message
      if (err.code === "auth/email-already-in-use") {
        setErrorMessage("This email address is already registered as a user.");
      } else if (err.code === "auth/weak-password") {
        setErrorMessage("The provided temporary password was rejected as too weak.");
      } else {
        setErrorMessage(err.message || "Onboarding database sync failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="partner-onboarding-container" className="max-w-xl mx-auto space-y-6">
      
      {/* Intro Header */}
      <div className="space-y-1">
        <h2 className="text-xl uppercase font-extrabold font-sans tracking-wider text-white">
          Onboard New Venture Partner
        </h2>
        <p className="text-xs text-white/40 leading-relaxed font-mono">
          Securely create co-investor profiles below. By leveraging sandboxed credentials, this desk does not overwrite your current administrative login token.
        </p>
      </div>

      <div className="bg-[#0b0c10]/95 border border-white/5 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute right-0 top-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-0 bottom-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Messaging Desk */}
        <AnimatePresence mode="wait">
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs flex gap-3 items-start"
            >
              <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-sans font-bold uppercase tracking-wider block">SUCCESS HANDSHAKE</span>
                <p className="leading-relaxed">{successMessage}</p>
              </div>
            </motion.div>
          )}

          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-xs flex gap-3 items-start"
            >
              <ShieldAlert size={16} className="text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-sans font-bold uppercase tracking-wider block">ONBOARDING ERROR</span>
                <p className="leading-relaxed">{errorMessage}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleOnboard} className="space-y-4 font-mono text-xs">
          
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-white/60 block">
              Partner Full Name
            </label>
            <div className="relative">
              <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                id="onboard-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Rohaan Sen"
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-white/20 font-bold focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-white/60 block">
              Secure Email Identifier
            </label>
            <div className="relative">
              <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                id="onboard-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="e.g. rohaan@afterhoursrental.in"
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-white/20 font-bold focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Contact phone */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-white/60 block">
              Phone Number
            </label>
            <div className="relative">
              <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                id="onboard-phone-input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="e.g. +91 98765 43210"
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-white/20 font-bold focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Capital Invested */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-white/60 block">
              Initial Capital Contribution (₹)
            </label>
            <div className="relative">
              <Coins size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
              <input
                id="onboard-capital-input"
                type="number"
                value={investedAmount}
                onChange={(e) => setInvestedAmount(e.target.value)}
                required
                min="0"
                placeholder="e.g. 500000"
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-white/20 font-bold focus:border-purple-500 focus:outline-none"
              />
            </div>
            <p className="text-[8px] text-white/30 leading-snug">
              This sets the base calculation for profit share payouts in the partner dashboard metrics.
            </p>
          </div>

          {/* Password (Temporary) */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-white/60 block">
              Temporary Setup Password
            </label>
            <div className="relative">
              <Key size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                id="onboard-password-input"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-white/20 font-bold focus:border-purple-500 focus:outline-none"
              />
            </div>
            <p className="text-[8px] text-white/30 leading-snug">
              Provide this key to the partner. They will be prompted to update it on their initial session access.
            </p>
          </div>

          {/* Submit Action */}
          <div className="pt-4">
            <button
              id="onboard-submit-button"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 text-[10px] font-black uppercase tracking-widest bg-purple-600 text-white rounded-xl font-extrabold hover:bg-purple-500 hover:scale-[1.01] active:scale-[0.99] disabled:bg-neutral-800 disabled:text-white/40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Constructing Profile...</span>
                </>
              ) : (
                <>
                  <span>Construct Partner Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
