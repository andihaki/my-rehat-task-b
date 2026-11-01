import { LISTING_TYPE_VALUES, normalizeMyWhatsapp } from "@myrehat-task-b/db";
import { listing } from "@myrehat-task-b/db/schema";
import { ORPCError } from "@orpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

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

function dbErrorCauseMessage(error: unknown): string {
	const cause = (error as { cause?: unknown })?.cause;
	return cause instanceof Error ? cause.message : String(error);
}

export const homestayRouter = {
	list: publicProcedure.handler(async ({ context }) => {
		try {
			return await context.db.select().from(listing).orderBy(desc(listing.createdAt));
		} catch (error) {
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: dbErrorCauseMessage(error),
			});
		}
	}),
	getMine: protectedProcedure.handler(async ({ context }) => {
		return context.db
			.select()
			.from(listing)
			.where(eq(listing.userId, context.session.user.id))
			.orderBy(desc(listing.createdAt));
	}),
	getLatest: publicProcedure.handler(async ({ context }) => {
		return context.db
			.select()
			.from(listing)
			.orderBy(desc(listing.createdAt))
			.limit(3);
	}),
	create: protectedProcedure
		.input(listingSchema)
		.handler(async ({ context, input }) => {
			try {
				const newListing = await context.db
					.insert(listing)
					.values({
						...input,
						userId: context.session.user.id,
					})
					.returning();
				return newListing[0];
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to create listing",
				});
			}
		}),
};
