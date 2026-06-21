import { motion } from "motion/react";
import { Mail, Phone, MapPin, Send, MessageSquare } from "lucide-react";
import { useState, FormEvent } from "react";

export function Contact() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    type: "Personal Event",
    message: ""
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    alert("Inquiry Sent! Our VIP concierge will contact you shortly.");
  };

  return (
    <div className="pt-32 pb-24 bg-slate-50 min-h-screen text-slate-800 selection:bg-blue-100 selection:text-[#003791]">
      <div className="container mx-auto px-6">
        <div className="flex flex-col gap-6 mb-8">
          <img 
            src="https://i.postimg.cc/wTjysHrn/image.png" 
            alt="After Hours Logo" 
            className="w-12 h-12 object-contain"
            referrerPolicy="no-referrer"
          />
          <span className="text-4xl font-black uppercase italic leading-none">
            <span className="text-[#003791]">AFT</span><span className="text-slate-800">ER H</span><span className="text-[#003791]">OURS</span>
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          <div>
            <h1 className="text-5xl md:text-7xl font-black uppercase italic text-slate-800 mb-8">
              Lock In <br />
              <span className="text-[#003791]">The Date</span>
            </h1>
            <p className="text-slate-600 text-xl leading-relaxed mb-12">
              Ready to build your arena? Fill out the form or reach out directly via WhatsApp for a faster response.
            </p>

            <div className="space-y-8">
              <a 
                href="https://wa.me/919711844884" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-6 group cursor-pointer"
              >
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-200 group-hover:border-[#003791] transition-all shadow-xs">
                  <Phone className="text-[#003791]" size={24} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#003791] font-bold mb-1 font-mono">Call / WhatsApp</p>
                  <p className="text-xl font-bold italic text-slate-800">+91 97118 44884</p>
                </div>
              </a>

              <a 
                href="mailto:contact@afterhoursrental.in" 
                className="flex items-center gap-6 group cursor-pointer"
              >
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-200 group-hover:border-[#003791] transition-all shadow-xs">
                  <Mail className="text-[#003791]" size={24} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-mono">Email Us</p>
                  <p className="text-xl font-bold italic text-slate-800">contact@afterhoursrental.in</p>
                </div>
              </a>

              <div className="flex items-center gap-6 group cursor-pointer">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-200 group-hover:border-slate-400 transition-all shadow-xs">
                  <MapPin className="text-slate-600" size={24} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-mono">Service Area</p>
                  <p className="text-xl font-bold italic text-slate-800">Delhi & NCR Regions</p>
                </div>
              </div>
            </div>

            <a 
              href="https://wa.me/919711844884" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="mt-16 p-8 bg-[#003791] rounded-3xl text-white flex items-center justify-between group cursor-pointer hover:bg-blue-900 transition-colors shadow-md"
            >
              <div>
                <h4 className="text-2xl font-black uppercase text-white italic">WhatsApp Concierge</h4>
                <p className="font-bold text-sm text-blue-100 uppercase tracking-widest">Instant Response</p>
              </div>
              <MessageSquare size={40} className="text-white opacity-90" />
            </a>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 md:p-12 rounded-[40px] border border-slate-200 shadow-sm"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-3 font-bold font-mono">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-6 py-4 focus:outline-none focus:border-[#003791] text-slate-850 text-xs shadow-xs focus:ring-1 focus:ring-[#003791]/30 transition-all font-sans"
                  placeholder="John Doe"
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-3 font-bold font-mono">Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-6 py-4 focus:outline-none focus:border-[#003791] text-slate-850 text-xs shadow-xs focus:ring-1 focus:ring-[#003791]/30 transition-all font-sans"
                  placeholder="john@example.com"
                  value={formState.email}
                  onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-3 font-bold font-mono">Inquiry Type</label>
                <select
                  className="w-full bg-white border border-slate-200 rounded-xl px-6 py-4 focus:outline-none focus:border-[#003791] text-slate-850 text-xs shadow-xs focus:ring-1 focus:ring-[#003791]/30 transition-all appearance-none font-sans"
                  value={formState.type}
                  onChange={(e) => setFormState({ ...formState, type: e.target.value })}
                >
                  <option>Personal Event</option>
                  <option>Corporate Activation</option>
                  <option>Equipment Rental</option>
                  <option>Partnership</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-3 font-bold font-mono">Event Details</label>
                <textarea
                  rows={4}
                  className="w-full bg-white border border-slate-200 rounded-xl px-6 py-4 focus:outline-none focus:border-[#003791] text-slate-850 text-xs shadow-xs focus:ring-1 focus:ring-[#003791]/30 transition-all font-sans resize-none"
                  placeholder="Tell us about your event (Date, Location, Expected Guests...)"
                  value={formState.message}
                  onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                />
              </div>

              <a
                href="https://wa.me/919711844884"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#003791] text-white py-6 rounded-full font-black uppercase tracking-widest hover:bg-blue-900 transition-colors flex items-center justify-center gap-3 shadow-md border border-transparent font-sans text-xs"
              >
                Inquire via WhatsApp <MessageSquare size={20} />
              </a>
              <button
                type="submit"
                className="w-full border border-slate-200 text-slate-600 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-slate-100 transition-all text-xs cursor-pointer"
              >
                Or Send Email Inquiry
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
