import type { NewUser } from "../db/schema/index.js";

export const usersSeedData: NewUser[] = [
  {
    id: "user-admin-uuid-1111",
    name: "Admin Sunity",
    email: "admin@sunity.id",
    emailVerified: true,
    role: "admin",
  },
  {
    id: "user-donor-uuid-2222",
    name: "Rian Donor",
    email: "rian@gmail.com",
    emailVerified: true,
    role: "user",
  },
  {
    id: "user-donor-uuid-3333",
    name: "Budi Pratama",
    email: "budi@gmail.com",
    emailVerified: true,
    role: "user",
  },
  {
    id: "user-donor-uuid-4444",
    name: "Ani Wijaya",
    email: "ani@gmail.com",
    emailVerified: true,
    role: "user",
  },
  {
    id: "user-donor-uuid-5555",
    name: "Yusuf Ibrahim",
    email: "yusuf@gmail.com",
    emailVerified: true,
    role: "user",
  },
  {
    id: "user-donor-uuid-6666",
    name: "Melati Lestari",
    email: "melati@gmail.com",
    emailVerified: true,
    role: "user",
  },
];
