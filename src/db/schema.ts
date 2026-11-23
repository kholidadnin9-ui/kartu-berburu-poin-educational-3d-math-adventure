import { pgTable, text, jsonb, bigint } from "drizzle-orm/pg-core";
import type { Save } from "@/lib/game";
export const classrooms = pgTable("adventure_classrooms", {
  deviceHash: text("device_hash").primaryKey(),
  state: jsonb("state").$type<Save>().notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});
