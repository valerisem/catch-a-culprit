import { Client } from "@hubspot/api-client";
import { config } from "../config";
import type {
  ExtractedDealData,
  HubSpotDeal,
  HubSpotContact,
} from "../types";

const hubspotClient = new Client({ accessToken: config.hubspot.accessToken });

/**
 * Searches HubSpot for a contact by email.
 */
export async function findContact(
  email: string
): Promise<HubSpotContact | null> {
  if (!email) return null;

  try {
    const response = await hubspotClient.crm.contacts.searchApi.doSearch({
      filterGroups: [
        {
          filters: [
            {
              propertyName: "email",
              operator: "EQ",
              value: email,
            },
          ],
        },
      ],
      properties: ["email", "firstname", "lastname", "company"],
      limit: 1,
      sorts: [],
      after: "0",
      query: "",
    });

    if (response.total > 0) {
      const result = response.results[0];
      return {
        id: result.id,
        properties: result.properties as HubSpotContact["properties"],
      };
    }
    return null;
  } catch {
    console.error("Error searching HubSpot contacts");
    return null;
  }
}

/**
 * Searches HubSpot for existing deals by company name.
 */
export async function findDealsByCompany(
  companyName: string
): Promise<HubSpotDeal[]> {
  if (!companyName) return [];

  try {
    const response = await hubspotClient.crm.deals.searchApi.doSearch({
      filterGroups: [
        {
          filters: [
            {
              propertyName: "dealname",
              operator: "CONTAINS_TOKEN",
              value: companyName,
            },
          ],
        },
      ],
      properties: ["dealname", "amount", "dealstage", "pipeline", "closedate"],
      limit: 5,
      sorts: [{ propertyName: "createdate", direction: "DESCENDING" }],
      after: "0",
      query: "",
    });

    return response.results.map((r) => ({
      id: r.id,
      properties: r.properties as HubSpotDeal["properties"],
    }));
  } catch {
    console.error("Error searching HubSpot deals");
    return [];
  }
}

/**
 * Creates a new deal in HubSpot with the extracted data.
 */
export async function createDeal(data: ExtractedDealData): Promise<string> {
  const notesContent = [
    data.notes,
    "",
    `Pain Points: ${data.painPoints.join(", ")}`,
    `Next Steps: ${data.nextSteps.join(", ")}`,
    `Timeline: ${data.timeline}`,
  ].join("\n");

  const response = await hubspotClient.crm.deals.basicApi.create({
    properties: {
      dealname: data.dealName,
      dealstage: data.dealStage,
      ...(data.dealAmount != null && { amount: String(data.dealAmount) }),
      description: notesContent,
    },
    associations: [],
  });

  return response.id;
}

/**
 * Updates an existing deal in HubSpot with new data from the meeting.
 */
export async function updateDeal(
  dealId: string,
  data: ExtractedDealData
): Promise<void> {
  const notesContent = [
    `[Meeting Update] ${data.notes}`,
    "",
    `Pain Points: ${data.painPoints.join(", ")}`,
    `Next Steps: ${data.nextSteps.join(", ")}`,
    `Timeline: ${data.timeline}`,
  ].join("\n");

  const properties: Record<string, string> = {
    dealstage: data.dealStage,
    description: notesContent,
  };

  if (data.dealAmount != null) {
    properties.amount = String(data.dealAmount);
  }

  await hubspotClient.crm.deals.basicApi.update(dealId, { properties });
}

/**
 * Creates a new contact in HubSpot.
 */
export async function createContact(
  data: ExtractedDealData
): Promise<string> {
  const nameParts = data.contactName.split(" ");
  const firstname = nameParts[0] || "";
  const lastname = nameParts.slice(1).join(" ") || "";

  const response = await hubspotClient.crm.contacts.basicApi.create({
    properties: {
      firstname,
      lastname,
      ...(data.contactEmail && { email: data.contactEmail }),
      company: data.companyName,
    },
    associations: [],
  });

  return response.id;
}
