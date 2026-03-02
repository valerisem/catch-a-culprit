import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SuspectData } from "../data/mockData";

interface SelectCulpritProps {
  suspects: SuspectData[];
  culpritCount: number;
  onAllFound: () => void;
}

export function SelectCulprit({ suspects, culpritCount, onAllFound }: SelectCulpritProps) {
  const [wrongSelections, setWrongSelections] = useState<Set<number>>(new Set());
  const [foundCulprits, setFoundCulprits] = useState<Set<number>>(new Set());
  const [shakingId, setShakingId] = useState<number | null>(null);

  const handleSuspectClick = (suspect: SuspectData) => {
    if (foundCulprits.has(suspect.id)) return;

    if (suspect.culprit) {
      const newFound = new Set(foundCulprits).add(suspect.id);
      setFoundCulprits(newFound);
      if (newFound.size >= culpritCount) {
        setTimeout(() => onAllFound(), 800);
      }
    } else {
      setWrongSelections(new Set(wrongSelections).add(suspect.id));
      setShakingId(suspect.id);
      setTimeout(() => setShakingId(null), 500);
    }
  };

  return (
    <div className="h-screen bg-white flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      <div className="max-w-6xl w-full">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-3 sm:mb-4"
        >
          <div className="bg-[#E24093] text-white px-4 sm:px-6 py-2 inline-block transform -rotate-2 border-3 sm:border-4 border-black shadow-2xl">
            <h1 className="text-xl sm:text-2xl md:text-3xl uppercase tracking-wider">
              🔍 WHO {culpritCount > 1 ? "ARE THE CULPRITS" : "IS THE CULPRIT"}? 🔍
            </h1>
          </div>
          <p className="text-sm sm:text-lg text-black mt-2 sm:mt-3">
            {culpritCount > 1
              ? `Find all ${culpritCount} culprits! (${foundCulprits.size}/${culpritCount} found)`
              : "Select the suspect you believe is guilty"}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 max-w-6xl mx-auto">
          {suspects.map((suspect, index) => {
            const isWrong = wrongSelections.has(suspect.id);
            const isFound = foundCulprits.has(suspect.id);
            const isShaking = shakingId === suspect.id;

            return (
              <motion.div
                key={suspect.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  x: isShaking ? [0, -10, 10, -10, 10, 0] : 0
                }}
                transition={{
                  delay: index * 0.1,
                  x: { duration: 0.5 }
                }}
                onClick={() => handleSuspectClick(suspect)}
                className={`cursor-pointer ${
                  isWrong ? "pointer-events-none" : ""
                }`}
              >
                <div
                  className={`bg-[#250e8c] border-2 sm:border-3 ${
                    isFound
                      ? "border-green-500 ring-2 ring-green-400"
                      : isWrong
                      ? "border-red-600 bg-red-900/30"
                      : "border-[#A93091]"
                  } shadow-[4px_4px_0px_0px_rgba(169,48,145,1)] sm:shadow-[6px_6px_0px_0px_rgba(169,48,145,1)] hover:shadow-[2px_2px_0px_0px_rgba(169,48,145,1)] sm:hover:shadow-[3px_3px_0px_0px_rgba(169,48,145,1)] hover:translate-x-1 hover:translate-y-1 transition-all duration-200 p-2 sm:p-3`}
                >
                  <div className="w-full aspect-square border-2 sm:border-3 border-black overflow-hidden bg-gray-700 mb-1 sm:mb-2">
                    <img
                      src={suspect.photoMain}
                      alt={suspect.name}
                      className={`w-full h-full object-cover ${
                        isWrong ? "grayscale" : ""
                      }`}
                    />
                  </div>
                  <h3 className="text-xs sm:text-sm md:text-base uppercase tracking-tight text-white mb-0.5 sm:mb-1 text-center">
                    {suspect.name}
                  </h3>
                  <p className="text-gray-400 text-center text-[10px] sm:text-xs">
                    {suspect.country}
                  </p>

                  <AnimatePresence>
                    {isFound && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="mt-1 sm:mt-2 bg-green-600 text-white px-2 py-1 text-center text-xs border-2 border-black"
                      >
                        <p className="uppercase tracking-wider">✅ FOUND!</p>
                      </motion.div>
                    )}
                    {isWrong && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="mt-1 sm:mt-2 bg-red-600 text-white px-2 py-1 text-center text-xs border-2 border-black"
                      >
                        <p className="uppercase tracking-wider">❌ WRONG!</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
