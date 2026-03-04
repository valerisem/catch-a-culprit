import { App, ExpressReceiver, type KnownBlock } from "@slack/bolt";
import { config } from "../config";
import type {
  ExtractedDealData,
  HubSpotDeal,
  SlackActionPayload,
} from "../types";
import * as hubspot from "./hubspot";

// Use ExpressReceiver so we can mount Slack's routes on our own Express app
export const slackReceiver = new ExpressReceiver({
  signingSecret: config.slack.signingSecret,
  endpoints: "/events",
});

export const slackApp = new App({
  token: config.slack.botToken,
  receiver: slackReceiver,
});

/**
 * Sends a Slack message proposing to create a new deal.
 */
export async function sendNewDealMessage(
  channel: string,
  meetingId: string,
  meetingTitle: string,
  data: ExtractedDealData
): Promise<void> {
  const payload: SlackActionPayload = {
    meetingId,
    action: "create_deal",
    extractedData: data,
  };

  const blocks: KnownBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `New Sales Meeting: ${meetingTitle}`,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Contact:*\n${data.contactName}` },
        { type: "mrkdwn", text: `*Company:*\n${data.companyName}` },
        {
          type: "mrkdwn",
          text: `*Deal:*\n${data.dealName}`,
        },
        {
          type: "mrkdwn",
          text: `*Amount:*\n${data.dealAmount != null ? `$${data.dealAmount.toLocaleString()}` : "Not discussed"}`,
        },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Summary:*\n${data.notes}`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Next Steps:*\n${data.nextSteps.map((s) => `- ${s}`).join("\n")}`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Pain Points:*\n${data.painPoints.map((p) => `- ${p}`).join("\n")}`,
      },
    },
    { type: "divider" },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Create Deal in HubSpot",
          },
          style: "primary",
          action_id: "create_deal",
          value: JSON.stringify(payload),
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Dismiss",
          },
          action_id: "dismiss",
        },
      ],
    },
  ];

  await slackApp.client.chat.postMessage({
    channel,
    text: `New deal opportunity from meeting: ${meetingTitle}`,
    blocks,
  });
}

/**
 * Sends a Slack message proposing to update an existing deal.
 */
export async function sendUpdateDealMessage(
  channel: string,
  meetingId: string,
  meetingTitle: string,
  data: ExtractedDealData,
  existingDeal: HubSpotDeal
): Promise<void> {
  const payload: SlackActionPayload = {
    meetingId,
    action: "update_deal",
    extractedData: data,
    existingDealId: existingDeal.id,
  };

  const blocks: KnownBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `Meeting Follow-up: ${meetingTitle}`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Existing deal found: *${existingDeal.properties.dealname}* (Stage: ${existingDeal.properties.dealstage})`,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Contact:*\n${data.contactName}` },
        { type: "mrkdwn", text: `*Company:*\n${data.companyName}` },
        {
          type: "mrkdwn",
          text: `*Updated Stage:*\n${data.dealStage}`,
        },
        {
          type: "mrkdwn",
          text: `*Amount:*\n${data.dealAmount != null ? `$${data.dealAmount.toLocaleString()}` : "No change"}`,
        },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Meeting Notes:*\n${data.notes}`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Next Steps:*\n${data.nextSteps.map((s) => `- ${s}`).join("\n")}`,
      },
    },
    { type: "divider" },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Update Deal in HubSpot",
          },
          style: "primary",
          action_id: "update_deal",
          value: JSON.stringify(payload),
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Dismiss",
          },
          action_id: "dismiss",
        },
      ],
    },
  ];

  await slackApp.client.chat.postMessage({
    channel,
    text: `Deal update from meeting: ${meetingTitle}`,
    blocks,
  });
}

/**
 * Registers Slack interactive action handlers.
 */
export function registerSlackActions(): void {
  // Handle "Create Deal" button click
  slackApp.action("create_deal", async ({ action, ack, say }) => {
    await ack();

    if (action.type !== "button" || !action.value) return;

    const payload: SlackActionPayload = JSON.parse(action.value);

    try {
      // Create contact if email is available
      if (payload.extractedData.contactEmail) {
        const existingContact = await hubspot.findContact(
          payload.extractedData.contactEmail
        );
        if (!existingContact) {
          await hubspot.createContact(payload.extractedData);
        }
      }

      const dealId = await hubspot.createDeal(payload.extractedData);
      await say(
        `Deal *${payload.extractedData.dealName}* created successfully in HubSpot (ID: ${dealId}).`
      );
    } catch (error) {
      console.error("Error creating deal:", error);
      await say(
        `Failed to create deal in HubSpot. Please try manually. Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  });

  // Handle "Update Deal" button click
  slackApp.action("update_deal", async ({ action, ack, say }) => {
    await ack();

    if (action.type !== "button" || !action.value) return;

    const payload: SlackActionPayload = JSON.parse(action.value);

    if (!payload.existingDealId) {
      await say("Error: No existing deal ID found. Please update manually.");
      return;
    }

    try {
      await hubspot.updateDeal(payload.existingDealId, payload.extractedData);
      await say(
        `Deal *${payload.extractedData.dealName}* updated successfully in HubSpot.`
      );
    } catch (error) {
      console.error("Error updating deal:", error);
      await say(
        `Failed to update deal in HubSpot. Please try manually. Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  });

  // Handle "Dismiss" button click
  slackApp.action("dismiss", async ({ ack, say }) => {
    await ack();
    await say("Notification dismissed. No changes were made to HubSpot.");
  });
}
