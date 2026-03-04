import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config";
import type { ExtractedDealData } from "../types";

const anthropic = new Anthropic({ apiKey: config.anthropic.apiKey });

const EXTRACTION_PROMPT = `You are a sales intelligence assistant. Analyze this meeting transcript and extract structured deal data for a CRM (HubSpot).

Extract the following fields. If a field cannot be determined from the transcript, use null or empty values as appropriate.

Return ONLY valid JSON with this exact structure:
{
  "contactName": "Full name of the client/prospect",
  "contactEmail": "Email if mentioned, otherwise empty string",
  "companyName": "Company/organization name of the prospect",
  "dealName": "A concise deal name (e.g. 'Acme Corp - Enterprise Plan')",
  "dealAmount": null or number (deal value if discussed),
  "dealStage": "One of: appointmentscheduled, qualifiedtobuy, presentationscheduled, decisionmakerboughtin, contractsent, closedwon, closedlost",
  "nextSteps": ["Array of concrete next steps discussed"],
  "painPoints": ["Array of pain points or challenges mentioned by the prospect"],
  "timeline": "Expected timeline or urgency mentioned",
  "notes": "Brief summary of the key discussion points (2-3 sentences)",
  "isNewDeal": true if this appears to be a first/discovery call, false if it's a follow-up on an existing deal
}

Be precise. Only include information explicitly stated or strongly implied in the transcript.`;

/**
 * Uses Claude API to extract structured deal data from a meeting transcript.
 */
export async function extractDealData(
  formattedTranscript: string
): Promise<ExtractedDealData> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `${EXTRACTION_PROMPT}\n\n--- TRANSCRIPT ---\n\n${formattedTranscript}`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude API");
  }

  // Extract JSON from response (handles markdown code blocks)
  let jsonStr = textBlock.text.trim();
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  const parsed = JSON.parse(jsonStr) as ExtractedDealData;
  return parsed;
}
