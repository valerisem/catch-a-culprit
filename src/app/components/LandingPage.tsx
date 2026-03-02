import { motion } from "motion/react";
import { Lock } from "lucide-react";

interface LandingPageProps {
  onStart: () => void;
}

export function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="h-screen bg-white flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      <div className="max-w-4xl w-full text-center">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4 sm:mb-6">
            <Lock className="w-8 h-8 sm:w-12 sm:h-12 text-[#F57179]" strokeWidth={2} />
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-black tracking-tight">
              CATCH A
              <span className="block text-[#F57179] mt-1">CULPRIT</span>
            </h1>
            <Lock className="w-8 h-8 sm:w-12 sm:h-12 text-[#F57179]" strokeWidth={2} />
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mb-6 sm:mb-8"
        >
          <div className="bg-[#E24093] text-white px-5 sm:px-8 py-2 sm:py-3 inline-block transform -rotate-2 shadow-2xl border-3 sm:border-4 border-black">
            <p className="text-base sm:text-xl uppercase tracking-wide">
              Token Steal Investigation
            </p>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="text-sm sm:text-lg text-gray-700 mb-6 sm:mb-8 max-w-2xl mx-auto px-2"
        >
          Five suspects. One culprit. Review the documents, trace the data, and
          solve it in a sophisticated, chivalrous way before it is too late.
        </motion.p>

        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
        >
          <button
            onClick={onStart}
            className="group relative overflow-hidden px-10 sm:px-14 py-4 sm:py-5 bg-[#F67C73] text-white text-xl sm:text-2xl uppercase tracking-widest border-3 sm:border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all duration-200 cursor-pointer"
          >
            <span className="relative z-10 group-hover:opacity-0 transition-opacity">START</span>
            <motion.div
              className="absolute inset-0 bg-[#A93091] flex items-center justify-center"
              initial={{ scaleX: 0 }}
              whileHover={{ scaleX: 1 }}
              transition={{ duration: 0.3 }}
              style={{ originX: 0 }}
            >
              <span className="text-white text-xl sm:text-2xl uppercase tracking-widest">THE GAME</span>
            </motion.div>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="mt-8 sm:mt-10 flex justify-center gap-6 sm:gap-8"
        >
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 sm:w-3 sm:h-3 bg-[#F57179] rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
