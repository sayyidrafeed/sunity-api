import type { NewDonation, Campaign } from "../db/schema/index.js";

export const getDonationsSeedData = (
  insertedCampaigns: Campaign[],
  _donorId?: string,
): NewDonation[] => {
  const [masjidCamp, gerejaCamp, puraCamp, viharaCamp, klentengCamp] = insertedCampaigns;

  const data: NewDonation[] = [];

  // Masjid Campaign (Status: AKTIF)
  if (masjidCamp) {
    data.push(
      {
        campaignId: masjidCamp.id,
        donorName: "Rian Donor",
        donorEmail: "rian@gmail.com",
        amountIdr: 10000000,
        status: "SUCCESS",
        midtransOrderId: "SUNITY-DON-MSJ-01",
        isAnonymous: false,
        createdAt: new Date("2026-05-01T08:00:00Z"),
      },
      {
        campaignId: masjidCamp.id,
        donorName: "Hamba Allah",
        donorEmail: "anon-masjid@gmail.com",
        amountIdr: 5000000,
        status: "SUCCESS",
        midtransOrderId: "SUNITY-DON-MSJ-02",
        isAnonymous: true,
        createdAt: new Date("2026-05-02T10:15:00Z"),
      },
      {
        campaignId: masjidCamp.id,
        donorName: "Budi Pratama",
        donorEmail: "budi@gmail.com",
        amountIdr: 2500000,
        status: "PENDING",
        midtransOrderId: "SUNITY-DON-MSJ-03",
        isAnonymous: false,
        createdAt: new Date("2026-05-24T12:00:00Z"),
      },
    );
  }

  // Gereja Campaign (Status: DRAFT)
  if (gerejaCamp) {
    data.push(
      {
        campaignId: gerejaCamp.id,
        donorName: "Ani Wijaya",
        donorEmail: "ani@gmail.com",
        amountIdr: 5000000,
        status: "PENDING",
        midtransOrderId: "SUNITY-DON-GRJ-01",
        isAnonymous: false,
        createdAt: new Date("2026-05-24T13:30:00Z"),
      },
      {
        campaignId: gerejaCamp.id,
        donorName: "Melati Lestari",
        donorEmail: "melati@gmail.com",
        amountIdr: 10000000,
        status: "FAILED",
        midtransOrderId: "SUNITY-DON-GRJ-02",
        isAnonymous: false,
        createdAt: new Date("2026-05-23T11:00:00Z"),
      },
    );
  }

  // Pura Campaign (Status: INSTALASI)
  if (puraCamp) {
    data.push(
      {
        campaignId: puraCamp.id,
        donorName: "Budi Pratama",
        donorEmail: "budi@gmail.com",
        amountIdr: 15000000,
        status: "SUCCESS",
        midtransOrderId: "SUNITY-DON-PUR-01",
        isAnonymous: false,
        createdAt: new Date("2026-04-10T09:00:00Z"),
      },
      {
        campaignId: puraCamp.id,
        donorName: "Ani Wijaya",
        donorEmail: "ani@gmail.com",
        amountIdr: 20000000,
        status: "SUCCESS",
        midtransOrderId: "SUNITY-DON-PUR-02",
        isAnonymous: false,
        createdAt: new Date("2026-04-12T14:20:00Z"),
      },
      {
        campaignId: puraCamp.id,
        donorName: "Yusuf Ibrahim",
        donorEmail: "yusuf@gmail.com",
        amountIdr: 15000000,
        status: "SUCCESS",
        midtransOrderId: "SUNITY-DON-PUR-03",
        isAnonymous: false,
        createdAt: new Date("2026-04-15T11:45:00Z"),
      },
      {
        campaignId: puraCamp.id,
        donorName: "Melati Lestari",
        donorEmail: "melati@gmail.com",
        amountIdr: 10000000,
        status: "SUCCESS",
        midtransOrderId: "SUNITY-DON-PUR-04",
        isAnonymous: false,
        createdAt: new Date("2026-04-18T16:10:00Z"),
      },
    );
  }

  // Vihara Campaign (Status: SELESAI)
  if (viharaCamp) {
    data.push(
      {
        campaignId: viharaCamp.id,
        donorName: "Budi Pratama",
        donorEmail: "budi@gmail.com",
        amountIdr: 15000000,
        status: "SUCCESS",
        midtransOrderId: "SUNITY-DON-VIH-01",
        isAnonymous: false,
        createdAt: new Date("2025-11-01T08:30:00Z"),
      },
      {
        campaignId: viharaCamp.id,
        donorName: "Rian Donor",
        donorEmail: "rian@gmail.com",
        amountIdr: 20000000,
        status: "SUCCESS",
        midtransOrderId: "SUNITY-DON-VIH-02",
        isAnonymous: false,
        createdAt: new Date("2025-11-02T13:10:00Z"),
      },
      {
        campaignId: viharaCamp.id,
        donorName: "Umat Vihara",
        donorEmail: "anon-vihara@gmail.com",
        amountIdr: 10000000,
        status: "SUCCESS",
        midtransOrderId: "SUNITY-DON-VIH-03",
        isAnonymous: true,
        createdAt: new Date("2025-11-05T15:00:00Z"),
      },
    );
  }

  // Klenteng Campaign (Status: ARCHIVED)
  if (klentengCamp) {
    data.push(
      {
        campaignId: klentengCamp.id,
        donorName: "Yusuf Ibrahim",
        donorEmail: "yusuf@gmail.com",
        amountIdr: 30000000,
        status: "SUCCESS",
        midtransOrderId: "SUNITY-DON-KLT-01",
        isAnonymous: false,
        createdAt: new Date("2025-09-10T09:00:00Z"),
      },
      {
        campaignId: klentengCamp.id,
        donorName: "Ani Wijaya",
        donorEmail: "ani@gmail.com",
        amountIdr: 30000000,
        status: "SUCCESS",
        midtransOrderId: "SUNITY-DON-KLT-02",
        isAnonymous: false,
        createdAt: new Date("2025-09-12T10:30:00Z"),
      },
      {
        campaignId: klentengCamp.id,
        donorName: "Donatur Setia",
        donorEmail: "anon-klt@gmail.com",
        amountIdr: 20000000,
        status: "SUCCESS",
        midtransOrderId: "SUNITY-DON-KLT-03",
        isAnonymous: true,
        createdAt: new Date("2025-09-15T14:00:00Z"),
      },
    );
  }

  return data;
};
