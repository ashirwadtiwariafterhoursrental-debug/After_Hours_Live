import { motion } from "motion/react";

export function Gallery() {
  return (
    <section className="py-24 bg-white relative overflow-hidden border-t border-slate-100">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-black uppercase italic text-slate-800 mb-4"
          >
            After Hours <span className="text-[#003791]">In Action</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
            className="text-[#003791] uppercase tracking-[0.3em] text-xs font-extrabold font-mono"
          >
            The Vibe Gallery
          </motion.p>
        </div>

        <div className="rounded-[40px] overflow-hidden border border-slate-200 bg-slate-50 shadow-xs">
          <iframe 
            src="https://579585dbd5d4490d81420b378f637ee7.elf.site" 
            width="100%" 
            height="700" 
            style={{ border: 'none', minHeight: '600px' }}
            title="Instagram Feed"
          />
        </div>
      </div>
    </section>
  );
}
