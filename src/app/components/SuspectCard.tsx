import { motion } from "motion/react";
import { MapPin, Calendar, TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { SuspectData, MonthlyDataPoint } from "../data/mockData";

function getEmbedUrl(url: string): { type: "iframe" | "video"; src: string } {
  // YouTube watch / short links
  const ytWatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (ytWatch) {
    return { type: "iframe", src: `https://www.youtube.com/embed/${ytWatch[1]}` };
  }
  if (url.includes("youtube.com/embed/")) {
    return { type: "iframe", src: url };
  }
  // Google Drive links: /file/d/{ID}/view, /file/d/{ID}/edit, etc.
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch) {
    return { type: "iframe", src: `https://drive.google.com/file/d/${driveMatch[1]}/preview` };
  }
  // Google Drive open?id= format
  const driveOpenMatch = url.match(/drive\.google\.com\/open\?id=([^&\s]+)/);
  if (driveOpenMatch) {
    return { type: "iframe", src: `https://drive.google.com/file/d/${driveOpenMatch[1]}/preview` };
  }
  return { type: "video", src: url };
}

const tooltipStyle = {
  backgroundColor: "#250e8c",
  border: "2px solid #A93091",
  color: "#ffffff",
  fontSize: 10,
  padding: "6px 8px",
};

interface MiniChartProps {
  title: string;
  emoji: string;
  data: MonthlyDataPoint[];
  color: string;
  format?: (v: number) => string;
}

function MiniChart({ title, emoji, data, color, format }: MiniChartProps) {
  return (
    <div className="bg-gray-900 p-1.5 border border-gray-700 flex flex-col">
      <p className="text-[8px] sm:text-[10px] uppercase tracking-wider text-gray-300 mb-0.5 truncate">
        {emoji} {title}
      </p>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#9CA3AF" tick={{ fontSize: 8 }} />
            <YAxis stroke="#9CA3AF" tick={{ fontSize: 7 }} width={30} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(val: number) => [format ? format(val) : val.toLocaleString(), title]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, r: 2 }}
              activeDot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Compute the average across a MonthlyDataPoint array */
function avg(data: MonthlyDataPoint[]): number {
  if (data.length === 0) return 0;
  return data.reduce((sum, d) => sum + d.value, 0) / data.length;
}

interface AvgStatProps {
  emoji: string;
  title: string;
  value: number;
  color: string;
  format?: (v: number) => string;
}

function AvgStat({ emoji, title, value, color, format }: AvgStatProps) {
  return (
    <div className="bg-gray-900 p-2 border border-gray-700 flex flex-col items-center justify-center text-center">
      <p className="text-[8px] sm:text-[10px] uppercase tracking-wider text-gray-300 mb-1 truncate w-full">
        {emoji} {title}
      </p>
      <p className="text-lg sm:text-2xl font-bold" style={{ color }}>
        {format ? format(value) : value.toLocaleString()}
      </p>
      <p className="text-[7px] sm:text-[8px] text-gray-500 uppercase tracking-wider mt-0.5">
        3-month avg
      </p>
    </div>
  );
}

export interface SuspectCardProps {
  suspect: SuspectData;
  suspectNumber: number;
  totalSuspects: number;
  onNext: () => void;
}

export function SuspectCard({
  suspect,
  suspectNumber,
  totalSuspects,
  onNext,
}: SuspectCardProps) {
  const isLastSuspect = suspectNumber === totalSuspects;

  return (
    <div className="h-screen bg-white p-1.5 sm:p-2 overflow-hidden flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex flex-col flex-1 min-h-0">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-1 sm:mb-1.5 flex-shrink-0"
        >
          <div className="flex items-center justify-between">
            <div className="bg-[#E24093] text-white px-3 sm:px-4 py-0.5 sm:py-1 inline-block transform -rotate-1 border-2 border-black shadow-lg">
              <p className="text-[10px] sm:text-sm uppercase tracking-wide">
                🔍 Suspect {suspectNumber} of {totalSuspects}
              </p>
            </div>
            <div className="flex gap-1">
              {[...Array(totalSuspects)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full border border-black ${
                    i < suspectNumber ? "bg-[#F67C73]" : "bg-white"
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5 sm:gap-2 flex-1 min-h-0">
          {/* Left Side - Bio + Charts */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-1.5 sm:gap-2 overflow-y-auto min-h-0"
          >
            {/* Dossier */}
            <div className="bg-[#250e8c] border-2 border-[#A93091] shadow-[3px_3px_0px_0px_rgba(169,48,145,1)] p-1.5 sm:p-2 flex-shrink-0">
              <div className="flex items-start gap-2 sm:gap-3 mb-1.5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 border-2 border-black overflow-hidden bg-gray-700 flex-shrink-0">
                  <img src={suspect.photoMain} alt={suspect.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm sm:text-base uppercase tracking-tight text-white mb-0.5 border-b border-[#F67C73] pb-0.5 truncate">
                    {suspect.name}
                  </h2>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-gray-300 text-[10px] sm:text-xs">
                      <MapPin className="w-2.5 h-2.5 text-[#F57179] flex-shrink-0" />
                      <span>{suspect.country}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-300 text-[10px] sm:text-xs">
                      <Calendar className="w-2.5 h-2.5 text-[#F57179] flex-shrink-0" />
                      <span>Member since {suspect.memberSince}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-900 p-1.5 border border-[#A93091]">
                <h3 className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#E24093] mb-0.5">
                  📋 Dossier
                </h3>
                <p className="text-gray-300 text-[9px] sm:text-[10px] leading-relaxed line-clamp-3">{suspect.bio}</p>
              </div>
            </div>

            {/* Usage Analysis - 3x2 charts + 3 averaged stats */}
            <div className="bg-[#250e8c] border-2 border-[#A93091] shadow-[3px_3px_0px_0px_rgba(169,48,145,1)] p-1.5 sm:p-2 flex-1 min-h-0 flex flex-col">
              <h3 className="text-[10px] sm:text-xs uppercase tracking-wider text-white mb-1 flex items-center gap-1 flex-shrink-0">
                <TrendingUp className="w-3 h-3 text-[#F57179]" />
                📊 Usage Analysis
              </h3>
              {/* 3x2 grid of charts — fills available space */}
              <div className="grid grid-cols-3 grid-rows-2 gap-1 flex-1 min-h-0">
                <MiniChart emoji="💰" title="Paid Amount" data={suspect.paidAmount} color="#f57c73" format={(v) => `$${v.toLocaleString()}`} />
                <MiniChart emoji="✅" title="Influencers Approved" data={suspect.influencersApproved} color="#e34094" />
                <MiniChart emoji="🔎" title="Influencer Search" data={suspect.influencerSearch} color="#A93091" />
                <MiniChart emoji="👁" title="Search Show" data={suspect.influencerSearchShow} color="#EAB308" />
                <MiniChart emoji="👥" title="Audience Data" data={suspect.audienceData} color="#22d3ee" />
                <MiniChart emoji="⏱" title="Time Spent (hrs)" data={suspect.timeSpent} color="#34d399" />
              </div>
              {/* 3 averaged stats row */}
              <div className="grid grid-cols-3 gap-1 mt-1 flex-shrink-0">
                <AvgStat
                  emoji="🌐"
                  title="IP Addresses"
                  value={Math.round(avg(suspect.ipAddresses))}
                  color="#a78bfa"
                />
                <AvgStat
                  emoji="⚡"
                  title="% Clicks <0.5s"
                  value={avg(suspect.pctClicksUnder05s)}
                  color="#fb923c"
                  format={(v) => `${(v * 100).toFixed(1)}%`}
                />
                <AvgStat
                  emoji="🏃"
                  title="Actions <2s"
                  value={Math.round(avg(suspect.consecutiveActions))}
                  color="#f472b6"
                />
              </div>
            </div>
          </motion.div>

          {/* Right Side - Video and Summary */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-1.5 sm:space-y-2 overflow-y-auto min-h-0"
          >
            {/* Video */}
            <div className="bg-[#250e8c] border-2 border-[#A93091] shadow-[3px_3px_0px_0px_rgba(169,48,145,1)] p-1.5 sm:p-2">
              <h3 className="text-[10px] sm:text-xs uppercase tracking-wider text-white mb-1">
                🎥 Interrogation Footage
              </h3>
              <div className="aspect-video bg-black border-2 border-gray-700">
                {(() => {
                  const embed = getEmbedUrl(suspect.videoUrl);
                  if (embed.type === "iframe") {
                    return (
                      <iframe
                        width="100%"
                        height="100%"
                        src={embed.src}
                        title={`${suspect.name} Interrogation`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    );
                  }
                  return (
                    <video width="100%" height="100%" controls className="w-full h-full object-contain">
                      <source src={embed.src} />
                    </video>
                  );
                })()}
              </div>
            </div>

            {/* Call Summary */}
            <div className="bg-[#250e8c] border-2 border-[#A93091] shadow-[3px_3px_0px_0px_rgba(169,48,145,1)] p-1.5 sm:p-2">
              <h3 className="text-[10px] sm:text-xs uppercase tracking-wider text-white mb-1">
                📝 Call Summary
              </h3>
              <div className="bg-gray-900 p-1.5 border border-gray-700 mb-1">
                <p className="text-gray-300 text-[9px] sm:text-[10px] leading-relaxed">
                  {suspect.callSummary}
                </p>
              </div>
              <div className="bg-gray-900 p-1.5 border border-gray-700">
                <h4 className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#F67C73] mb-0.5">
                  🔎 Conclusion
                </h4>
                <p className="text-gray-300 text-[9px] sm:text-[10px] leading-relaxed">
                  {suspect.conclusion}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Next Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-1 sm:mt-1.5 flex justify-center flex-shrink-0"
        >
          <button
            onClick={onNext}
            className="group relative px-5 sm:px-8 py-1 sm:py-1.5 bg-[#F67C73] text-white text-xs sm:text-base uppercase tracking-widest border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all duration-200"
          >
            {isLastSuspect ? "LET'S REVEAL THE CULPRIT" : "NEXT →"}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
