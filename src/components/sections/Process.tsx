import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Choose Your Arena",
    description: "Select from our VIP personal packages or corporate activation bundles."
  },
  {
    number: "02",
    title: "Lock The Date",
    description: "Our team confirms the logistics and ensures zero-disruption planning."
  },
  {
    number: "03",
    title: "We Build",
    description: "We arrive, setup high-end tech, and manage the entire experience."
  },
  {
    number: "04",
    title: "Tear Down",
    description: "Once the adrenaline settles, we vanish. No mess, no stress."
  }
];

export function Process() {
  return (
    <section className="py-24 border-t border-slate-200 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black uppercase italic mb-6 text-slate-800">
            The <span className="text-[#003791]">Process</span>
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto font-medium">
            From booking to teardown, we handle every detail so you can focus on the game.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="text-7xl font-black text-[#003791]/5 absolute -top-10 -left-4 select-none">
                {step.number}
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-[#003791]/10 text-[#003791] rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="text-xl font-bold uppercase italic text-slate-800 mb-4">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
              
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-6 left-full w-full h-[1px] bg-gradient-to-r from-[#003791]/20 to-transparent -ml-6" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
