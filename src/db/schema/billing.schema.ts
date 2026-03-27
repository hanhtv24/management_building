// import { relations } from 'drizzle-orm';

import { numeric, pgTable, timestamp, varchar, integer, date, primaryKey } from 'drizzle-orm/pg-core';
import { company, serviceConsumer } from './company.schema'; // Import thêm serviceConsumer
import { service } from './service.schema';
import { invoiceStatusEnum } from './enum.schema';

// ⚠️ THỰC THỂ KẾT HỢP (Associative Entity)
export const usageLog = pgTable('usage_log', {
  serviceId: varchar('service_id', { length: 50 }).notNull().references(() => service.serviceId),
  consumerId: varchar('consumer_id', { length: 50 }).notNull().references(() => serviceConsumer.consumerId),
  
  usageStart: timestamp('usage_start', { withTimezone: true }).notNull(),
  usageEnd: timestamp('usage_end', { withTimezone: true }),
  unitPriceSnapshot: numeric('unit_price_snapshot', { precision: 18, scale: 2 }).notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  // ⚠️ Khóa phức hợp 3 cột (Vì 1 consumer có thể dùng 1 dịch vụ nhiều lần ở các thời điểm khác nhau)
  primaryKey({ columns: [table.serviceId, table.consumerId, table.usageStart] })
]);

export const invoice = pgTable('invoice', {
  invoiceId: varchar('invoice_id', { length: 50 }).primaryKey(),
  companyId: varchar('company_id', { length: 50 }).notNull().references(() => company.companyId),
  
  billingMonth: integer('billing_month').notNull(),
  billingYear: integer('billing_year').notNull(),
  invoiceDate: date('invoice_date').notNull(),
  dueDate: date('due_date').notNull(),
  
  // ⚠️ THUỘC TÍNH PHÁI SINH (Nét đứt)
  totalAmount: numeric('total_amount', { precision: 18, scale: 2 }).default('0'),
  
  invoiceStatus: invoiceStatusEnum('invoice_status').default('ChuaThanhToan').notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// ⚠️ THỰC THỂ YẾU (Weak Entity) - Sử dụng Khóa phức hợp
export const invoiceDetail = pgTable('invoice_detail', {
  invoiceId: varchar('invoice_id', { length: 50 }).notNull().references(() => invoice.invoiceId),
  detailId: varchar('detail_id', { length: 50 }).notNull(), // Partial Key
  
  serviceId: varchar('service_id', { length: 50 }).notNull().references(() => service.serviceId),
  
  // Bổ sung thuộc tính bị thiếu
  date: date('date').notNull(),
  description: varchar('description', { length: 255 }),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric('subtotal', { precision: 18, scale: 2 }).notNull(),
}, (table) => [
  // Khai báo Khóa phức hợp (Composite Primary Key)
  primaryKey({ columns: [table.invoiceId, table.detailId] })
]);

// export const invoiceRelations = relations(invoice, ({ one, many }) => ({
//   company: one(company, { fields: [invoice.companyId], references: [company.companyId] }),
//   details: many(invoiceDetail),
// }));

// export const invoiceDetailRelations = relations(invoiceDetail, ({ one }) => ({
//   invoice: one(invoice, { fields: [invoiceDetail.invoiceId], references: [invoice.invoiceId] }),
//   service: one(service, { fields: [invoiceDetail.serviceId], references: [service.serviceId] }),
// }));