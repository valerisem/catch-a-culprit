import dotenv from "dotenv";
dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),

  // Fireflies
  fireflies: {
    apiKey: required("FIREFLIES_API_KEY"),
    webhookSecret: process.env.FIREFLIES_WEBHOOK_SECRET || "",
  },

  // Slack
  slack: {
    botToken: required("SLACK_BOT_TOKEN"),
    signingSecret: required("SLACK_SIGNING_SECRET"),
    defaultChannel: process.env.SLACK_DEFAULT_CHANNEL || "",
  },

  // HubSpot
  hubspot: {
    accessToken: required("HUBSPOT_ACCESS_TOKEN"),
  },

  // Anthropic (Claude API)
  anthropic: {
    apiKey: required("ANTHROPIC_API_KEY"),
  },
};
