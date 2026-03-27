// import { relations, sql } from 'drizzle-orm';
import { numeric, pgTable, timestamp, varchar, date, integer, primaryKey, AnyPgColumn } from 'drizzle-orm/pg-core';
import { genderEnum, staffRoleEnum } from './enum.schema';
import { service } from './service.schema';

export const buildingStaff = pgTable('building_staff', {
  staffId: varchar('staff_id', { length: 50 }).primaryKey(),
  
  // Quan hệ đệ quy (1 Manager quản lý nhiều Staff)
  managerId: varchar('manager_id', { length: 50 }), 
  
  // Thuộc tính phức hợp
  firstName: varchar('first_name', { length: 50 }).notNull(),
  lastName: varchar('last_name', { length: 50 }).notNull(),
  fullName: varchar('full_name', { length: 100 }).notNull(),
  
  dob: date('dob').notNull(),
  gender: genderEnum('gender').notNull(),
  
  // ⚠️ THUỘC TÍNH ĐA TRỊ (Dùng mảng - Array)
  phone: varchar('phone', { length: 20 }).array(), // VD: ['0912...', '0988...']
  role: staffRoleEnum('role').array().notNull(),   // VD: ['QuanLy', 'NhanVien']
  
  baseSalary: numeric('base_salary', { precision: 18, scale: 2 }).notNull(),
  
  // ⚠️ THUỘC TÍNH PHÁI SINH (Sẽ update bằng Procedure/Trigger sau)
  salary: numeric('salary', { precision: 18, scale: 2 }),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// ⚠️ THỰC THỂ KẾT HỢP (Associative Entity)
export const workAssignment = pgTable('work_assignment', {
  staffId: varchar('staff_id', { length: 50 }).notNull().references(() => buildingStaff.staffId),
  serviceId: varchar('service_id', { length: 50 }).notNull().references(() => service.serviceId),
  
  // Đổi tên cho khớp ERD 100%
  year: integer('year').notNull(),
  month: integer('month').notNull(),
  
  position: varchar('position', { length: 100 }), 
  revenueRateShare: numeric('revenue_rate_share', { precision: 5, scale: 2 }).notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  // Khóa phức hợp 4 cột
  primaryKey({ columns: [table.staffId, table.serviceId, table.year, table.month] })
]);

// // Cập nhật lại Relations để map đúng chuẩn quan hệ Đệ quy
// export const staffRelations = relations(buildingStaff, ({ many, one }) => ({
//   assignments: many(workAssignment),
  
//   // Quan hệ tự trỏ (Self-referencing): Ai là quản lý của người này?
//   manager: one(buildingStaff, {
//     fields: [buildingStaff.managerId],
//     references: [buildingStaff.staffId],
//     relationName: 'manages'
//   }),
//   // Quan hệ tự trỏ: Người này quản lý những ai?
//   staffs: many(buildingStaff, { relationName: 'manages' }),
// }));

// export const assignmentRelations = relations(workAssignment, ({ one }) => ({
//   staff: one(buildingStaff, { fields: [workAssignment.staffId], references: [buildingStaff.staffId] }),
//   service: one(service, { fields: [workAssignment.serviceId], references: [service.serviceId] }),
// }));