import { numeric, pgTable, timestamp, varchar, integer } from 'drizzle-orm/pg-core';

export const office = pgTable('office', {
  officeId: varchar('office_id', { length: 50 }).primaryKey(),
  floor: integer('floor').notNull(),
  room: varchar('room', { length: 50 }).notNull(),
  location: varchar('location', { length: 255 }),
  area: numeric('area', { precision: 10, scale: 2 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 18, scale: 2 }).notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// export const officeRelations = relations(office, ({ many }) => ({
//   contracts: many(contract),
// }));