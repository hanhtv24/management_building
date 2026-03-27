import { relations } from 'drizzle-orm';
import { office } from './building.schema';
import { company, employee } from './company.schema';
import { contract } from './contract.schema';
import { service, pricingPolicy, areaBased, headcountBased } from './service.schema';
import { buildingStaff, workAssignment } from './staff.schema';
import { invoice, invoiceDetail } from './billing.schema';

// 1. BUILDING & CONTRACT
export const officeRelations = relations(office, ({ many }) => ({
  contracts: many(contract),
}));

export const contractRelations = relations(contract, ({ one }) => ({
  company: one(company, { fields: [contract.companyId], references: [company.companyId] }),
  office: one(office, { fields: [contract.officeId], references: [office.officeId] }),
}));

// 2. COMPANY & EMPLOYEE
export const companyRelations = relations(company, ({ many }) => ({
  employees: many(employee),
  contracts: many(contract),
  invoices: many(invoice),
}));

export const employeeRelations = relations(employee, ({ one }) => ({
  company: one(company, { fields: [employee.companyId], references: [company.companyId] }),
}));

// 3. SERVICE & POLICIES
export const serviceRelations = relations(service, ({ many }) => ({
  policies: many(pricingPolicy),
  assignments: many(workAssignment),
}));

export const pricingPolicyRelations = relations(pricingPolicy, ({ one }) => ({
  service: one(service, { fields: [pricingPolicy.serviceId], references: [service.serviceId] }),
  areaBasedDetail: one(areaBased, { fields: [pricingPolicy.serviceId, pricingPolicy.policyId], references: [areaBased.serviceId, areaBased.policyId] }),
  headcountBasedDetail: one(headcountBased, { fields: [pricingPolicy.serviceId, pricingPolicy.policyId], references: [headcountBased.serviceId, headcountBased.policyId] }),
}));

// 4. STAFF & ASSIGNMENT
export const staffRelations = relations(buildingStaff, ({ many, one }) => ({
  assignments: many(workAssignment),
  manager: one(buildingStaff, { fields: [buildingStaff.managerId], references: [buildingStaff.staffId], relationName: 'manages' }),
  staffs: many(buildingStaff, { relationName: 'manages' }),
}));

export const assignmentRelations = relations(workAssignment, ({ one }) => ({
  staff: one(buildingStaff, { fields: [workAssignment.staffId], references: [buildingStaff.staffId] }),
  service: one(service, { fields: [workAssignment.serviceId], references: [service.serviceId] }),
}));

// 5. BILLING
export const invoiceRelations = relations(invoice, ({ one, many }) => ({
  company: one(company, { fields: [invoice.companyId], references: [company.companyId] }),
  details: many(invoiceDetail),
}));

export const invoiceDetailRelations = relations(invoiceDetail, ({ one }) => ({
  invoice: one(invoice, { fields: [invoiceDetail.invoiceId], references: [invoice.invoiceId] }),
  service: one(service, { fields: [invoiceDetail.serviceId], references: [service.serviceId] }),
}));