import { useState, FormEvent, ChangeEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { 
  User, Calendar, HelpCircle, Loader2, CheckCircle2, 
  MessageSquare, Sparkles, Send, PhoneCall
} from "lucide-react";

export function LeadForm() {
  const [fullName, setFullName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventType, setEventType] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Validations
    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!whatsappNumber.trim()) {
      setError("Please enter your WhatsApp contact number.");
      return;
    }
    if (!eventDate) {
      setError("Please select the expected event date.");
      return;
    }
    if (!eventType) {
      setError("Please select your event type.");
      return;
    }

    setIsSubmitting(true);

    try {
      const leadsCollection = collection(db, "leads");
      const payload = {
        fullName: fullName.trim(),
        whatsappNumber: whatsappNumber.trim(),
        eventDate,
        eventType,
        status: "New Lead",
        createdAt: new Date().toISOString()
      };

      await addDoc(leadsCollection, payload);
      setSuccess(true);
      
      // Reset form fields
      setFullName("");
      setWhatsappNumber("");
      setEventDate("");
      setEventType("");
    } catch (err: any) {
      console.error("Error submitting lead form:", err);
      try {
        handleFirestoreError(err, OperationType.WRITE, "leads");
      } catch (firestoreErr: any) {
        setError("Unable to submit request. Please check your internet connection and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="lead-form-container" className="w-full max-w-lg mx-auto p-1 font-sans">
      <AnimatePresence mode="wait">
        {!success ? (
          <motion.div
            key="form-card"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="bg-white border border-slate-200 rounded-3xl shadow-md p-8 md:p-10 relative overflow-hidden"
          >
            {/* Ambient subtle background decorative glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#003791]/5 blur-3xl rounded-full pointer-events-none" />
            
            <div className="text-center mb-8 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-[#003791] text-[10px] font-black uppercase tracking-widest mb-3">
                <Sparkles size={12} className="animate-pulse" />
                Google Ads Exclusive
              </div>
              <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tight text-slate-800">
                Request a <span className="text-[#003791]">Custom VIP Setup</span>
              </h2>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1.5 max-w-sm mx-auto leading-relaxed">
                Planning a premium event? Tell us your details, and our concierge will tailor a custom gaming setup.
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-semibold text-red-600 flex items-start gap-2"
              >
                <span className="text-sm">⚠️</span>
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#003791] focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              {/* WhatsApp Number */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block">
                  WhatsApp Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <MessageSquare size={16} />
                  </div>
                  <input
                    type="tel"
                    value={whatsappNumber}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setWhatsappNumber(e.target.value)}
                    placeholder="Enter WhatsApp mobile number"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#003791] focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              {/* Event Date & Event Type Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Expected Event Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block">
                    Expected Event Date
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Calendar size={16} />
                    </div>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setEventDate(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#003791] focus:bg-white transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Event Type Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block">
                    Event Type
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <HelpCircle size={16} />
                    </div>
                    <select
                      value={eventType}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setEventType(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#003791] focus:bg-white transition-all appearance-none cursor-pointer"
                      required
                    >
                      <option value="" disabled>Select event type</option>
                      <option value="Corporate Event">Corporate Event</option>
                      <option value="House Party">House Party</option>
                      <option value="Birthday">Birthday</option>
                      <option value="Other">Other</option>
                    </select>
                    {/* Select custom indicator arrow */}
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                      <span className="text-[10px]">▼</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 bg-[#003791] hover:bg-blue-800 disabled:bg-[#003791]/65 text-white py-4 px-6 rounded-2xl font-black uppercase italic tracking-widest text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-900/10 active:scale-[0.98] transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-white" />
                    <span>Processing Details...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} className="text-white" />
                    <span>Send VIP Request</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-4 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-t border-slate-100 pt-5">
              <span className="flex items-center gap-1">
                ⚡ Instant Call-Back
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                🎮 Delhi NCR Coverage
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success-card"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="bg-white border border-slate-200 rounded-3xl shadow-md p-10 text-center relative overflow-hidden"
          >
            {/* Success sparkles glow */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-green-50 blur-3xl rounded-full pointer-events-none" />

            <div className="w-20 h-20 rounded-full bg-green-50 border border-green-200 text-green-600 flex items-center justify-center mx-auto mb-6 shadow-sm">
              <CheckCircle2 size={36} className="animate-bounce" />
            </div>

            <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tight text-slate-800 mb-3">
              Details <span className="text-green-600">Received!</span>
            </h2>
            
            <p className="text-slate-600 text-sm font-semibold max-w-sm mx-auto leading-relaxed mb-6">
              Our concierge team will WhatsApp you shortly to tailor your custom esports pop-up setup.
            </p>

            <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-500 uppercase tracking-wider">
              <PhoneCall size={14} className="text-[#003791]" />
              Response Time: Under 15 Mins
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
