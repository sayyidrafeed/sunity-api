import type { NewExpense, Campaign } from "../db/schema/index.js";

export const getExpensesSeedData = (insertedCampaigns: Campaign[]): NewExpense[] => {
  const [, , puraCamp, viharaCamp, klentengCamp] = insertedCampaigns;

  const data: NewExpense[] = [];

  // Pura Campaign (Status: INSTALASI)
  if (puraCamp) {
    data.push({
      campaignId: puraCamp.id,
      title: "Pembelian Inverter & Solar Panel 6kWp",
      description: "Pembelian modul solar panel tier 1 dan grid-tie inverter 6kW.",
      amountIdr: 42000000,
      spentAt: new Date("2026-05-10T10:00:00Z"),
      receiptAssetId: "cccc1111-1111-4111-8111-111111111111",
      category: "EQUIPMENT",
    });
  }

  // Vihara Campaign (Status: SELESAI)
  if (viharaCamp) {
    data.push(
      {
        campaignId: viharaCamp.id,
        title: "Pembelian Inverter & Solar Panel 4.5kWp",
        description: "Pengadaan 10 modul solar panel dan inverter pendukung.",
        amountIdr: 30000000,
        spentAt: new Date("2025-12-05T09:00:00Z"),
        receiptAssetId: "cccc2222-2222-4222-8222-222222222222",
        category: "EQUIPMENT",
      },
      {
        campaignId: viharaCamp.id,
        title: "Kabel Listrik & Konektor MC4",
        description: "Pembelian kabel solar standar outdoor dan konektor anti air.",
        amountIdr: 3000000,
        spentAt: new Date("2025-12-08T14:30:00Z"),
        receiptAssetId: null,
        category: "MATERIAL",
      },
      {
        campaignId: viharaCamp.id,
        title: "Jasa Instalasi & Setup Panel Surya",
        description:
          "Biaya pemasangan struktur atap dan integrasi kelistrikan oleh teknisi berlisensi.",
        amountIdr: 8000000,
        spentAt: new Date("2025-12-15T16:00:00Z"),
        receiptAssetId: "cccc3333-3333-4333-8333-333333333333",
        category: "INSTALLATION",
      },
    );
  }

  // Klenteng Campaign (Status: ARCHIVED)
  if (klentengCamp) {
    data.push(
      {
        campaignId: klentengCamp.id,
        title: "Pengadaan Panel & Inverter Cagar Budaya",
        description: "Panel surya dengan spesifikasi ringan agar aman untuk cagar budaya klenteng.",
        amountIdr: 55000000,
        spentAt: new Date("2025-10-01T11:00:00Z"),
        receiptAssetId: null,
        category: "EQUIPMENT",
      },
      {
        campaignId: klentengCamp.id,
        title: "Jasa Pemasangan Struktur Penyangga Atap Khusus",
        description: "Pekerjaan struktur sipil ringan tanpa melubangi genteng kuno klenteng.",
        amountIdr: 20000000,
        spentAt: new Date("2025-10-10T15:00:00Z"),
        receiptAssetId: null,
        category: "INSTALLATION",
      },
    );
  }

  return data;
};
