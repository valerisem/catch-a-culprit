import { App, type KnownBlock } from "@slack/bolt";
import type { View } from "@slack/types";

/**
 * DEMO SCRIPT — Sends a mock Slack message to preview the connector UX.
 *
 * Setup:
 *   1. Create a Slack app at https://api.slack.com/apps
 *   2. Add bot scopes: chat:write
 *   3. Install to workspace
 *   4. Enable Interactivity (URL: https://YOUR_NGROK/slack/events)
 *
 * Usage:
 *   SLACK_BOT_TOKEN=xoxb-... SLACK_SIGNING_SECRET=... SLACK_CHANNEL=C0... npx tsx src/demo.ts
 */

const BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
const CHANNEL = process.env.SLACK_CHANNEL;

if (!BOT_TOKEN || !SIGNING_SECRET || !CHANNEL) {
  console.error(
    "\nUsage:\n  SLACK_BOT_TOKEN=xoxb-... SLACK_SIGNING_SECRET=... SLACK_CHANNEL=C0... npx tsx src/demo.ts\n"
  );
  process.exit(1);
}

// ── Mock data (realistic sales call) ──────────────────────────────

const MOCK_DATA = {
  contactName: "Sarah Chen",
  contactEmail: "sarah.chen@novatech.io",
  companyName: "NovaTech Solutions",
  dealName: "NovaTech Solutions — Enterprise Platform License",
  dealAmount: 84000,
  dealStage: "qualifiedtobuy",
  nextSteps: [
    "Send proposal with Enterprise tier pricing by Friday",
    "Schedule technical demo with their CTO (Mark Rivera)",
    "Share case study from FinServ client",
  ],
  painPoints: [
    "Current tool doesn't scale past 500 users",
    "No API access — manual data exports taking 10+ hrs/week",
    "Contract with current vendor expires in 6 weeks",
  ],
  timeline: "Decision by end of March — current contract expires April 15",
  notes:
    "Sarah is the VP of Operations. Team of 1,200 users across 3 offices. Already evaluated two competitors but concerned about migration complexity. Budget approved for Q1. Strong buy signal — asked about onboarding timeline.",
  isNewDeal: true,
};

const DEAL_STAGES = [
  { text: "Appointment Scheduled", value: "appointmentscheduled" },
  { text: "Qualified to Buy", value: "qualifiedtobuy" },
  { text: "Presentation Scheduled", value: "presentationscheduled" },
  { text: "Decision Maker Bought In", value: "decisionmakerboughtin" },
  { text: "Contract Sent", value: "contractsent" },
  { text: "Closed Won", value: "closedwon" },
  { text: "Closed Lost", value: "closedlost" },
];

// ── Slack app ─────────────────────────────────────────────────────

const app = new App({
  token: BOT_TOKEN,
  signingSecret: SIGNING_SECRET,
});

// ── Send the initial message ──────────────────────────────────────

async function sendMockMessage() {
  const blocks: KnownBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "📞 New Sales Meeting: Discovery Call — NovaTech Solutions",
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "🤖 Extracted automatically from Fireflies transcript via Claude AI",
        },
      ],
    },
    { type: "divider" },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*👤 Contact:*\n${MOCK_DATA.contactName}` },
        { type: "mrkdwn", text: `*🏢 Company:*\n${MOCK_DATA.companyName}` },
        { type: "mrkdwn", text: `*💼 Deal:*\n${MOCK_DATA.dealName}` },
        {
          type: "mrkdwn",
          text: `*💰 Amount:*\n$${MOCK_DATA.dealAmount.toLocaleString()}`,
        },
      ],
    },
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*📝 Summary:*\n${MOCK_DATA.notes}`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*✅ Next Steps:*\n${MOCK_DATA.nextSteps.map((s) => `• ${s}`).join("\n")}`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*⚠️ Pain Points:*\n${MOCK_DATA.painPoints.map((p) => `• ${p}`).join("\n")}`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*⏰ Timeline:*\n${MOCK_DATA.timeline}`,
      },
    },
    { type: "divider" },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "✅ Create Deal in HubSpot" },
          style: "primary",
          action_id: "demo_review_deal",
          value: "create",
        },
        {
          type: "button",
          text: { type: "plain_text", text: "❌ Dismiss" },
          action_id: "demo_dismiss",
        },
      ],
    },
  ];

  await app.client.chat.postMessage({
    channel: CHANNEL!,
    text: "New deal opportunity: NovaTech Solutions — Enterprise Platform License",
    blocks,
  });

  console.log(`\n✅ Mock message sent to channel ${CHANNEL}\n`);
}

// ── Handle button clicks ──────────────────────────────────────────

// "Create Deal" button → opens review modal
app.action("demo_review_deal", async ({ ack, body, client }) => {
  await ack();

  const modal: View = {
    type: "modal",
    callback_id: "demo_modal_submit",
    title: { type: "plain_text", text: "Review & Create Deal" },
    submit: { type: "plain_text", text: "Approve & Send to HubSpot" },
    close: { type: "plain_text", text: "Cancel" },
    blocks: [
      {
        type: "context",
        block_id: "info",
        elements: [
          {
            type: "mrkdwn",
            text: "Review the data extracted from your meeting. Edit any field if needed, then approve to push to HubSpot.",
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
          initial_value: MOCK_DATA.dealName,
        },
      },
      {
        type: "input",
        block_id: "contact_name",
        label: { type: "plain_text", text: "Contact Name" },
        element: {
          type: "plain_text_input",
          action_id: "value",
          initial_value: MOCK_DATA.contactName,
        },
      },
      {
        type: "input",
        block_id: "contact_email",
        label: { type: "plain_text", text: "Contact Email" },
        element: {
          type: "plain_text_input",
          action_id: "value",
          initial_value: MOCK_DATA.contactEmail,
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
          initial_value: MOCK_DATA.companyName,
        },
      },
      {
        type: "input",
        block_id: "deal_amount",
        label: { type: "plain_text", text: "Deal Amount ($)" },
        element: {
          type: "plain_text_input",
          action_id: "value",
          initial_value: String(MOCK_DATA.dealAmount),
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
          initial_option: {
            text: { type: "plain_text", text: "Qualified to Buy" },
            value: "qualifiedtobuy",
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
          initial_value: MOCK_DATA.nextSteps.join("\n"),
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
          initial_value: MOCK_DATA.painPoints.join("\n"),
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
          initial_value: MOCK_DATA.timeline,
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
          initial_value: MOCK_DATA.notes,
        },
        optional: true,
      },
    ],
  };

  await client.views.open({
    trigger_id: (body as any).trigger_id,
    view: modal,
  });
});

// Modal submit → simulate success
app.view("demo_modal_submit", async ({ ack, body, client }) => {
  await ack();

  await client.chat.postMessage({
    channel: body.user.id,
    text: `✅ *Demo:* Deal "NovaTech Solutions — Enterprise Platform License" would be created in HubSpot.\n\n_This is a demo — no data was actually sent to HubSpot._`,
  });
});

// Dismiss button
app.action("demo_dismiss", async ({ ack, say }) => {
  await ack();
  await say("Notification dismissed. No changes were made.");
});

// ── Start ─────────────────────────────────────────────────────────

(async () => {
  const port = parseInt(process.env.PORT || "3000", 10);
  await app.start(port);
  console.log(`\n🚀 Demo server running on port ${port}`);
  console.log(`   Slack interactivity URL: https://YOUR_NGROK/slack/events\n`);

  await sendMockMessage();

  console.log(
    "Server is running — waiting for button clicks from Slack...\n" +
      "Press Ctrl+C to stop.\n"
  );
})();
