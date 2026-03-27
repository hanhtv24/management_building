// import { relations } from 'drizzle-orm';
import { numeric, pgTable, timestamp, varchar, primaryKey } from 'drizzle-orm/pg-core';
// import { contract } from './contract.schema';
// import { usageLog, invoice } from './billing.schema';
import { consumerTypeEnum } from './enum.schema';

// ⚠️ BẢNG SIÊU KIỂU (SUPERTYPE)
export const serviceConsumer = pgTable('service_consumer', {
  consumerId: varchar('consumer_id', { length: 50 }).primaryKey(),
  consumerType: consumerTypeEnum('consumer_type').notNull(), // 'Company' hoặc 'Employee'
});

// BẢNG KIỂU CON 1 (SUBTYPE)
export const company = pgTable('company', {
  // Liên kết 1-1 với bảng cha
  consumerId: varchar('consumer_id', { length: 50 }).notNull().unique().references(() => serviceConsumer.consumerId),
  
  companyId: varchar('company_id', { length: 50 }).primaryKey(),
  taxCode: varchar('tax_code', { length: 50 }).notNull().unique(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  phoneNo: varchar('phone_no', { length: 20 }).array(),
  email: varchar('email', { length: 100 }),
  totalRentArea: numeric('total_rent_area', { precision: 10, scale: 2 }).default('0'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// BẢNG KIỂU CON 2 (SUBTYPE) & THỰC THỂ YẾU
export const employee = pgTable('employee', {
  // Liên kết 1-1 với bảng cha
  consumerId: varchar('consumer_id', { length: 50 }).notNull().unique().references(() => serviceConsumer.consumerId),
  
  companyId: varchar('company_id', { length: 50 }).notNull().references(() => company.companyId),
  employeeId: varchar('employee_id', { length: 50 }).notNull(), // Partial Key
  
  firstName: varchar('first_name', { length: 50 }).notNull(),
  lastName: varchar('last_name', { length: 50 }).notNull(),
  fullName: varchar('full_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 100 }),
  status: varchar('status', { length: 50 }),
  licensePlate: varchar('license_plate', { length: 20 }).array(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  primaryKey({ columns: [table.companyId, table.employeeId] })
]);

// export const companyRelations = relations(company, ({ many }) => ({
//   employees: many(employee),
//   contracts: many(contract),
//   invoices: many(invoice),
// }));

// export const employeeRelations = relations(employee, ({ one }) => ({
//   company: one(company, { fields: [employee.companyId], references: [company.companyId] }),
// }));