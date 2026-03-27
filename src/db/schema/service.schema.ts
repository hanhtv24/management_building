// import { relations } from 'drizzle-orm';
import { numeric, pgTable, timestamp, varchar, integer, primaryKey, foreignKey } from 'drizzle-orm/pg-core';
// Import Enum nếu bạn muốn, ở đây mình dùng varchar cho policyType để file này độc lập nhé

export const service = pgTable('service', {
  serviceId: varchar('service_id', { length: 50 }).primaryKey(),
  serviceName: varchar('service_name', { length: 255 }).notNull(),
  serviceType: varchar('service_type', { length: 50 }).notNull(), 
  unitMeasurement: varchar('unit_measurement', { length: 50 }),
  
  // Thuộc tính phái sinh
  serviceRevenue: numeric('service_revenue', { precision: 18, scale: 2 }).default('0'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// ⚠️ BẢNG CHA (SUPERTYPE) & THỰC THỂ YẾU (WEAK ENTITY)
export const pricingPolicy = pgTable('pricing_policy', {
  serviceId: varchar('service_id', { length: 50 }).notNull().references(() => service.serviceId),
  policyId: varchar('policy_id', { length: 50 }).notNull(), // Partial Key
  
  basePrice: numeric('base_price', { precision: 18, scale: 2 }).notNull(),
  increasePercentage: numeric('increase_percentage', { precision: 5, scale: 2 }).notNull(),
  
  // Cột phân biệt (Discriminator) để biết nó là loại nào
  policyType: varchar('policy_type', { length: 50 }).notNull(), // 'AREA' hoặc 'HEADCOUNT'
}, (table) => [
  // Khóa phức hợp
  primaryKey({ columns: [table.serviceId, table.policyId] })
]);

// ⚠️ BẢNG CON 1 (SUBTYPE): Tính theo Diện tích
export const areaBased = pgTable('area_based', {
  serviceId: varchar('service_id', { length: 50 }).notNull(),
  policyId: varchar('policy_id', { length: 50 }).notNull(),
  
  areaFrom: numeric('area_from', { precision: 10, scale: 2 }).notNull(),
  areaTo: numeric('area_to', { precision: 10, scale: 2 }), // Để null nếu là "Trở lên"
}, (table) => [
  primaryKey({ columns: [table.serviceId, table.policyId] }),
  // Khóa ngoại phức hợp trỏ về bảng Cha
  foreignKey({
    columns: [table.serviceId, table.policyId],
    foreignColumns: [pricingPolicy.serviceId, pricingPolicy.policyId],
    name: 'fk_area_based_policy'
  })
]);

// ⚠️ BẢNG CON 2 (SUBTYPE): Tính theo Số lượng người
export const headcountBased = pgTable('headcount_based', {
  serviceId: varchar('service_id', { length: 50 }).notNull(),
  policyId: varchar('policy_id', { length: 50 }).notNull(),
  
  peopleFrom: integer('people_from').notNull(),
  peopleTo: integer('people_to'), // Để null nếu là "Trở lên"
}, (table) => [
  primaryKey({ columns: [table.serviceId, table.policyId] }),
  // Khóa ngoại phức hợp trỏ về bảng Cha
  foreignKey({
    columns: [table.serviceId, table.policyId],
    foreignColumns: [pricingPolicy.serviceId, pricingPolicy.policyId],
    name: 'fk_headcount_based_policy'
  })
]);

// ==========================================
// ĐỊNH NGHĨA QUAN HỆ (RELATIONS)
// ==========================================

// export const serviceRelations = relations(service, ({ many }) => ({
//   policies: many(pricingPolicy),
// }));

// export const pricingPolicyRelations = relations(pricingPolicy, ({ one }) => ({
//   service: one(service, { 
//     fields: [pricingPolicy.serviceId], 
//     references: [service.serviceId] 
//   }),
//   // Liên kết 1-1 xuống bảng con
//   areaBasedDetail: one(areaBased, { 
//     fields: [pricingPolicy.serviceId, pricingPolicy.policyId], 
//     references: [areaBased.serviceId, areaBased.policyId] 
//   }),
//   headcountBasedDetail: one(headcountBased, { 
//     fields: [pricingPolicy.serviceId, pricingPolicy.policyId], 
//     references: [headcountBased.serviceId, headcountBased.policyId] 
//   }),
// }));