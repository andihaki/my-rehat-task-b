import type { RouterClient } from "@orpc/server";
import { ORPCError } from "@orpc/server";
import { z } from "zod";

import { listing } from "@myrehat-task-b/db/schema";
import { normalizeMyWhatsapp, LISTING_TYPE_VALUES } from "@myrehat-task-b/db";

import { protectedProcedure, publicProcedure } from "../index";

const listingSchema = z.object({
  title: z.string().trim().min(3).max(120),
  price: z.coerce.number().int().positive(),
  location: z.string().trim().min(2).max(120),
  type: z.enum(LISTING_TYPE_VALUES),
  whatsapp: z
    .string()
    .refine((val) => normalizeMyWhatsapp(val) !== null, {
      message: "Invalid WhatsApp number format",
    })
    .transform((val) => normalizeMyWhatsapp(val)!),
});

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  privateData: protectedProcedure.handler(({ context }) => {
    return {
      message: "This is private",
      user: context.session?.user,
    };
  }),
  listings: {
    getAll: publicProcedure.handler(async ({ context }) => {
      const listings = await context.db.query.listing.findMany({
        orderBy: (listing, { desc }) => [desc(listing.createdAt)],
      });
      return listings;
    }),
    getMine: protectedProcedure.handler(async ({ context }) => {
      return context.db.query.listing.findMany({
        where: { userId: context.session.user.id },
        orderBy: (listing, { desc }) => [desc(listing.createdAt)],
      });
    }),
    getLatest: publicProcedure.handler(async ({ context }) => {
      return context.db.query.listing.findMany({
        orderBy: (listing, { desc }) => [desc(listing.createdAt)],
        limit: 3,
      });
    }),
    create: protectedProcedure
      .input(listingSchema)
      .handler(async ({ context, input }) => {
        try {
          const newListing = await context.db.insert(listing).values({
            ...input,
            userId: context.session.user.id,
          }).returning();
          return newListing[0];
        } catch (error) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to create listing",
          });
        }
      }),
  },
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
