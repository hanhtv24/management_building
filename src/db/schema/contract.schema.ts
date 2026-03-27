// import { relations } from 'drizzle-orm';
import { numeric, pgTable, timestamp, varchar, date, primaryKey } from 'drizzle-orm/pg-core';
import { company } from './company.schema';
import { office } from './building.schema';
import { contractStatusEnum } from './enum.schema';

export const contract = pgTable('company_contract', {
  // ĐẢM BẢO BẠN KHÔNG BỊ MẤT DÒNG NÀY 👇
  companyId: varchar('company_id', { length: 50 }).notNull().references(() => company.companyId),
  officeId: varchar('office_id', { length: 50 }).notNull().references(() => office.officeId),
  
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  rentPrice: numeric('rent_price', { precision: 18, scale: 2 }).notNull(),
  status: contractStatusEnum('status').default('HieuLuc').notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  primaryKey({ columns: [table.companyId, table.officeId, table.startDate] })
]);
// export const contractRelations = relations(contract, ({ one }) => ({
//   company: one(company, { fields: [contract.companyId], references: [company.companyId] }),
//   office: one(office, { fields: [contract.officeId], references: [office.officeId] }),
// }));