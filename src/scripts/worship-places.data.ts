import type { NewWorshipPlace } from "../db/schema/index.js";

export const getWorshipPlacesSeedData = (): NewWorshipPlace[] => [
  {
    name: "Masjid Raya Al-Ikhlas",
    religionType: "Masjid",
    address: "Jl. Merdeka No. 123, Jakarta Pusat",
    city: "Jakarta",
    contactPerson: "Pak Ahmad",
    contactPhone: "+62-812-3456-7890",
    currentCondition: "Baik",
    personInCharge: "Pak Haji Mahmud",
  },
  {
    name: "Gereja Santa Maria",
    religionType: "Gereja",
    address: "Jl. Sudirman No. 456, Jakarta Selatan",
    city: "Jakarta",
    contactPerson: "Ibu Siti",
    contactPhone: "+62-821-9876-5432",
    currentCondition: "Baik",
    personInCharge: "Pdt. Bambang",
  },
];
