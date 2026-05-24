import type { NewEnergyData, Campaign } from "../db/schema/index.js";

export const getEnergySeedData = (insertedCampaigns: Campaign[]): NewEnergyData[] => {
  const [, , , viharaCamp, klentengCamp] = insertedCampaigns;

  const data: NewEnergyData[] = [];

  // Vihara Campaign (Status: SELESAI)
  if (viharaCamp) {
    data.push(
      {
        campaignId: viharaCamp.id,
        month: "2026-01",
        kwhProduced: 450,
        idrSaved: 750000,
        kgCo2Reduced: 380,
      },
      {
        campaignId: viharaCamp.id,
        month: "2026-02",
        kwhProduced: 480,
        idrSaved: 800000,
        kgCo2Reduced: 410,
      },
      {
        campaignId: viharaCamp.id,
        month: "2026-03",
        kwhProduced: 470,
        idrSaved: 785000,
        kgCo2Reduced: 400,
      },
      {
        campaignId: viharaCamp.id,
        month: "2026-04",
        kwhProduced: 490,
        idrSaved: 820000,
        kgCo2Reduced: 420,
      },
      {
        campaignId: viharaCamp.id,
        month: "2026-05",
        kwhProduced: 500,
        idrSaved: 835000,
        kgCo2Reduced: 430,
      },
    );
  }

  // Klenteng Campaign (Status: ARCHIVED)
  if (klentengCamp) {
    data.push(
      {
        campaignId: klentengCamp.id,
        month: "2025-12",
        kwhProduced: 880,
        idrSaved: 1500000,
        kgCo2Reduced: 750,
      },
      {
        campaignId: klentengCamp.id,
        month: "2026-01",
        kwhProduced: 900,
        idrSaved: 1550000,
        kgCo2Reduced: 770,
      },
      {
        campaignId: klentengCamp.id,
        month: "2026-02",
        kwhProduced: 920,
        idrSaved: 1600000,
        kgCo2Reduced: 790,
      },
      {
        campaignId: klentengCamp.id,
        month: "2026-03",
        kwhProduced: 910,
        idrSaved: 1580000,
        kgCo2Reduced: 780,
      },
      {
        campaignId: klentengCamp.id,
        month: "2026-04",
        kwhProduced: 930,
        idrSaved: 1620000,
        kgCo2Reduced: 800,
      },
    );
  }

  return data;
};
