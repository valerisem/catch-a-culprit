import { config } from "../config";
import type { FirefliesTranscript } from "../types";

const FIREFLIES_GRAPHQL_URL = "https://api.fireflies.ai/graphql";

/**
 * Fetches a full transcript from Fireflies by meeting ID.
 */
export async function fetchTranscript(
  meetingId: string
): Promise<FirefliesTranscript> {
  const query = `
    query Transcript($transcriptId: String!) {
      transcript(id: $transcriptId) {
        id
        title
        date
        duration
        organizer_email
        participants
        sentences {
          text
          speaker_name
          start_time
          end_time
        }
        summary {
          action_items
          overview
          shorthand_bullet
        }
      }
    }
  `;

  const response = await fetch(FIREFLIES_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.fireflies.apiKey}`,
    },
    body: JSON.stringify({
      query,
      variables: { transcriptId: meetingId },
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Fireflies API error: ${response.status} ${response.statusText}`
    );
  }

  const json = await response.json();

  if (json.errors) {
    throw new Error(
      `Fireflies GraphQL error: ${JSON.stringify(json.errors)}`
    );
  }

  return json.data.transcript;
}

/**
 * Converts Fireflies sentences into a readable transcript string.
 */
export function formatTranscript(transcript: FirefliesTranscript): string {
  const lines = transcript.sentences.map(
    (s) => `${s.speaker_name}: ${s.text}`
  );

  return [
    `Meeting: ${transcript.title}`,
    `Date: ${transcript.date}`,
    `Duration: ${Math.round(transcript.duration / 60)} minutes`,
    `Participants: ${transcript.participants.join(", ")}`,
    "",
    "--- Transcript ---",
    "",
    ...lines,
    "",
    "--- AI Summary ---",
    transcript.summary.overview,
    "",
    "--- Action Items ---",
    transcript.summary.action_items,
  ].join("\n");
}
