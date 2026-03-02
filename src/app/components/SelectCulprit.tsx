import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SuspectData } from "../data/mockData";

interface SelectCulpritProps {
  suspects: SuspectData[];
  culpritCount: number;
  onAllFound: () => void;
}

/**
 * Build a <style> block with a unique @keyframes per card.
 * Each card drifts in a different figure-8-ish loop so they all
 * feel alive but move at their own pace.
 */
function useDriftStyles(count: number) {
  return useMemo(() => {
    const rules: string[] = [];

    for (let i = 0; i < count; i++) {
      const seed = i * 137.5; // golden-angle spread
      const xA = Math.round(Math.cos(seed) * (12 + (i % 3) * 6));
      const yA = Math.round(Math.sin(seed) * (10 + (i % 4) * 5));
      const xB = Math.round(Math.sin(seed + 2) * -(10 + (i % 3) * 5));
      const yB = Math.round(Math.cos(seed + 1) * -(8 + (i % 4) * 4));
      const xC = Math.round(Math.cos(seed + 4) * (8 + (i % 2) * 6));
      const yC = Math.round(Math.sin(seed + 3) * (10 + (i % 3) * 4));

      rules.push(`
        @keyframes card-drift-${i} {
          0%, 100% { transform: translate(0px, 0px); }
          25%      { transform: translate(${xA}px, ${yA}px); }
          50%      { transform: translate(${xB}px, ${yB}px); }
          75%      { transform: translate(${xC}px, ${yC}px); }
        }
      `);
    }

    return rules.join("\n");
  }, [count]);
}

export function SelectCulprit({ suspects, culpritCount, onAllFound }: SelectCulpritProps) {
  const [wrongSelections, setWrongSelections] = useState<Set<number>>(new Set());
  const [foundCulprits, setFoundCulprits] = useState<Set<number>>(new Set());
  const [shakingId, setShakingId] = useState<number | null>(null);

  const driftCSS = useDriftStyles(suspects.length);

  const handleSuspectClick = useCallback(
    (suspect: SuspectData) => {
      if (foundCulprits.has(suspect.id)) return;
      if (wrongSelections.has(suspect.id)) return;

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
    },
    [foundCulprits, wrongSelections, culpritCount, onAllFound]
  );

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-auto">
      {/* Inject per-card drift keyframes */}
      <style dangerouslySetInnerHTML={{ __html: driftCSS }} />

      {/* Header – compact on mobile so it doesn't get cut off */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center pt-4 pb-2 sm:pt-6 sm:pb-3 px-3 shrink-0"
      >
        <div className="bg-[#E24093] text-white px-4 sm:px-6 py-1.5 sm:py-2 inline-block transform -rotate-2 border-2 sm:border-4 border-black shadow-2xl">
          <h1 className="text-base sm:text-2xl md:text-3xl uppercase tracking-wider">
            🔍 WHO {culpritCount > 1 ? "ARE THE CULPRITS" : "IS THE CULPRIT"}? 🔍
          </h1>
        </div>
        <p className="text-xs sm:text-lg text-black mt-1.5 sm:mt-3">
          {culpritCount > 1
            ? `Find all ${culpritCount} culprits! (${foundCulprits.size}/${culpritCount} found)`
            : "Select the suspect you believe is guilty"}
        </p>
      </motion.div>

      {/* Cards area */}
      <div className="flex-1 flex items-center justify-center px-2 pb-4 sm:px-4 sm:pb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 max-w-6xl mx-auto w-full">
          {suspects.map((suspect, index) => {
            const isWrong = wrongSelections.has(suspect.id);
            const isFound = foundCulprits.has(suspect.id);
            const isShaking = shakingId === suspect.id;

            // Each card gets a unique duration so they're never in sync
            const driftDuration = 4 + (index % 3) * 1.5 + (index % 2) * 0.7;

            return (
              /* Outer wrapper handles the CSS drift animation */
              <div
                key={suspect.id}
                style={
                  isFound || isWrong
                    ? { animation: "none" }
                    : {
                        animation: `card-drift-${index} ${driftDuration}s ease-in-out infinite`,
                      }
                }
              >
                {/* Inner motion.div for entry pop + shake */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                    x: isShaking ? [0, -10, 10, -10, 10, 0] : 0,
                  }}
                  transition={{
                    scale: { delay: index * 0.1, type: "spring", stiffness: 200 },
                    opacity: { delay: index * 0.1 },
                    x: isShaking ? { duration: 0.5 } : undefined,
                  }}
                  onClick={() => handleSuspectClick(suspect)}
                  className={`cursor-pointer select-none ${
                    isWrong ? "pointer-events-none" : ""
                  }`}
                  whileHover={!isFound && !isWrong ? { scale: 1.05 } : undefined}
                  whileTap={!isFound && !isWrong ? { scale: 0.95 } : undefined}
                >
                  <div
                    className={`relative bg-[#250e8c] border-2 sm:border-3 ${
                      isFound
                        ? "border-green-500 ring-2 ring-green-400"
                        : isWrong
                        ? "border-red-600 bg-red-900/30"
                        : "border-[#A93091]"
                    } shadow-[4px_4px_0px_0px_rgba(169,48,145,1)] sm:shadow-[6px_6px_0px_0px_rgba(169,48,145,1)] transition-colors duration-200 p-1.5 sm:p-3`}
                  >
                    {/* Photo */}
                    <div className="w-full aspect-square border-2 sm:border-3 border-black overflow-hidden bg-gray-700">
                      <img
                        src={suspect.photoMain}
                        alt={suspect.name}
                        className={`w-full h-full object-cover ${
                          isWrong ? "grayscale" : ""
                        }`}
                        draggable={false}
                      />
                    </div>

                    {/* Name & country */}
                    <h3 className="text-xs sm:text-sm md:text-base uppercase tracking-tight text-white mt-1 sm:mt-2 text-center leading-tight">
                      {suspect.name}
                    </h3>
                    <p className="text-gray-400 text-center text-[10px] sm:text-xs">
                      {suspect.country}
                    </p>

                    {/* FOUND / WRONG overlay badge */}
                    <AnimatePresence>
                      {isFound && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="absolute inset-x-0 bottom-0 flex justify-center"
                        >
                          <div className="bg-green-600 text-white px-3 py-1 text-xs sm:text-sm border-2 border-black uppercase tracking-wider font-bold translate-y-1/2">
                            FOUND!
                          </div>
                        </motion.div>
                      )}
                      {isWrong && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="absolute inset-x-0 bottom-0 flex justify-center"
                        >
                          <div className="bg-red-600 text-white px-3 py-1 text-xs sm:text-sm border-2 border-black uppercase tracking-wider font-bold translate-y-1/2">
                            WRONG!
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
