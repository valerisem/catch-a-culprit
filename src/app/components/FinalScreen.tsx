import { useEffect, useCallback } from "react";
import { motion } from "motion/react";
import confetti from "canvas-confetti";
import { SuspectData } from "../data/mockData";

type ActionType = "kill" | "marry" | "fuck" | null;

interface FinalScreenProps {
  culprits: SuspectData[];
  allSuspects: SuspectData[];
  onRestart: () => void;
  action: ActionType;
}

const actionMessages = {
  kill: "Well, that was rude",
  marry: "Well, that was unexpected",
  fuck: "Calling Cheryl now!",
};

function getActionPhoto(culprit: SuspectData, action: ActionType): string {
  switch (action) {
    case "kill": return culprit.photoKill;
    case "marry": return culprit.photoMarry;
    case "fuck": return culprit.photoFuck;
    default: return culprit.photoCulprit;
  }
}

/** Renders markdown-like text: ### headings become bold, double newlines become paragraph gaps */
function FormattedText({ text, className }: { text: string; className?: string }) {
  const sections = text.split(/^###\s*/m).filter(Boolean);

  return (
    <div className={`space-y-2.5 ${className ?? ""}`}>
      {sections.map((section, i) => {
        const lines = section.trim().split(/\n\n+/);
        const firstLine = lines[0]?.trim();
        const rest = lines.slice(1).join("\n\n").trim();
        const hasHeaders = text.includes("###");

        if (hasHeaders) {
          return (
            <div key={i} className={i > 0 ? "pt-2 border-t border-gray-700/50" : ""}>
              {firstLine && (
                <p className="text-white font-bold text-xs sm:text-sm uppercase tracking-wide mb-0.5">
                  {firstLine}
                </p>
              )}
              {rest && (
                <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">{rest}</p>
              )}
            </div>
          );
        }

        return (
          <p key={i} className="text-gray-300 text-xs sm:text-sm leading-relaxed">
            {section.trim()}
          </p>
        );
      })}
    </div>
  );
}

/** Data table showing all suspects' metrics in a spreadsheet-like format */
function InvestigationTable({ suspects }: { suspects: SuspectData[] }) {
  const metrics = [
    { key: "paidAmount" as const, label: "Paid Amount", emoji: "💰", format: (v: number) => `$${v.toLocaleString()}` },
    { key: "influencersApproved" as const, label: "Influencers Approved", emoji: "✅", format: (v: number) => v.toLocaleString() },
    { key: "influencerSearch" as const, label: "Influencer Search", emoji: "🔎", format: (v: number) => v.toLocaleString() },
    { key: "influencerSearchShow" as const, label: "Search Show", emoji: "👁", format: (v: number) => v.toLocaleString() },
    { key: "audienceData" as const, label: "Audience Data", emoji: "👥", format: (v: number) => v.toLocaleString() },
    { key: "pctClicksUnder05s" as const, label: "% Clicks <0.5s", emoji: "⚡", format: (v: number) => `${(v * 100).toFixed(1)}%` },
    { key: "ipAddresses" as const, label: "IP Addresses", emoji: "🌐", format: (v: number) => v.toLocaleString() },
    { key: "timeSpent" as const, label: "Time Spent (hrs)", emoji: "⏱", format: (v: number) => v.toFixed(1) },
    { key: "consecutiveActions" as const, label: "Actions <2s", emoji: "🏃", format: (v: number) => v.toLocaleString() },
  ];

  const months = ["Dec", "Jan", "Feb"];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[9px] sm:text-xs border-collapse">
        {/* Header row with suspect names */}
        <thead>
          <tr>
            <th className="text-left text-gray-400 uppercase tracking-wider p-1.5 border-b border-gray-700 sticky left-0 bg-[#1a0a5c] z-10 min-w-[100px]">
              Metric
            </th>
            <th className="text-center text-gray-400 uppercase tracking-wider p-1.5 border-b border-gray-700 min-w-[40px]">
              Month
            </th>
            {suspects.map((s) => (
              <th
                key={s.id}
                className={`text-center p-1.5 border-b min-w-[70px] ${
                  s.culprit
                    ? "text-[#F57179] border-[#F57179] font-bold"
                    : "text-gray-300 border-gray-700"
                }`}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <div className={`w-6 h-6 sm:w-7 sm:h-7 border overflow-hidden bg-gray-700 flex-shrink-0 ${
                    s.culprit ? "border-[#F57179]" : "border-gray-600"
                  }`}>
                    <img src={s.photoMain} alt={s.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="truncate max-w-[80px]">{s.name.split(" ")[0]}</span>
                  {s.culprit && <span className="text-[7px] text-[#F57179]">CULPRIT</span>}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metrics.map((metric, mi) => (
            months.map((month, monthIdx) => (
              <tr
                key={`${metric.key}-${month}`}
                className={`${
                  monthIdx === 0 && mi > 0 ? "border-t border-gray-700" : ""
                } hover:bg-[#250e8c]/50`}
              >
                {/* Metric name (only on first month row) */}
                {monthIdx === 0 ? (
                  <td
                    rowSpan={3}
                    className="text-gray-300 p-1.5 align-middle sticky left-0 bg-[#1a0a5c] z-10 border-r border-gray-700"
                  >
                    <span className="mr-1">{metric.emoji}</span>
                    {metric.label}
                  </td>
                ) : null}
                {/* Month */}
                <td className="text-center text-gray-400 p-1 border-r border-gray-800">
                  {month}
                </td>
                {/* Values for each suspect */}
                {suspects.map((s) => {
                  const val = s[metric.key][monthIdx]?.value ?? 0;
                  return (
                    <td
                      key={s.id}
                      className={`text-center p-1 ${
                        s.culprit ? "text-white font-medium" : "text-gray-400"
                      }`}
                    >
                      {metric.format(val)}
                    </td>
                  );
                })}
              </tr>
            ))
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FinalScreen({ culprits, allSuspects, onRestart, action }: FinalScreenProps) {
  useEffect(() => {
    const duration = 5000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }
    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
    return () => clearInterval(interval);
  }, []);

  const photoSize = culprits.length >= 3
    ? "w-20 h-20 sm:w-28 sm:h-28"
    : culprits.length === 2
    ? "w-24 h-24 sm:w-32 sm:h-32"
    : "w-28 h-28 sm:w-36 sm:h-36";

  const culpritNames = culprits.map((c) => c.name).join(" & ");

  // Build Excel export from Supabase data
  const handleExportExcel = useCallback(() => {
    import("xlsx").then((XLSX) => {
      const wb = XLSX.utils.book_new();

      // One sheet per suspect
      allSuspects.forEach((s) => {
        const rows = [
          ["Metric", "December", "January", "February"],
          ["Paid Amount", ...s.paidAmount.map((d) => d.value)],
          ["Influencers Approved", ...s.influencersApproved.map((d) => d.value)],
          ["Influencer Search", ...s.influencerSearch.map((d) => d.value)],
          ["Influencer Search Show", ...s.influencerSearchShow.map((d) => d.value)],
          ["Audience Data", ...s.audienceData.map((d) => d.value)],
          ["% Clicks Under 0.5s", ...s.pctClicksUnder05s.map((d) => d.value)],
          ["IP Addresses", ...s.ipAddresses.map((d) => d.value)],
          ["Time Spent (hours)", ...s.timeSpent.map((d) => d.value)],
          ["Consecutive Actions <2s", ...s.consecutiveActions.map((d) => d.value)],
        ];
        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws["!cols"] = [{ wch: 25 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
        const sheetName = s.name.substring(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });

      // Summary sheet
      const months = ["Dec", "Jan", "Feb"];
      const summaryRows: (string | number)[][] = [
        ["Team Member", "Month", "Paid", "Influencers Approved", "Influencer Search", "Search Show", "Audience Data", "% Clicks <0.5s", "IP Addresses", "Time Spent (hrs)", "Actions <2s"],
      ];
      allSuspects.forEach((s) => {
        months.forEach((m, mi) => {
          summaryRows.push([
            s.name,
            m === "Dec" ? "December" : m === "Jan" ? "January" : "February",
            s.paidAmount[mi].value,
            s.influencersApproved[mi].value,
            s.influencerSearch[mi].value,
            s.influencerSearchShow[mi].value,
            s.audienceData[mi].value,
            s.pctClicksUnder05s[mi].value,
            s.ipAddresses[mi].value,
            s.timeSpent[mi].value,
            s.consecutiveActions[mi].value,
          ]);
        });
      });
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
      summaryWs["!cols"] = [{ wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 16 }];
      XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

      XLSX.writeFile(wb, "Team_Analysis_Report.xlsx");
    });
  }, [allSuspects]);

  // Find summary text
  const summarySource = culprits.find((c) => c.whyCulprit && c.whyCulprit.trim().length > 0)
    || culprits.find((c) => c.conclusion && c.conclusion.trim().length > 0);
  const summaryText = summarySource?.whyCulprit || summarySource?.conclusion;
  const nextStepsText = culprits.find((c) => c.nextSteps && c.nextSteps.trim().length > 0)?.nextSteps;

  return (
    <div className="h-screen bg-white overflow-y-auto">
      <div className="max-w-6xl mx-auto p-2 sm:p-3">
        {/* Top celebration section */}
        <div className="text-center relative z-10 mb-3 sm:mb-4">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <div className={`flex justify-center ${culprits.length > 1 ? "gap-2 sm:gap-4" : ""} mb-2 sm:mb-3`}>
              {culprits.map((c) => (
                <motion.div
                  key={c.id}
                  className={`${photoSize} border-4 border-[#E24093] bg-gray-800 overflow-hidden shadow-[0_0_30px_rgba(226,64,147,0.6)]`}
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <img src={getActionPhoto(c, action)} alt={`${c.name} - Final`} className="w-full h-full object-cover" />
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
            <div className="bg-gradient-to-r from-[#F57179] via-[#F67C73] to-[#E24093] text-white px-4 sm:px-6 py-1.5 sm:py-2 inline-block transform rotate-2 border-2 border-black shadow-2xl mb-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl uppercase tracking-tight">
                {action ? actionMessages[action] : "CONGRATS!"}
              </h1>
            </div>
          </motion.div>

          <motion.h2
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8, type: "spring" }}
            className="text-xl sm:text-2xl text-black mb-2"
          >
            🎉 The game is ovaa! 🎉
          </motion.h2>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="bg-[#250e8c] border-2 border-[#E24093] shadow-[4px_4px_0px_0px_rgba(226,64,147,1)] p-2 sm:p-3 max-w-xl mx-auto mb-2"
          >
            <p className="text-sm sm:text-base text-gray-300">
              You successfully identified <span className="text-[#E24093] font-bold">{culpritNames}</span> as the {culprits.length > 1 ? "culprits" : "culprit"}! 🔒
            </p>
          </motion.div>

          {/* Stars */}
          <div className="flex justify-center gap-2 sm:gap-3 mb-2">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="text-xl sm:text-3xl"
                initial={{ scale: 0, rotate: 0 }}
                animate={{ scale: [0, 1.2, 1], rotate: [0, 180, 360] }}
                transition={{ delay: 1.2 + i * 0.1, duration: 0.6 }}
              >
                ⭐
              </motion.div>
            ))}
          </div>

          {/* Badges */}
          <motion.div
            className="flex flex-wrap justify-center gap-2 mb-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
          >
            {["🏆 Case Solved", "🏆 Sophisticated Unraveler", "🏆 Extremely Wise Man"].map((badge, i) => (
              <motion.div
                key={badge}
                className="bg-[#F67C73] text-white px-2 sm:px-3 py-1 border-2 border-black shadow-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.8 + i * 0.1 }}
              >
                <p className="uppercase tracking-wider text-[10px] sm:text-xs">{badge}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Investigation Report Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2 }}
        >
          <div className="bg-[#250e8c] border-2 border-[#A93091] shadow-[4px_4px_0px_0px_rgba(169,48,145,1)] p-2 sm:p-3 mb-3">
            <h3 className="text-sm sm:text-base uppercase tracking-wider text-white mb-2 text-center border-b border-[#A93091] pb-1">
              📋 Investigation Report
            </h3>

            {/* Why / Summary of Findings */}
            {summaryText && (
              <div className="bg-gray-900 p-2 sm:p-3 border border-[#F57179] mb-2 sm:mb-3">
                <h4 className="text-xs sm:text-sm uppercase tracking-wider text-[#F67C73] mb-1">
                  🔍 Why {culprits.length > 1 ? "They're The Culprits" : "They're The Culprit"}
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">{summaryText}</p>
              </div>
            )}

            {/* Next Steps */}
            {nextStepsText && (
              <div className="bg-gray-900 p-2 sm:p-3 border border-[#F57179] mb-2 sm:mb-3">
                <h4 className="text-xs sm:text-sm uppercase tracking-wider text-[#F67C73] mb-1">
                  📌 Next Steps
                </h4>
                <FormattedText text={nextStepsText} />
              </div>
            )}

            {/* Data Table for all suspects */}
            <div className="bg-[#1a0a5c] border border-gray-700 p-1.5 sm:p-2">
              <h4 className="text-[10px] sm:text-xs uppercase tracking-wider text-gray-300 mb-1.5">
                📊 Team Data Comparison
              </h4>
              <InvestigationTable suspects={allSuspects} />
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex justify-center gap-3 pb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
        >
          <button
            onClick={onRestart}
            className="px-4 sm:px-6 py-1.5 sm:py-2 bg-[#A93091] text-white text-xs sm:text-sm uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all duration-200"
          >
            🔄 Start Over
          </button>
          <button
            onClick={handleExportExcel}
            className="px-4 sm:px-6 py-1.5 sm:py-2 bg-[#F57179] text-white text-xs sm:text-sm uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all duration-200"
          >
            📥 Download Excel
          </button>
        </motion.div>
      </div>
    </div>
  );
}
