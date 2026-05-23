import { describe, expect, test } from "bun:test";
import {
  EnergyRecordConflictError,
  EnergyRecordNotFoundError,
  bulkUploadEnergyRecords,
} from "../energy.service.js";
import { campaigns, energyData } from "../../../db/schema/index.js";
import { NotFoundError, ConflictError } from "../../../lib/errors.js";

function createMockDbForEnergy(fixtures: {
  campaign: any;
  existingRecords: any[];
  insertedRecords: any[];
}) {
  return {
    select: (_fields?: any) => {
      return {
        from: (table: any) => {
          return {
            where: () => {
              if (table === campaigns) {
                return Promise.resolve(fixtures.campaign ? [fixtures.campaign] : []);
              }
              if (table === energyData) {
                return Promise.resolve(fixtures.existingRecords);
              }
              return Promise.resolve([]);
            },
          };
        },
      };
    },
    insert: (_table: any) => {
      return {
        values: (_values: any) => {
          return {
            onConflictDoUpdate: (_config: any) => {
              return {
                returning: () => Promise.resolve(fixtures.insertedRecords),
              };
            },
          };
        },
      };
    },
  } as any;
}

describe("energy.service", () => {
  test("not found error includes code", () => {
    const error = new EnergyRecordNotFoundError("2024-05");
    expect(error.errorCode).toBe("ENERGY_RECORD_NOT_FOUND");
  });

  test("conflict error has correct code, message, and stores month", () => {
    const error = new EnergyRecordConflictError("2024-05");
    expect(error.errorCode).toBe("ENERGY_RECORD_CONFLICT");
    expect(error.month).toBe("2024-05");
    expect(error.message.includes("already exists")).toBeTruthy();
  });

  describe("bulkUploadEnergyRecords", () => {
    const campaignId = "6a2f3b4c-9f8e-4d7a-ba92-938f38c82301";

    test("throws NotFoundError when campaign does not exist", async () => {
      const mockDb = createMockDbForEnergy({
        campaign: null,
        existingRecords: [],
        insertedRecords: [],
      });

      let error: any;
      try {
        await bulkUploadEnergyRecords(
          campaignId,
          [{ month: "2026-05", kwhProduced: 10, idrSaved: 100, kgCo2Reduced: 5 }],
          mockDb,
        );
      } catch (e) {
        error = e;
      }

      expect(error instanceof NotFoundError).toBe(true);
      expect(error.errorCode).toBe("CAMPAIGN_NOT_FOUND");
    });

    test("throws ConflictError when campaign is not completed", async () => {
      const mockDb = createMockDbForEnergy({
        campaign: { id: campaignId, status: "AKTIF" },
        existingRecords: [],
        insertedRecords: [],
      });

      let error: any;
      try {
        await bulkUploadEnergyRecords(
          campaignId,
          [{ month: "2026-05", kwhProduced: 10, idrSaved: 100, kgCo2Reduced: 5 }],
          mockDb,
        );
      } catch (e) {
        error = e;
      }

      expect(error instanceof ConflictError).toBe(true);
      expect(error.errorCode).toBe("CAMPAIGN_NOT_COMPLETED");
    });

    test("successfully upserts records and calculates counts", async () => {
      const mockDb = createMockDbForEnergy({
        campaign: { id: campaignId, status: "SELESAI" },
        existingRecords: [{ month: "2026-05" }], // 2026-05 is existing, 2026-06 is new
        insertedRecords: [
          { month: "2026-05", kwhProduced: 20 },
          { month: "2026-06", kwhProduced: 30 },
        ],
      });

      const result = await bulkUploadEnergyRecords(
        campaignId,
        [
          { month: "2026-05", kwhProduced: 20, idrSaved: 200, kgCo2Reduced: 10 },
          { month: "2026-06", kwhProduced: 30, idrSaved: 300, kgCo2Reduced: 15 },
        ],
        mockDb,
      );

      expect(result.created).toBe(1); // 2026-06 is new
      expect(result.updated).toBe(1); // 2026-05 is existing
      expect(result.data.length).toBe(2);
      expect(result.data[0].month).toBe("2026-05");
      expect(result.data[1].month).toBe("2026-06");
    });
  });
});
