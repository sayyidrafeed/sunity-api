import type { NewAsset } from "../db/schema/index.js";

export const assetsSeedData: NewAsset[] = [
  // Worship Place Thumbnails
  {
    id: "11111111-1111-4111-8111-111111111111",
    storageKey: "worship-places/thumbnails/masjid-al-ikhlas.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 154200,
    width: 800,
    height: 600,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    storageKey: "worship-places/thumbnails/gereja-santa-maria.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 245000,
    width: 800,
    height: 600,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    storageKey: "worship-places/thumbnails/pura-jagatnatha.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 189000,
    width: 800,
    height: 600,
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    storageKey: "worship-places/thumbnails/vihara-dharma-bhakti.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 310000,
    width: 800,
    height: 600,
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    storageKey: "worship-places/thumbnails/klenteng-boen-tek-bio.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 275000,
    width: 800,
    height: 600,
  },

  // Campaign Covers
  {
    id: "aaaa1111-1111-4111-8111-111111111111",
    storageKey: "campaigns/covers/masjid-solar.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 512000,
    width: 1200,
    height: 800,
  },
  {
    id: "aaaa2222-2222-4222-8222-222222222222",
    storageKey: "campaigns/covers/gereja-solar.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 489000,
    width: 1200,
    height: 800,
  },
  {
    id: "aaaa3333-3333-4333-8333-333333333333",
    storageKey: "campaigns/covers/pura-solar.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 605000,
    width: 1200,
    height: 800,
  },
  {
    id: "aaaa4444-4444-4444-8444-444444444444",
    storageKey: "campaigns/covers/vihara-solar.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 420000,
    width: 1200,
    height: 800,
  },
  {
    id: "aaaa5555-5555-4555-8555-555555555555",
    storageKey: "campaigns/covers/klenteng-solar.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 535000,
    width: 1200,
    height: 800,
  },

  // Campaign Galleries & Transparency & Reports
  {
    id: "bbbb1111-1111-4111-8111-111111111111",
    storageKey: "campaigns/galleries/masjid-gallery-1.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 345000,
    width: 1024,
    height: 768,
  },
  {
    id: "bbbb2222-2222-4222-8222-222222222222",
    storageKey: "campaigns/galleries/masjid-gallery-2.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 412000,
    width: 1024,
    height: 768,
  },
  {
    id: "bbbb3333-3333-4333-8333-333333333333",
    storageKey: "campaigns/reports/masjid-feasibility-study.pdf",
    mimeType: "application/pdf",
    sizeBytes: 2048000,
  },

  // Receipts for Expenses
  {
    id: "cccc1111-1111-4111-8111-111111111111",
    storageKey: "expenses/receipts/inverter-receipt.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 154000,
    width: 600,
    height: 800,
  },
  {
    id: "cccc2222-2222-4222-8222-222222222222",
    storageKey: "expenses/receipts/solar-panels-receipt.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 231000,
    width: 600,
    height: 800,
  },
  {
    id: "cccc3333-3333-4333-8333-333333333333",
    storageKey: "expenses/receipts/installation-fee-receipt.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 98000,
    width: 600,
    height: 800,
  },
];
