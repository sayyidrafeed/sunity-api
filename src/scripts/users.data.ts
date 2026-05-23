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
];
