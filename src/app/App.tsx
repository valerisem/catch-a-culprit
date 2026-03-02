import { useState, useEffect } from "react";
import { LandingPage } from "./components/LandingPage";
import { SuspectCard } from "./components/SuspectCard";
import { SelectCulprit } from "./components/SelectCulprit";
import { RevealCulprit } from "./components/RevealCulprit";
import { FinalScreen } from "./components/FinalScreen";
import { fetchSuspects, SuspectData } from "./data/mockData";

type GameState = "landing" | "reviewing" | "selecting" | "revealing" | "final";
type ActionType = "kill" | "marry" | "fuck" | null;

export default function App() {
  const [gameState, setGameState] = useState<GameState>("landing");
  const [currentSuspectIndex, setCurrentSuspectIndex] = useState(0);
  const [selectedAction, setSelectedAction] = useState<ActionType>(null);
  const [suspects, setSuspects] = useState<SuspectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSuspects()
      .then((data) => {
        setSuspects(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load suspects. Please try again.");
        setLoading(false);
      });
  }, []);

  const culprits = suspects.filter((s) => s.culprit);

  const handleStart = () => {
    setGameState("reviewing");
    setCurrentSuspectIndex(0);
  };

  const handleNext = () => {
    if (currentSuspectIndex < suspects.length - 1) {
      setCurrentSuspectIndex(currentSuspectIndex + 1);
    } else {
      setGameState("selecting");
    }
  };

  const handleAllCulpritsFound = () => {
    setGameState("revealing");
  };

  const handleRevealComplete = (action: ActionType) => {
    setSelectedAction(action);
    setGameState("final");
  };

  const handleRestart = () => {
    setGameState("landing");
    setCurrentSuspectIndex(0);
    setSelectedAction(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#F57179] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xl text-gray-600 uppercase tracking-wider">Loading suspects...</p>
        </div>
      </div>
    );
  }

  if (error || suspects.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl text-red-500 mb-4">{error || "No suspects found."}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-[#F67C73] text-white text-xl uppercase tracking-wider border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {gameState === "landing" && <LandingPage onStart={handleStart} />}

      {gameState === "reviewing" && (
        <SuspectCard
          suspect={suspects[currentSuspectIndex]}
          suspectNumber={currentSuspectIndex + 1}
          totalSuspects={suspects.length}
          onNext={handleNext}
        />
      )}

      {gameState === "selecting" && (
        <SelectCulprit
          suspects={suspects}
          culpritCount={culprits.length}
          onAllFound={handleAllCulpritsFound}
        />
      )}

      {gameState === "revealing" && culprits.length > 0 && (
        <RevealCulprit
          suspects={suspects}
          culprits={culprits}
          onComplete={handleRevealComplete}
        />
      )}

      {gameState === "final" && culprits.length > 0 && (
        <FinalScreen
          culprits={culprits}
          allSuspects={suspects}
          onRestart={handleRestart}
          action={selectedAction}
        />
      )}
    </div>
  );
}
