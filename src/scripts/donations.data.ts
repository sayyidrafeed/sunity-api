import type { NewDonation } from "../db/schema/index.js";
import type { Campaign } from "../db/schema/index.js";

export const getDonationsSeedData = (
  insertedCampaigns: Campaign[],
  _donorId: string,
): NewDonation[] => [
  {
    campaignId: insertedCampaigns[0].id,
    donorName: "Rian Donor",
    donorEmail: "rian@gmail.com",
    amountIdr: 10000000,
    status: "SUCCESS",
    midtransOrderId: "SUNITY-DON-11111",
    isAnonymous: false,
  },
  {
    campaignId: insertedCampaigns[0].id,
    donorName: "Hamba Allah",
    donorEmail: "anon@gmail.com",
    amountIdr: 5000000,
    status: "SUCCESS",
    midtransOrderId: "SUNITY-DON-22222",
    isAnonymous: true,
  },
];
