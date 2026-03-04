/** Raw webhook payload from Fireflies */
export interface FirefliesWebhookPayload {
  meetingId: string;
  eventType: string;
  clientReferenceId?: string;
}

/** Fireflies transcript returned by GraphQL API */
export interface FirefliesTranscript {
  id: string;
  title: string;
  date: string;
  duration: number;
  organizer_email: string;
  participants: string[];
  sentences: FirefliesSentence[];
  summary: {
    action_items: string;
    overview: string;
    shorthand_bullet: string;
  };
}

export interface FirefliesSentence {
  text: string;
  speaker_name: string;
  start_time: number;
  end_time: number;
}

/** Data extracted from transcript by Claude API */
export interface ExtractedDealData {
  contactName: string;
  contactEmail: string;
  companyName: string;
  dealName: string;
  dealAmount: number | null;
  dealStage: string;
  nextSteps: string[];
  painPoints: string[];
  timeline: string;
  notes: string;
  isNewDeal: boolean;
}

/** HubSpot deal search result */
export interface HubSpotDeal {
  id: string;
  properties: {
    dealname: string;
    amount: string;
    dealstage: string;
    pipeline: string;
    closedate: string;
    [key: string]: string;
  };
}

/** HubSpot contact search result */
export interface HubSpotContact {
  id: string;
  properties: {
    email: string;
    firstname: string;
    lastname: string;
    company: string;
    [key: string]: string;
  };
}

/** Payload attached to Slack interactive button actions */
export interface SlackActionPayload {
  meetingId: string;
  action: "create_deal" | "update_deal";
  extractedData: ExtractedDealData;
  existingDealId?: string;
}
