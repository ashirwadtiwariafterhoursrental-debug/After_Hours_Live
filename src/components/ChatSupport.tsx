import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, X, Send, Loader2, Phone } from "lucide-react";

import { getConciergeResponse } from "../services/gemini";

export function ChatSupport() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "model"; text: string }[]>([
    { role: "model", text: "Hey! 🎮 I'm your After Hours assistant. How can I help you build your ultimate arena today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>(["Games Night", "Movie Night", "Music & Fun", "Troubleshoot PS5"]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (text?: string) => {
    const userMessage = (text || input).trim();
    if (!userMessage || isLoading) return;

    setInput("");
    setQuickReplies([]); // Clear quick replies on send
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const data = await getConciergeResponse(userMessage, history);
      const { text: responseText, quickReplies: newQuickReplies } = data;
      
      setMessages(prev => [...prev, { role: "model", text: responseText }]);
      setQuickReplies(newQuickReplies || []);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { 
        role: "model", 
        text: "I'm having a bit of a technical glitch! 🔌 Please reach out to us directly on WhatsApp at +91 97118 44884 for immediate help." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[200]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 right-0 w-[350px] sm:w-[400px] bg-white border border-slate-200 rounded-[32px] shadow-2xl overflow-hidden flex flex-col h-[500px]"
          >
            {/* Header */}
            <div className="p-6 bg-[#003791] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="font-black uppercase italic text-sm text-white">After Hours Support</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] uppercase font-bold tracking-widest text-blue-100 opacity-95">Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide bg-slate-50"
            >
              {messages.map((msg, i) => (
                <div 
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user" 
                      ? "bg-[#003791] text-white rounded-tr-none font-sans shadow-xs" 
                      : "bg-white text-slate-800 border border-slate-200 rounded-tl-none font-sans shadow-xs"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-200 shadow-xs">
                    <Loader2 size={16} className="animate-spin text-[#003791]" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-200 bg-white">
              {/* Quick Replies */}
              {quickReplies.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply}
                      onClick={() => handleSend(reply)}
                      className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-[#003791] hover:bg-blue-50 transition-all cursor-pointer font-sans"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}
              
              <div className="flex items-center gap-2 bg-slate-50 rounded-2xl p-2 border border-slate-200 focus-within:border-[#003791] focus-within:ring-1 focus-within:ring-[#003791]/20 transition-all">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask about packages, KYC, or booking..."
                  className="flex-1 bg-transparent border-none focus:outline-none text-sm px-2 text-slate-800 placeholder:text-slate-450 font-sans"
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={isLoading || !input.trim()}
                  className="w-10 h-10 rounded-xl bg-[#003791] text-white flex items-center justify-center hover:bg-blue-900 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Send size={18} />
                </button>
              </div>
              <div className="mt-3 flex justify-center">
                <a 
                  href="https://wa.me/919711844884"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] uppercase font-black tracking-widest text-[#003791] flex items-center gap-1.5 hover:text-blue-900 transition-colors font-mono"
                >
                  <Phone size={10} /> Need immediate help? WhatsApp Us
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 cursor-pointer ${
          isOpen ? "bg-slate-200 text-slate-800 rotate-90" : "bg-[#003791] text-white hover:bg-blue-900 shadow-md"
        }`}
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
      </motion.button>
    </div>
  );
}
