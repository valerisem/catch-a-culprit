import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SuspectData } from "../data/mockData";

type ActionType = "kill" | "marry" | "fuck" | null;

interface RevealCulpritProps {
  suspects: SuspectData[];
  culprits: SuspectData[];
  onComplete: (action: ActionType) => void;
}

const REVEAL_SOUND_URL =
  "https://qrqbkefzntfsdnbkxqag.supabase.co/storage/v1/object/public/culprit_game/DSGNImpt-Short,_powerful_cine-Elevenlabs.mp3";

/** Renders markdown-like text: ### headings become bold, double newlines become paragraph gaps */
function FormattedText({ text, className }: { text: string; className?: string }) {
  // Split into sections by ### headers
  const sections = text.split(/^###\s*/m).filter(Boolean);

  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      {sections.map((section, i) => {
        const lines = section.trim().split(/\n\n+/);
        const firstLine = lines[0]?.trim();
        const rest = lines.slice(1).join("\n\n").trim();

        // If original text had ### headers, first line of each section is the title
        const hasHeaders = text.includes("###");

        if (hasHeaders) {
          return (
            <div key={i} className={i > 0 ? "pt-1.5 border-t border-gray-700/50" : ""}>
              {firstLine && (
                <p className="text-white font-bold text-[10px] sm:text-xs uppercase tracking-wide mb-0.5">
                  {firstLine}
                </p>
              )}
              {rest && (
                <p className="text-gray-300 text-[10px] sm:text-xs leading-relaxed">{rest}</p>
              )}
            </div>
          );
        }

        // No headers — just render paragraphs
        return (
          <p key={i} className="text-gray-300 text-[10px] sm:text-xs leading-relaxed">
            {section.trim()}
          </p>
        );
      })}
    </div>
  );
}

export function RevealCulprit({
  suspects,
  culprits,
  onComplete,
}: RevealCulpritProps) {
  const [isSpinning, setIsSpinning] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCulprits, setShowCulprits] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(REVEAL_SOUND_URL);
    audioRef.current.load();
  }, []);

  useEffect(() => {
    if (isSpinning) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % suspects.length);
      }, 100);

      const timeout = setTimeout(() => {
        setIsSpinning(false);
        setShowCulprits(true);
        if (audioRef.current) {
          audioRef.current.play().catch(() => {});
        }
        setTimeout(() => setShowButtons(true), 1000);
      }, 3000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [isSpinning, suspects.length]);

  const isSingle = culprits.length === 1;
  const photoSize = culprits.length >= 3
    ? "w-24 h-24 sm:w-32 sm:h-32"
    : culprits.length === 2
    ? "w-32 h-32 sm:w-40 sm:h-40"
    : "w-36 h-36 sm:w-44 sm:h-44";

  // For multi-culprit: find a single shared summary from whichever culprit has non-empty whyCulprit
  const summarySource = culprits.find((c) => c.whyCulprit && c.whyCulprit.trim().length > 0) || culprits[0];
  const sharedWhyCulprit = summarySource.whyCulprit || summarySource.conclusion;
  const sharedNextSteps = summarySource.nextSteps ||
    culprits.find((c) => c.nextSteps && c.nextSteps.trim().length > 0)?.nextSteps;

  return (
    <div className="h-screen bg-white flex items-center justify-center p-2 sm:p-3 overflow-y-auto">
      <div className="max-w-4xl w-full text-center">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-2 sm:mb-3"
        >
          <div className="bg-[#F57179] text-white px-4 sm:px-6 py-1.5 sm:py-2 inline-block transform -rotate-2 border-2 border-black shadow-2xl">
            <h1 className="text-lg sm:text-2xl md:text-3xl uppercase tracking-wider">
              REVEALING THE {isSingle ? "CULPRIT" : "CULPRITS"}
            </h1>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {isSpinning ? (
            <motion.div
              key="spinning"
              className="relative"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <div className="w-36 h-36 sm:w-48 sm:h-48 mx-auto border-4 border-[#A93091] bg-gray-800 overflow-hidden shadow-2xl relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.1, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0"
                >
                  <img
                    src={suspects[currentIndex].photoMain}
                    alt="Spinning suspect"
                    className="w-full h-full object-cover blur-sm"
                  />
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
              </div>
              <motion.p
                className="text-sm sm:text-lg text-black mt-3 uppercase tracking-widest"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                Analyzing Evidence...
              </motion.p>
            </motion.div>
          ) : (
            <motion.div
              key="revealed"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              {showCulprits && (
                <div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-2"
                  >
                    <div className="bg-[#E24093] text-white px-3 py-1 sm:py-1.5 inline-block border-2 border-black shadow-lg mb-2">
                      <p className="text-sm sm:text-lg uppercase tracking-wide">
                        THE {isSingle ? "CULPRIT IS" : "CULPRITS ARE"}...
                      </p>
                    </div>
                  </motion.div>

                  {/* Culprit photos row */}
                  <div className={`flex justify-center ${culprits.length > 1 ? "gap-3 sm:gap-5" : ""} mb-2`}>
                    {culprits.map((c, i) => (
                      <motion.div
                        key={c.id}
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 + i * 0.2 }}
                        className={`${photoSize} border-4 border-[#F57179] bg-gray-800 overflow-hidden shadow-[0_0_30px_rgba(245,113,121,0.5)]`}
                      >
                        <img src={c.photoCulprit} alt={c.name} className="w-full h-full object-cover" />
                      </motion.div>
                    ))}
                  </div>

                  {/* Culprit names */}
                  <motion.h2
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6, type: "spring" }}
                    className="text-lg sm:text-2xl md:text-3xl uppercase tracking-tight text-[#F57179] mb-2 sm:mb-3"
                  >
                    {culprits.map((c) => c.name).join(" & ")}
                  </motion.h2>

                  {/* Evidence summary: Why (left) + Next Steps (right) */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mb-2 sm:mb-3 max-w-4xl mx-auto max-h-[35vh] overflow-y-auto"
                  >
                    <div className={`grid gap-2 ${sharedNextSteps ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 max-w-xl mx-auto"}`}>
                      {/* Why box — left */}
                      <div className="bg-[#250e8c] border-2 border-[#F57179] shadow-[4px_4px_0px_0px_rgba(245,113,121,1)] p-2 sm:p-3 text-left">
                        <h3 className="text-[10px] sm:text-xs uppercase tracking-wider text-white mb-1">
                          ⚠️ Why {isSingle ? "They're The Culprit" : "They're The Culprits"}
                        </h3>
                        <div className="bg-gray-900 p-2 border border-[#F57179]">
                          <p className="text-gray-300 text-[10px] sm:text-xs leading-relaxed">
                            {sharedWhyCulprit}
                          </p>
                        </div>
                      </div>

                      {/* Next Steps box — right */}
                      {sharedNextSteps && (
                        <div className="bg-[#250e8c] border-2 border-[#F57179] shadow-[4px_4px_0px_0px_rgba(245,113,121,1)] p-2 sm:p-3 text-left">
                          <h3 className="text-[10px] sm:text-xs uppercase tracking-wider text-white mb-1">
                            📌 Next Steps
                          </h3>
                          <div className="bg-gray-900 p-2 border border-[#F57179]">
                            <FormattedText text={sharedNextSteps} />
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Action Buttons */}
                  <AnimatePresence>
                    {showButtons && (
                      <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex justify-center gap-3 sm:gap-4"
                      >
                        <button
                          onClick={() => onComplete("kill")}
                          className="px-4 sm:px-6 py-1.5 sm:py-2 bg-[#F57179] text-white text-sm sm:text-base uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all duration-200"
                        >
                          Kill
                        </button>
                        <button
                          onClick={() => onComplete("marry")}
                          className="px-4 sm:px-6 py-1.5 sm:py-2 bg-[#E24093] text-white text-sm sm:text-base uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all duration-200"
                        >
                          Marry
                        </button>
                        <button
                          onClick={() => onComplete("fuck")}
                          className="px-4 sm:px-6 py-1.5 sm:py-2 bg-[#A93091] text-white text-sm sm:text-base uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all duration-200"
                        >
                          Fuck
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
