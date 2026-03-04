import express from "express";
import { config } from "./config";
import { firefliesRouter } from "./routes/fireflies";
import {
  slackApp,
  slackReceiver,
  registerSlackActions,
} from "./services/slack";

async function main() {
  const app = express();

  // Parse JSON bodies for webhooks
  app.use(express.json());

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Fireflies webhook route
  app.use("/api/webhooks/fireflies", firefliesRouter);

  // Register Slack interactive action handlers
  registerSlackActions();

  // Mount Slack Bolt's ExpressReceiver router for interactivity
  // Handles button clicks, slash commands, and events from Slack
  app.use("/api/slack", slackReceiver.router);

  app.listen(config.port, () => {
    console.log(
      `Fireflies-Slack-HubSpot Connector running on port ${config.port}`
    );
    console.log(`  Fireflies webhook: POST /api/webhooks/fireflies/webhook`);
    console.log(`  Slack interactivity: POST /api/slack/events`);
    console.log(`  Health check:        GET  /health`);
  });
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
