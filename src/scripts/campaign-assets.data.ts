import type { NewCampaignAsset, Campaign } from "../db/schema/index.js";

export const getCampaignAssetsSeedData = (insertedCampaigns: Campaign[]): NewCampaignAsset[] => {
  const [masjidCamp, gerejaCamp, puraCamp, viharaCamp, klentengCamp] = insertedCampaigns;

  const data: NewCampaignAsset[] = [];

  // Masjid Campaign
  if (masjidCamp) {
    data.push(
      {
        campaignId: masjidCamp.id,
        assetId: "aaaa1111-1111-4111-8111-111111111111",
        kind: "cover",
        sortOrder: 0,
        caption: "Cover Masjid Raya Al-Ikhlas",
      },
      {
        campaignId: masjidCamp.id,
        assetId: "bbbb1111-1111-4111-8111-111111111111",
        kind: "gallery",
        sortOrder: 1,
        caption: "Foto Masjid Sebelum Pemasangan Panel",
      },
      {
        campaignId: masjidCamp.id,
        assetId: "bbbb2222-2222-4222-8222-222222222222",
        kind: "gallery",
        sortOrder: 2,
        caption: "Sosialisasi Energi Bersih kepada Umat",
      },
      {
        campaignId: masjidCamp.id,
        assetId: "bbbb3333-3333-4333-8333-333333333333",
        kind: "report",
        sortOrder: 3,
        caption: "Dokumen Studi Kelayakan Panel Surya Masjid Al-Ikhlas",
      },
    );
  }

  // Gereja Campaign
  if (gerejaCamp) {
    data.push({
      campaignId: gerejaCamp.id,
      assetId: "aaaa2222-2222-4222-8222-222222222222",
      kind: "cover",
      sortOrder: 0,
      caption: "Cover Kampanye Gereja Santa Maria",
    });
  }

  // Pura Campaign
  if (puraCamp) {
    data.push({
      campaignId: puraCamp.id,
      assetId: "aaaa3333-3333-4333-8333-333333333333",
      kind: "cover",
      sortOrder: 0,
      caption: "Cover Kampanye Pura Agung Jagatnatha",
    });
  }

  // Vihara Campaign
  if (viharaCamp) {
    data.push({
      campaignId: viharaCamp.id,
      assetId: "aaaa4444-4444-4444-8444-444444444444",
      kind: "cover",
      sortOrder: 0,
      caption: "Cover Kampanye Vihara Dharma Bhakti",
    });
  }

  // Klenteng Campaign
  if (klentengCamp) {
    data.push({
      campaignId: klentengCamp.id,
      assetId: "aaaa5555-5555-4555-8555-555555555555",
      kind: "cover",
      sortOrder: 0,
      caption: "Cover Kampanye Klenteng Boen Tek Bio",
    });
  }

  return data;
};
