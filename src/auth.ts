import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db/client.js";
import { env } from "./config/env.js";
import { users, sessions, accounts, verification } from "./db/schema/users.js";

export const auth = betterAuth({
  baseURL: env.betterAuthUrl,
  secret: env.betterAuthSecret,
  trustedOrigins: [env.betterAuthUrl],

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { users, sessions, accounts, verification },
  }),

  advanced: {
    cookiePrefix: "sunity",
    defaultCookieAttributes: {
      sameSite: "none",
      secure: false,
      httpOnly: true,
      path: "/",
    },
    useSecureCookies: false,
  },

  socialProviders: {
    google: {
      clientId: env.googleClientId,
      clientSecret: env.googleClientSecret,
      prompt: "select_account",
      accessType: "offline",
    },
  },

  account: {
  storeStateStrategy: "cookie", 
  storeAccountCookie: true,
},

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      strategy: "jwe",
      maxAge: 60 * 5,
    },
  },

  
});