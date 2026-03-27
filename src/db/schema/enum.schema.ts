import { pgEnum } from 'drizzle-orm/pg-core';

export const genderEnum = pgEnum('gender_enum', ['Nam', 'Nữ', 'Khác']);

export const staffRoleEnum = pgEnum('staff_role_enum', ['QuanLy', 'NhanVien']);

export const invoiceStatusEnum = pgEnum('invoice_status_enum', ['ChuaThanhToan', 'DaThanhToan', 'QuaHan']);

export const contractStatusEnum = pgEnum('contract_status_enum', ['HieuLuc', 'HetHan', 'HuyBo']);

export const consumerTypeEnum = pgEnum('consumer_type_enum', ['Company', 'Employee']);