import type { NewCampaign } from "../db/schema/index.js";

export const getCampaignsSeedData = (worshipPlaceIds: string[]): NewCampaign[] => {
  const [masjidId, gerejaId, puraId, viharaId, klentengId] = worshipPlaceIds;

  return [
    {
      title: "Instalasi Panel Surya Masjid Raya Al-Ikhlas",
      description:
        "Bantu kami mendanai panel surya untuk kemandirian energi masjid Al-Ikhlas, mengurangi biaya operasional listrik dan mendukung gerakan ramah lingkungan di lingkungan ibadah.",
      targetIdr: 50000000,
      panelCapacityKwp: "5.50",
      raisedIdr: 15000000,
      donorCount: 2,
      estimatedKwhAnnual: "7200.00",
      estimatedIdrSavings: 12000000,
      fundUsage:
        "Pembelian inverter, 12 unit modul panel surya 450Wp, struktur penyangga panel, serta kabel instalasi standar SNI.",
      energyProducedKwhMonthly: "600.00",
      beneficiaries: 500,
      carbonReductionKgMonthly: "518.00",
      electricitySavingsIdrMonthly: 1000000,
      impactDescription:
        "Mengurangi biaya listrik bulanan masjid sebesar 60%, menghemat dana umat untuk kegiatan sosial keagamaan lainnya.",
      coverImageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09",
      status: "AKTIF",
      isPublished: true,
      deadline: new Date("2026-12-31T23:59:59Z"),
      worshipPlaceId: masjidId,
    },
    {
      title: "Energi Hijau untuk Paroki Gereja Santa Maria",
      description:
        "Program transisi energi bersih di lingkungan paroki Santa Maria. Bersama kita wujudkan rumah ibadah yang ramah lingkungan dengan energi surya.",
      targetIdr: 75000000,
      panelCapacityKwp: "8.00",
      raisedIdr: 0,
      donorCount: 0,
      estimatedKwhAnnual: "10500.00",
      estimatedIdrSavings: 18000000,
      fundUsage:
        "Instalasi sistem panel surya on-grid terintegrasi dengan jaringan listrik PLN untuk efisiensi maksimal.",
      energyProducedKwhMonthly: "875.00",
      beneficiaries: 800,
      carbonReductionKgMonthly: "755.00",
      electricitySavingsIdrMonthly: 1500000,
      impactDescription:
        "Mendukung gerakan paroki hijau ramah lingkungan dan mengedukasi jemaat tentang energi berkelanjutan.",
      coverImageUrl: "https://images.unsplash.com/photo-1548625361-155deee25919",
      status: "DRAFT",
      isPublished: false,
      deadline: new Date("2026-10-15T23:59:59Z"),
      worshipPlaceId: gerejaId,
    },
    {
      title: "Panel Surya untuk Penerangan Pura Agung Jagatnatha",
      description:
        "Mendukung program Go Green di area suci Pura Agung Jagatnatha dengan instalasi panel surya untuk penerangan area luar dan aula kegiatan umat.",
      targetIdr: 60000000,
      panelCapacityKwp: "6.00",
      raisedIdr: 60000000, // Fully funded!
      donorCount: 4,
      estimatedKwhAnnual: "7800.00",
      estimatedIdrSavings: 13000000,
      fundUsage:
        "Pembelian panel surya 6kWp, solar charge controller, baterai penyimpanan (off-grid system), dan lampu LED outdoor.",
      energyProducedKwhMonthly: "650.00",
      beneficiaries: 600,
      carbonReductionKgMonthly: "560.00",
      electricitySavingsIdrMonthly: 1100000,
      impactDescription:
        "Mengurangi ketergantungan pada listrik fosil dan memastikan penerangan area pura tetap menyala saat pemadaman.",
      coverImageUrl: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d",
      status: "INSTALASI",
      isPublished: true,
      deadline: new Date("2026-06-01T23:59:59Z"),
      worshipPlaceId: puraId,
    },
    {
      title: "Kemandirian Energi Listrik Vihara Dharma Bhakti",
      description:
        "Proyek solar panel mandiri untuk menerangi aula ibadah utama Vihara Dharma Bhakti, menekan biaya listrik bulanan secara permanen.",
      targetIdr: 45000000,
      panelCapacityKwp: "4.50",
      raisedIdr: 45000000, // Fully funded!
      donorCount: 3,
      estimatedKwhAnnual: "5800.00",
      estimatedIdrSavings: 9600000,
      fundUsage:
        "Pengadaan modul panel surya, grid-tie inverter, dan biaya jasa pemasangan profesional bersertifikat.",
      energyProducedKwhMonthly: "480.00",
      beneficiaries: 400,
      carbonReductionKgMonthly: "410.00",
      electricitySavingsIdrMonthly: 800000,
      impactDescription:
        "Kemandirian energi terbarukan 100% untuk area ibadah utama dan penghematan biaya listrik hingga 70%.",
      coverImageUrl: "https://images.unsplash.com/photo-1509391366360-2e959784a276",
      status: "SELESAI",
      isPublished: true,
      deadline: new Date("2026-01-15T23:59:59Z"),
      worshipPlaceId: viharaId,
    },
    {
      title: "Restorasi Energi Bersih Klenteng Boen Tek Bio",
      description:
        "Instalasi panel surya cagar budaya untuk menghemat biaya operasional pemeliharaan klenteng bersejarah Boen Tek Bio.",
      targetIdr: 80000000,
      panelCapacityKwp: "8.50",
      raisedIdr: 80000000, // Fully funded!
      donorCount: 3,
      estimatedKwhAnnual: "11000.00",
      estimatedIdrSavings: 19000000,
      fundUsage:
        "Pemasangan panel surya dengan struktur khusus agar tidak merusak struktur atap cagar budaya klenteng.",
      energyProducedKwhMonthly: "910.00",
      beneficiaries: 700,
      carbonReductionKgMonthly: "780.00",
      electricitySavingsIdrMonthly: 1600000,
      impactDescription:
        "Melestarikan cagar budaya sekaligus mengadopsi teknologi hijau masa depan.",
      coverImageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09",
      status: "ARCHIVED",
      isPublished: true,
      deadline: new Date("2025-11-30T23:59:59Z"),
      worshipPlaceId: klentengId,
    },
  ];
};
