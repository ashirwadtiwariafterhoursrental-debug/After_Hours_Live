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
    // In a real app, this would send an email or store a lead
    alert("Inquiry Sent! Our VIP concierge will contact you shortly.");
  };

  return (
    <div className="pt-32 pb-24">
      <div className="container mx-auto px-6">
        <div className="flex flex-col gap-6 mb-8">
          <img 
            src="https://i.postimg.cc/wTjysHrn/image.png" 
            alt="After Hours Logo" 
            className="w-12 h-12 object-contain"
            referrerPolicy="no-referrer"
          />
          <span className="text-4xl font-black uppercase italic leading-none">
            <span className="text-afterhours-purple">AFT</span><span className="text-white">ER H</span><span className="text-afterhours-cyan">OURS</span>
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          <div>
            <h1 className="text-5xl md:text-7xl font-black uppercase italic mb-8">
              Lock In <br />
              <span className="text-afterhours-cyan">The Date</span>
            </h1>
            <p className="text-white/60 text-xl leading-relaxed mb-12">
              Ready to build your arena? Fill out the form or reach out directly via WhatsApp for a faster response.
            </p>

            <div className="space-y-8">
              <a 
                href="https://wa.me/919711844884" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-6 group cursor-pointer"
              >
                <div className="w-14 h-14 bg-afterhours-gray rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-afterhours-cyan transition-all">
                  <Phone className="text-afterhours-cyan" size={24} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Call / WhatsApp</p>
                  <p className="text-xl font-bold italic">+91 97118 44884</p>
                </div>
              </a>

              <a 
                href="mailto:contact@afterhoursrental.in" 
                className="flex items-center gap-6 group cursor-pointer"
              >
                <div className="w-14 h-14 bg-afterhours-gray rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-afterhours-purple transition-all">
                  <Mail className="text-afterhours-purple" size={24} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Email Us</p>
                  <p className="text-xl font-bold italic">contact@afterhoursrental.in</p>
                </div>
              </a>

              <div className="flex items-center gap-6 group cursor-pointer">
                <div className="w-14 h-14 bg-afterhours-gray rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-white/40 transition-all">
                  <MapPin className="text-white/60" size={24} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Service Area</p>
                  <p className="text-xl font-bold italic">Delhi & NCR Regions</p>
                </div>
              </div>
            </div>

            <a 
              href="https://wa.me/919711844884" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="mt-16 p-8 bg-afterhours-cyan rounded-3xl text-black flex items-center justify-between group cursor-pointer hover:scale-105 transition-transform"
            >
              <div>
                <h4 className="text-2xl font-black uppercase italic">WhatsApp Concierge</h4>
                <p className="font-bold text-sm opacity-70 uppercase tracking-widest">Instant Response</p>
              </div>
              <MessageSquare size={40} className="opacity-40" />
            </a>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-afterhours-gray p-8 md:p-12 rounded-[40px] border border-white/5"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-white/40 mb-3 font-bold">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-afterhours-black border border-white/10 rounded-xl px-6 py-4 focus:outline-none focus:border-afterhours-cyan transition-colors text-white"
                  placeholder="John Doe"
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-white/40 mb-3 font-bold">Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full bg-afterhours-black border border-white/10 rounded-xl px-6 py-4 focus:outline-none focus:border-afterhours-cyan transition-colors text-white"
                  placeholder="john@example.com"
                  value={formState.email}
                  onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-white/40 mb-3 font-bold">Inquiry Type</label>
                <select
                  className="w-full bg-afterhours-black border border-white/10 rounded-xl px-6 py-4 focus:outline-none focus:border-afterhours-cyan transition-colors text-white appearance-none"
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
                <label className="block text-[10px] uppercase tracking-[0.2em] text-white/40 mb-3 font-bold">Event Details</label>
                <textarea
                  rows={4}
                  className="w-full bg-afterhours-black border border-white/10 rounded-xl px-6 py-4 focus:outline-none focus:border-afterhours-cyan transition-colors text-white resize-none"
                  placeholder="Tell us about your event (Date, Location, Expected Guests...)"
                  value={formState.message}
                  onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                />
              </div>

              <a
                href="https://wa.me/919711844884"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-afterhours-cyan text-black py-6 rounded-full font-black uppercase tracking-widest hover:scale-[1.02] transition-transform flex items-center justify-center gap-3"
              >
                Inquire via WhatsApp <MessageSquare size={20} />
              </a>
              <button
                type="submit"
                className="w-full border border-white/10 text-white/40 py-4 rounded-full font-bold uppercase tracking-widest hover:text-white hover:border-white/20 transition-all text-xs"
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
