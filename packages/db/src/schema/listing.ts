import { pgEnum, pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const listingTypeEnum = pgEnum("listing_type", [
  "buy_property",
  "buy_land",
  "buy_airbnb_profile",
  "buy_airbnb_business",
]);

export const listing = pgTable("listing", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  price: integer("price").notNull(),
  location: text("location").notNull(),
  type: listingTypeEnum("type").notNull(),
  whatsapp: text("whatsapp").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
