export const getDonationsSeedData = (insertedCampaigns: any[], donorId: string) => [
  {
    campaignId: insertedCampaigns[0].id,
    userId: donorId,
    donorName: "Rian Donor",
    donorEmail: "rian@gmail.com",
    amountIdr: 10000000,
    status: "SUCCESS",
    midtransOrderId: "SUNITY-DON-11111",
    isAnonymous: false,
    createdAt: new Date(),
  },
  {
    campaignId: insertedCampaigns[0].id,
    userId: null,
    donorName: "Hamba Allah",
    donorEmail: "anon@gmail.com",
    amountIdr: 5000000,
    status: "SUCCESS",
    midtransOrderId: "SUNITY-DON-22222",
    isAnonymous: true,
    createdAt: new Date(),
  },
];
