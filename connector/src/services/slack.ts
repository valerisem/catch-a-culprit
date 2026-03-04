import { App, ExpressReceiver, type KnownBlock } from "@slack/bolt";
import type { View } from "@slack/types";
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

const DEAL_STAGES = [
  { text: "Appointment Scheduled", value: "appointmentscheduled" },
  { text: "Qualified to Buy", value: "qualifiedtobuy" },
  { text: "Presentation Scheduled", value: "presentationscheduled" },
  { text: "Decision Maker Bought In", value: "decisionmakerboughtin" },
  { text: "Contract Sent", value: "contractsent" },
  { text: "Closed Won", value: "closedwon" },
  { text: "Closed Lost", value: "closedlost" },
];

/**
 * Builds a Slack modal view with pre-filled editable fields for deal review.
 */
function buildReviewModal(
  payload: SlackActionPayload,
  meetingTitle: string
): View {
  const data = payload.extractedData;
  const isUpdate = payload.action === "update_deal";

  return {
    type: "modal",
    callback_id: "deal_review_modal",
    title: {
      type: "plain_text",
      text: isUpdate ? "Review & Update Deal" : "Review & Create Deal",
    },
    submit: {
      type: "plain_text",
      text: "Approve & Send to HubSpot",
    },
    close: {
      type: "plain_text",
      text: "Cancel",
    },
    private_metadata: JSON.stringify(payload),
    blocks: [
      {
        type: "header",
        block_id: "header",
        text: {
          type: "plain_text",
          text: `Meeting: ${meetingTitle}`,
        },
      },
      {
        type: "context",
        block_id: "context",
        elements: [
          {
            type: "mrkdwn",
            text: isUpdate
              ? `Updating existing deal (ID: ${payload.existingDealId}). Review the extracted data below — edit any fields if needed, then approve.`
              : "A new deal will be created in HubSpot. Review the extracted data below — edit any fields if needed, then approve.",
          },
        ],
      },
      { type: "divider" },
      {
        type: "input",
        block_id: "deal_name",
        label: { type: "plain_text", text: "Deal Name" },
        element: {
          type: "plain_text_input",
          action_id: "value",
          initial_value: data.dealName,
        },
      },
      {
        type: "input",
        block_id: "contact_name",
        label: { type: "plain_text", text: "Contact Name" },
        element: {
          type: "plain_text_input",
          action_id: "value",
          initial_value: data.contactName,
        },
      },
      {
        type: "input",
        block_id: "contact_email",
        label: { type: "plain_text", text: "Contact Email" },
        element: {
          type: "plain_text_input",
          action_id: "value",
          initial_value: data.contactEmail || "",
        },
        optional: true,
      },
      {
        type: "input",
        block_id: "company_name",
        label: { type: "plain_text", text: "Company Name" },
        element: {
          type: "plain_text_input",
          action_id: "value",
          initial_value: data.companyName,
        },
      },
      {
        type: "input",
        block_id: "deal_amount",
        label: { type: "plain_text", text: "Deal Amount ($)" },
        element: {
          type: "plain_text_input",
          action_id: "value",
          initial_value:
            data.dealAmount != null ? String(data.dealAmount) : "",
          placeholder: {
            type: "plain_text",
            text: "e.g. 50000",
          },
        },
        optional: true,
      },
      {
        type: "input",
        block_id: "deal_stage",
        label: { type: "plain_text", text: "Deal Stage" },
        element: {
          type: "static_select",
          action_id: "value",
          initial_option: DEAL_STAGES.find((s) => s.value === data.dealStage)
            ? {
                text: {
                  type: "plain_text",
                  text:
                    DEAL_STAGES.find((s) => s.value === data.dealStage)!
                      .text,
                },
                value: data.dealStage,
              }
            : {
                text: { type: "plain_text", text: "Appointment Scheduled" },
                value: "appointmentscheduled",
              },
          options: DEAL_STAGES.map((s) => ({
            text: { type: "plain_text", text: s.text },
            value: s.value,
          })),
        },
      },
      {
        type: "input",
        block_id: "next_steps",
        label: { type: "plain_text", text: "Next Steps (one per line)" },
        element: {
          type: "plain_text_input",
          action_id: "value",
          multiline: true,
          initial_value: data.nextSteps.join("\n"),
        },
        optional: true,
      },
      {
        type: "input",
        block_id: "pain_points",
        label: { type: "plain_text", text: "Pain Points (one per line)" },
        element: {
          type: "plain_text_input",
          action_id: "value",
          multiline: true,
          initial_value: data.painPoints.join("\n"),
        },
        optional: true,
      },
      {
        type: "input",
        block_id: "timeline",
        label: { type: "plain_text", text: "Timeline" },
        element: {
          type: "plain_text_input",
          action_id: "value",
          initial_value: data.timeline || "",
        },
        optional: true,
      },
      {
        type: "input",
        block_id: "notes",
        label: { type: "plain_text", text: "Meeting Notes / Summary" },
        element: {
          type: "plain_text_input",
          action_id: "value",
          multiline: true,
          initial_value: data.notes,
        },
        optional: true,
      },
    ],
  };
}

/**
 * Extracts deal data from modal submission values.
 */
function extractFromModal(
  values: Record<string, Record<string, any>>,
  original: ExtractedDealData
): ExtractedDealData {
  const amountStr = values.deal_amount?.value?.value || "";
  const parsedAmount = amountStr ? parseFloat(amountStr) : null;

  return {
    ...original,
    dealName: values.deal_name?.value?.value || original.dealName,
    contactName: values.contact_name?.value?.value || original.contactName,
    contactEmail: values.contact_email?.value?.value || "",
    companyName: values.company_name?.value?.value || original.companyName,
    dealAmount: parsedAmount != null && !isNaN(parsedAmount) ? parsedAmount : null,
    dealStage:
      values.deal_stage?.value?.selected_option?.value || original.dealStage,
    nextSteps: (values.next_steps?.value?.value || "")
      .split("\n")
      .map((s: string) => s.trim())
      .filter(Boolean),
    painPoints: (values.pain_points?.value?.value || "")
      .split("\n")
      .map((s: string) => s.trim())
      .filter(Boolean),
    timeline: values.timeline?.value?.value || "",
    notes: values.notes?.value?.value || "",
  };
}

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
          action_id: "review_deal",
          value: JSON.stringify({
            payload,
            meetingTitle,
          }),
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
          action_id: "review_deal",
          value: JSON.stringify({
            payload,
            meetingTitle,
          }),
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
  // Handle "Create Deal" / "Update Deal" button — opens review modal
  slackApp.action("review_deal", async ({ action, ack, body, client }) => {
    await ack();

    if (action.type !== "button" || !action.value) return;

    const { payload, meetingTitle } = JSON.parse(action.value) as {
      payload: SlackActionPayload;
      meetingTitle: string;
    };

    const modal = buildReviewModal(payload, meetingTitle);

    await client.views.open({
      trigger_id: (body as any).trigger_id,
      view: modal,
    });
  });

  // Handle modal submission — user approved (with or without edits)
  slackApp.view("deal_review_modal", async ({ ack, view, client, body }) => {
    const originalPayload: SlackActionPayload = JSON.parse(
      view.private_metadata
    );

    // Extract (potentially edited) data from modal fields
    const finalData = extractFromModal(
      view.state.values,
      originalPayload.extractedData
    );

    try {
      if (originalPayload.action === "create_deal") {
        // Create contact if email provided
        if (finalData.contactEmail) {
          const existingContact = await hubspot.findContact(
            finalData.contactEmail
          );
          if (!existingContact) {
            await hubspot.createContact(finalData);
          }
        }

        const dealId = await hubspot.createDeal(finalData);

        await ack();

        // Notify the user of success via DM
        await client.chat.postMessage({
          channel: body.user.id,
          text: `Deal *${finalData.dealName}* created successfully in HubSpot (ID: ${dealId}).`,
        });
      } else if (originalPayload.action === "update_deal") {
        if (!originalPayload.existingDealId) {
          await ack({
            response_action: "errors",
            errors: {
              deal_name:
                "No existing deal ID found. Please update manually.",
            },
          });
          return;
        }

        await hubspot.updateDeal(originalPayload.existingDealId, finalData);

        await ack();

        await client.chat.postMessage({
          channel: body.user.id,
          text: `Deal *${finalData.dealName}* updated successfully in HubSpot.`,
        });
      } else {
        await ack();
      }
    } catch (error) {
      console.error("Error processing deal:", error);

      await ack({
        response_action: "errors",
        errors: {
          deal_name: `Failed to save to HubSpot: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      });
    }
  });

  // Handle "Dismiss" button click
  slackApp.action("dismiss", async ({ ack, say }) => {
    await ack();
    await say("Notification dismissed. No changes were made to HubSpot.");
  });
}
