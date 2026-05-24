import type { NewActivityLog, Campaign } from "../db/schema/index.js";

export const getActivityLogsSeedData = (
  insertedCampaigns: Campaign[],
  adminUserId: string,
): NewActivityLog[] => {
  const [masjidCamp, gerejaCamp, puraCamp, viharaCamp] = insertedCampaigns;

  const data: NewActivityLog[] = [];

  // Admin Sunity Actor ID
  const actorId = adminUserId;

  // Masjid Campaign
  if (masjidCamp) {
    data.push(
      {
        campaignId: masjidCamp.id,
        actorId,
        action: "CREATE",
        entityType: "CAMPAIGN",
        entityId: masjidCamp.id,
        metadata: { title: masjidCamp.title },
        createdAt: new Date("2026-04-20T08:00:00Z"),
      },
      {
        campaignId: masjidCamp.id,
        actorId,
        action: "PUBLISH",
        entityType: "CAMPAIGN",
        entityId: masjidCamp.id,
        metadata: { isPublished: true },
        createdAt: new Date("2026-04-21T09:00:00Z"),
      },
    );
  }

  // Gereja Campaign (Draft)
  if (gerejaCamp) {
    data.push({
      campaignId: gerejaCamp.id,
      actorId,
      action: "CREATE",
      entityType: "CAMPAIGN",
      entityId: gerejaCamp.id,
      metadata: { title: gerejaCamp.title },
      createdAt: new Date("2026-05-10T14:00:00Z"),
    });
  }

  // Pura Campaign (INSTALASI)
  if (puraCamp) {
    data.push(
      {
        campaignId: puraCamp.id,
        actorId,
        action: "CREATE",
        entityType: "CAMPAIGN",
        entityId: puraCamp.id,
        metadata: { title: puraCamp.title },
        createdAt: new Date("2026-03-01T10:00:00Z"),
      },
      {
        campaignId: puraCamp.id,
        actorId,
        action: "PUBLISH",
        entityType: "CAMPAIGN",
        entityId: puraCamp.id,
        metadata: { isPublished: true },
        createdAt: new Date("2026-03-02T11:00:00Z"),
      },
      {
        campaignId: puraCamp.id,
        actorId,
        action: "UPDATE_STATUS",
        entityType: "CAMPAIGN",
        entityId: puraCamp.id,
        metadata: { from: "AKTIF", to: "INSTALASI" },
        createdAt: new Date("2026-05-01T10:00:00Z"),
      },
      {
        campaignId: puraCamp.id,
        actorId,
        action: "ADD_EXPENSE",
        entityType: "EXPENSE",
        metadata: { title: "Pembelian Inverter & Solar Panel 6kWp", amountIdr: 42000000 },
        createdAt: new Date("2026-05-10T10:05:00Z"),
      },
    );
  }

  // Vihara Campaign (SELESAI)
  if (viharaCamp) {
    data.push(
      {
        campaignId: viharaCamp.id,
        actorId,
        action: "CREATE",
        entityType: "CAMPAIGN",
        entityId: viharaCamp.id,
        metadata: { title: viharaCamp.title },
        createdAt: new Date("2025-09-01T09:00:00Z"),
      },
      {
        campaignId: viharaCamp.id,
        actorId,
        action: "PUBLISH",
        entityType: "CAMPAIGN",
        entityId: viharaCamp.id,
        metadata: { isPublished: true },
        createdAt: new Date("2025-09-02T09:00:00Z"),
      },
      {
        campaignId: viharaCamp.id,
        actorId,
        action: "UPDATE_STATUS",
        entityType: "CAMPAIGN",
        entityId: viharaCamp.id,
        metadata: { from: "AKTIF", to: "INSTALASI" },
        createdAt: new Date("2025-11-20T10:00:00Z"),
      },
      {
        campaignId: viharaCamp.id,
        actorId,
        action: "ADD_EXPENSE",
        entityType: "EXPENSE",
        metadata: { title: "Jasa Instalasi & Setup Panel Surya", amountIdr: 8000000 },
        createdAt: new Date("2025-12-15T16:05:00Z"),
      },
      {
        campaignId: viharaCamp.id,
        actorId,
        action: "UPDATE_STATUS",
        entityType: "CAMPAIGN",
        entityId: viharaCamp.id,
        metadata: { from: "INSTALASI", to: "SELESAI" },
        createdAt: new Date("2026-01-15T10:00:00Z"),
      },
    );
  }

  return data;
};
