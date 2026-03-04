import { Router, type Request, type Response } from "express";
import { config } from "../config";
import { fetchTranscript, formatTranscript } from "../services/fireflies";
import { extractDealData } from "../services/extraction";
import * as hubspot from "../services/hubspot";
import * as slack from "../services/slack";
import type { FirefliesWebhookPayload } from "../types";

export const firefliesRouter = Router();

firefliesRouter.post(
  "/webhook",
  async (req: Request, res: Response): Promise<void> => {
    const payload = req.body as FirefliesWebhookPayload;

    // Verify webhook secret if configured
    if (config.fireflies.webhookSecret) {
      const signature = req.headers["x-webhook-secret"];
      if (signature !== config.fireflies.webhookSecret) {
        res.status(401).json({ error: "Invalid webhook signature" });
        return;
      }
    }

    if (!payload.meetingId) {
      res.status(400).json({ error: "Missing meetingId" });
      return;
    }

    // Respond immediately — process async
    res.status(200).json({ received: true });

    try {
      console.log(`Processing meeting: ${payload.meetingId}`);

      // 1. Fetch full transcript from Fireflies
      const transcript = await fetchTranscript(payload.meetingId);
      const formattedText = formatTranscript(transcript);

      console.log(`Transcript fetched: "${transcript.title}"`);

      // 2. Extract deal data using Claude API
      const dealData = await extractDealData(formattedText);
      console.log(
        `Extracted deal: "${dealData.dealName}" for ${dealData.companyName}`
      );

      // 3. Search HubSpot for existing deals
      const existingDeals = await hubspot.findDealsByCompany(
        dealData.companyName
      );

      // 4. Determine target Slack channel
      const channel =
        config.slack.defaultChannel || transcript.organizer_email;

      // 5. Send appropriate Slack message
      if (existingDeals.length > 0 && !dealData.isNewDeal) {
        // Existing deal — propose update
        const bestMatch = existingDeals[0];
        console.log(
          `Found existing deal: "${bestMatch.properties.dealname}" — sending update proposal`
        );

        await slack.sendUpdateDealMessage(
          channel,
          payload.meetingId,
          transcript.title,
          dealData,
          bestMatch
        );
      } else {
        // New deal — propose creation
        console.log("No existing deal found — sending creation proposal");

        await slack.sendNewDealMessage(
          channel,
          payload.meetingId,
          transcript.title,
          dealData
        );
      }

      console.log(`Slack message sent for meeting: ${payload.meetingId}`);
    } catch (error) {
      console.error(
        `Error processing meeting ${payload.meetingId}:`,
        error
      );
    }
  }
);
