import { supabase } from "../lib/supabase";

export interface MonthlyDataPoint {
  month: string;
  value: number;
}

export interface SuspectData {
  id: number;
  name: string;
  country: string;
  memberSince: string;
  bio: string;
  image: string;
  videoUrl: string;
  callSummary: string;
  conclusion: string;
  culprit: boolean;
  photoMain: string;
  photoCulprit: string;
  photoKill: string;
  photoMarry: string;
  photoFuck: string;
  whyCulprit: string | null;
  nextSteps: string | null;
  reportLink: string | null;
  paidAmount: MonthlyDataPoint[];
  influencersApproved: MonthlyDataPoint[];
  influencerSearch: MonthlyDataPoint[];
  influencerSearchShow: MonthlyDataPoint[];
  audienceData: MonthlyDataPoint[];
  pctClicksUnder05s: MonthlyDataPoint[];
  ipAddresses: MonthlyDataPoint[];
  timeSpent: MonthlyDataPoint[];
  consecutiveActions: MonthlyDataPoint[];
}

interface CulpritGameRow {
  id: number;
  person_name: string;
  country: string;
  member_since: string;
  dossier: string | null;
  call_summary: string | null;
  conclusion: string | null;
  photo_main: string | null;
  photo_culprit: string | null;
  photo_kill: string | null;
  photo_marry: string | null;
  photo_fuck: string | null;
  interrogation_footage: string | null;
  paid_december: number;
  paid_january: number;
  paid_february: number;
  influencers_approved_dec: number;
  influencers_approved_jan: number;
  influencers_approved_feb: number;
  influencer_search_dec: number;
  influencer_search_jan: number;
  influencer_search_feb: number;
  influencer_search_show_dec: number;
  influencer_search_show_jan: number;
  influencer_search_show_feb: number;
  audience_data_dec: number;
  audience_data_jan: number;
  audience_data_feb: number;
  pct_clicks_under_05s_dec: number;
  pct_clicks_under_05s_jan: number;
  pct_clicks_under_05s_feb: number;
  ip_addresses_dec: number;
  ip_addresses_jan: number;
  ip_addresses_feb: number;
  time_spent_dec: number;
  time_spent_jan: number;
  time_spent_feb: number;
  consecutive_actions_dec: number;
  consecutive_actions_jan: number;
  consecutive_actions_feb: number;
  why_culprit: string | null;
  next_steps: string | null;
  report_link: string | null;
  "is_culprit?": boolean;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

const PLACEHOLDER_IMAGE = "https://placehold.co/400x400/1e293b/white?text=No+Photo";

function mapRowToSuspect(row: CulpritGameRow): SuspectData {
  return {
    id: row.id,
    name: row.person_name,
    country: row.country || "",
    memberSince: row.member_since ? formatDate(row.member_since) : "",
    bio: row.dossier || "",
    image: row.photo_main || PLACEHOLDER_IMAGE,
    videoUrl: row.interrogation_footage || "",
    callSummary: row.call_summary || "",
    conclusion: row.conclusion || "",
    culprit: row["is_culprit?"] === true,
    photoMain: row.photo_main || PLACEHOLDER_IMAGE,
    photoCulprit: row.photo_culprit || row.photo_main || PLACEHOLDER_IMAGE,
    photoKill: row.photo_kill || row.photo_main || PLACEHOLDER_IMAGE,
    photoMarry: row.photo_marry || row.photo_main || PLACEHOLDER_IMAGE,
    photoFuck: row.photo_fuck || row.photo_main || PLACEHOLDER_IMAGE,
    whyCulprit: row.why_culprit,
    nextSteps: row.next_steps,
    reportLink: row.report_link,
    paidAmount: [
      { month: "Dec", value: Number(row.paid_december) || 0 },
      { month: "Jan", value: Number(row.paid_january) || 0 },
      { month: "Feb", value: Number(row.paid_february) || 0 },
    ],
    influencersApproved: [
      { month: "Dec", value: Number(row.influencers_approved_dec) || 0 },
      { month: "Jan", value: Number(row.influencers_approved_jan) || 0 },
      { month: "Feb", value: Number(row.influencers_approved_feb) || 0 },
    ],
    influencerSearch: [
      { month: "Dec", value: Number(row.influencer_search_dec) || 0 },
      { month: "Jan", value: Number(row.influencer_search_jan) || 0 },
      { month: "Feb", value: Number(row.influencer_search_feb) || 0 },
    ],
    influencerSearchShow: [
      { month: "Dec", value: Number(row.influencer_search_show_dec) || 0 },
      { month: "Jan", value: Number(row.influencer_search_show_jan) || 0 },
      { month: "Feb", value: Number(row.influencer_search_show_feb) || 0 },
    ],
    audienceData: [
      { month: "Dec", value: Number(row.audience_data_dec) || 0 },
      { month: "Jan", value: Number(row.audience_data_jan) || 0 },
      { month: "Feb", value: Number(row.audience_data_feb) || 0 },
    ],
    pctClicksUnder05s: [
      { month: "Dec", value: Number(row.pct_clicks_under_05s_dec) || 0 },
      { month: "Jan", value: Number(row.pct_clicks_under_05s_jan) || 0 },
      { month: "Feb", value: Number(row.pct_clicks_under_05s_feb) || 0 },
    ],
    ipAddresses: [
      { month: "Dec", value: Number(row.ip_addresses_dec) || 0 },
      { month: "Jan", value: Number(row.ip_addresses_jan) || 0 },
      { month: "Feb", value: Number(row.ip_addresses_feb) || 0 },
    ],
    timeSpent: [
      { month: "Dec", value: Number(row.time_spent_dec) || 0 },
      { month: "Jan", value: Number(row.time_spent_jan) || 0 },
      { month: "Feb", value: Number(row.time_spent_feb) || 0 },
    ],
    consecutiveActions: [
      { month: "Dec", value: Number(row.consecutive_actions_dec) || 0 },
      { month: "Jan", value: Number(row.consecutive_actions_jan) || 0 },
      { month: "Feb", value: Number(row.consecutive_actions_feb) || 0 },
    ],
  };
}

export async function fetchSuspects(): Promise<SuspectData[]> {
  const { data, error } = await supabase
    .from("culprit_game")
    .select("*")
    .order("id");

  if (error) {
    console.error("Error fetching suspects:", error);
    throw error;
  }

  return (data as CulpritGameRow[]).map(mapRowToSuspect);
}
