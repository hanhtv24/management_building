-- ============================================================
-- SEED DATA (FIX): Hệ CSDL Quản lý Toà nhà Văn phòng
-- Dữ liệu cho 2 tháng: 03/2025 và 04/2025
-- ============================================================
-- CÔNG THỨC TÍNH GIÁ DỊCH VỤ (vệ sinh, bảo vệ, bảo trì):
--   Base: ≤10 người VÀ ≤100m² → giá base
--   Cứ thêm 5 người HOẶC thêm 10m² → tăng 5%
--   Số bậc = MAX(floor((nguoi-10)/5), 0) + MAX(floor((m2-100)/10), 0)
--   Đơn giá = base_price × 1.05^bậc
--
-- CMP-001: 200m², 3 NV → bậc_m2=(200-100)/10=10, bậc_nv=0 → 10 bậc
--   VS = 5,000,000 × 1.05^10 = 8,144,473
--   BV = 3,000,000 × 1.05^10 = 4,886,684
--   BT = 2,000,000 × 1.05^10 = 3,257,789
--
-- CMP-002: 150m², 2 NV → bậc_m2=(150-100)/10=5, bậc_nv=0 → 5 bậc
--   VS = 5,000,000 × 1.05^5  = 6,381,408
--   BV = 3,000,000 × 1.05^5  = 3,828,845
--   BT = 2,000,000 × 1.05^5  = 2,552,563
--
-- CMP-003: 60m², 2 NV → bậc=0
--   VS = 5,000,000
--   BV = 3,000,000
--   BT = 2,000,000
--
-- CMP-004: 380m², 5 NV → bậc_m2=(380-100)/10=28, bậc_nv=0 → 28 bậc
--   VS = 5,000,000 × 1.05^28 = 19,799,316
--   BV = 3,000,000 × 1.05^28 = 11,879,590
--   BT = 2,000,000 × 1.05^28 =  7,919,726
--
-- TIỀN THUÊ MẶT BẰNG:
--   rent_price trong contract = đơn giá/m²/tháng (VNĐ/m²)
--   Tiền thuê = area × rent_price
--   OFF-001: 80m²  × 350,000 =  28,000,000
--   OFF-002: 120m² × 320,000 =  38,400,000
--   OFF-004: 150m² × 310,000 =  46,500,000
--   OFF-008: 60m²  × 250,000 =  15,000,000
--   OFF-003: 200m² × 300,000 =  60,000,000
--   OFF-006: 180m² × 290,000 =  52,200,000
-- ============================================================

-- ============================================================
-- TRUNCATE (xóa dữ liệu cũ, giữ cấu trúc bảng)
-- ============================================================
TRUNCATE TABLE usage_log        CASCADE;
TRUNCATE TABLE invoice_detail   CASCADE;
TRUNCATE TABLE invoice          CASCADE;
TRUNCATE TABLE work_assignment  CASCADE;
TRUNCATE TABLE area_based       CASCADE;
TRUNCATE TABLE headcount_based  CASCADE;
TRUNCATE TABLE pricing_policy   CASCADE;
TRUNCATE TABLE service          CASCADE;
TRUNCATE TABLE company_contract CASCADE;
TRUNCATE TABLE employee         CASCADE;
TRUNCATE TABLE company          CASCADE;
TRUNCATE TABLE service_consumer CASCADE;
TRUNCATE TABLE office           CASCADE;
TRUNCATE TABLE building_staff   CASCADE;

-- ============================================================
-- 1. OFFICE
-- unit_price = VNĐ/m²/tháng
-- ============================================================
INSERT INTO office (office_id, floor, room, location, area, unit_price, created_at) VALUES
('OFF-001', 3,  'A301', 'Khu A - Hướng Đông',    80.00, 350000.00, NOW()),
('OFF-002', 3,  'A302', 'Khu A - Hướng Tây',    120.00, 320000.00, NOW()),
('OFF-003', 5,  'B501', 'Khu B - Hướng Nam',    200.00, 300000.00, NOW()),
('OFF-004', 5,  'B502', 'Khu B - Hướng Bắc',    150.00, 310000.00, NOW()),
('OFF-005', 7,  'C701', 'Khu C - Hướng Đông',   250.00, 280000.00, NOW()),
('OFF-006', 7,  'C702', 'Khu C - Hướng Tây',    180.00, 290000.00, NOW()),
('OFF-007', 10, 'D1001','Khu D - View toàn cảnh',300.00, 400000.00, NOW()),
('OFF-008', 2,  'A201', 'Khu A - Tầng thấp',     60.00, 250000.00, NOW());

-- ============================================================
-- 2. SERVICE
-- ============================================================
INSERT INTO service (service_id, service_name, service_type, unit_measurement, service_revenue, created_at) VALUES
('SVC-001', 'Vệ sinh văn phòng', 'VeSinh', 'tháng',     0.00, NOW()),
('SVC-002', 'Bảo vệ / An ninh',  'BaoVe',  'tháng',     0.00, NOW()),
('SVC-003', 'Bảo trì thiết bị',  'BaoTri', 'tháng',     0.00, NOW()),
('SVC-004', 'Ăn uống (canteen)', 'AnUong', 'lượt/ngày', 0.00, NOW()),
('SVC-005', 'Gửi xe ô tô',       'GuiXe',  'lượt/ngày', 0.00, NOW()),
('SVC-006', 'Gửi xe máy',        'GuiXe',  'lượt/ngày', 0.00, NOW());

-- ============================================================
-- 3. PRICING POLICY
-- base_price = giá khi ≤10 người VÀ ≤100m²
-- increase_percentage = 5 (tăng 5% mỗi bậc)
-- ============================================================
INSERT INTO pricing_policy (service_id, policy_id, base_price, increase_percentage, policy_type) VALUES
('SVC-001', 'PP-VS-01', 5000000.00, 5.00, 'AREA'),
('SVC-001', 'PP-VS-02', 5000000.00, 5.00, 'HEADCOUNT'),
('SVC-002', 'PP-BV-01', 3000000.00, 5.00, 'AREA'),
('SVC-002', 'PP-BV-02', 3000000.00, 5.00, 'HEADCOUNT'),
('SVC-003', 'PP-BT-01', 2000000.00, 5.00, 'AREA'),
('SVC-003', 'PP-BT-02', 2000000.00, 5.00, 'HEADCOUNT'),
('SVC-004', 'PP-AU-01',   50000.00, 0.00, 'HEADCOUNT'),
('SVC-005', 'PP-GX-01',  200000.00, 0.00, 'HEADCOUNT'),
('SVC-006', 'PP-GX-02',   70000.00, 0.00, 'HEADCOUNT');

INSERT INTO area_based (service_id, policy_id, area_from, area_to) VALUES
('SVC-001', 'PP-VS-01',   0.00, NULL),
('SVC-002', 'PP-BV-01',   0.00, NULL),
('SVC-003', 'PP-BT-01',   0.00, NULL);

INSERT INTO headcount_based (service_id, policy_id, people_from, people_to) VALUES
('SVC-001', 'PP-VS-02', 1, NULL),
('SVC-002', 'PP-BV-02', 1, NULL),
('SVC-003', 'PP-BT-02', 1, NULL),
('SVC-004', 'PP-AU-01', 1, NULL),
('SVC-005', 'PP-GX-01', 1, NULL),
('SVC-006', 'PP-GX-02', 1, NULL);

-- ============================================================
-- 4. BUILDING STAFF
-- ============================================================
INSERT INTO building_staff (staff_id, manager_id, first_name, last_name, full_name, dob, gender, phone, role, base_salary, created_at) VALUES
('STF-001', NULL,      'Minh',  'Nguyễn Văn', 'Nguyễn Văn Minh', '1980-05-10', 'Nam', ARRAY['0912000001'], ARRAY['QuanLy']::staff_role_enum[],   25000000.00, NOW()),
('STF-002', 'STF-001', 'Lan',   'Trần Thị',   'Trần Thị Lan',    '1990-03-22', 'Nữ',  ARRAY['0912000002'], ARRAY['NhanVien']::staff_role_enum[], 12000000.00, NOW()),
('STF-003', 'STF-001', 'Hùng',  'Lê Văn',     'Lê Văn Hùng',     '1988-07-15', 'Nam', ARRAY['0912000003'], ARRAY['NhanVien']::staff_role_enum[], 12000000.00, NOW()),
('STF-004', 'STF-001', 'Mai',   'Phạm Thị',   'Phạm Thị Mai',    '1995-11-08', 'Nữ',  ARRAY['0912000004'], ARRAY['NhanVien']::staff_role_enum[], 11000000.00, NOW()),
('STF-005', 'STF-001', 'Tuấn',  'Đỗ Văn',     'Đỗ Văn Tuấn',     '1992-01-30', 'Nam', ARRAY['0912000005'], ARRAY['NhanVien']::staff_role_enum[], 11000000.00, NOW()),
('STF-006', 'STF-001', 'Hoa',   'Vũ Thị',     'Vũ Thị Hoa',      '1993-09-17', 'Nữ',  ARRAY['0912000006'], ARRAY['NhanVien']::staff_role_enum[], 10000000.00, NOW()),
('STF-007', 'STF-001', 'Nam',   'Bùi Văn',    'Bùi Văn Nam',     '1991-04-25', 'Nam', ARRAY['0912000007'], ARRAY['NhanVien']::staff_role_enum[], 10000000.00, NOW()),
('STF-008', 'STF-001', 'Thảo',  'Hoàng Thị',  'Hoàng Thị Thảo',  '1996-06-12', 'Nữ',  ARRAY['0912000008'], ARRAY['NhanVien']::staff_role_enum[], 10000000.00, NOW());

-- ============================================================
-- 5. WORK ASSIGNMENT (Tháng 3 & 4 / 2025)
-- ============================================================
INSERT INTO work_assignment (staff_id, service_id, year, month, position, revenue_rate_share, created_at) VALUES
('STF-002', 'SVC-001', 2025, 3, 'Nhân viên vệ sinh', 2.50, NOW()),
('STF-003', 'SVC-001', 2025, 3, 'Nhân viên vệ sinh', 2.50, NOW()),
('STF-004', 'SVC-002', 2025, 3, 'Bảo vệ ca ngày',    2.00, NOW()),
('STF-005', 'SVC-002', 2025, 3, 'Bảo vệ ca đêm',     2.00, NOW()),
('STF-006', 'SVC-003', 2025, 3, 'Kỹ thuật viên',     1.80, NOW()),
('STF-007', 'SVC-004', 2025, 3, 'Nhân viên canteen',  1.50, NOW()),
('STF-008', 'SVC-005', 2025, 3, 'Quản lý bãi xe',     1.20, NOW()),
('STF-008', 'SVC-006', 2025, 3, 'Quản lý bãi xe',     1.20, NOW()),
('STF-002', 'SVC-001', 2025, 4, 'Nhân viên vệ sinh', 2.50, NOW()),
('STF-003', 'SVC-001', 2025, 4, 'Nhân viên vệ sinh', 2.50, NOW()),
('STF-004', 'SVC-002', 2025, 4, 'Bảo vệ ca ngày',    2.00, NOW()),
('STF-005', 'SVC-002', 2025, 4, 'Bảo vệ ca đêm',     2.00, NOW()),
('STF-006', 'SVC-003', 2025, 4, 'Kỹ thuật viên',     1.80, NOW()),
('STF-007', 'SVC-004', 2025, 4, 'Nhân viên canteen',  1.50, NOW()),
('STF-008', 'SVC-005', 2025, 4, 'Quản lý bãi xe',     1.20, NOW()),
('STF-008', 'SVC-006', 2025, 4, 'Quản lý bãi xe',     1.20, NOW());

-- ============================================================
-- 6. SERVICE CONSUMER
-- ============================================================
INSERT INTO service_consumer (consumer_id, consumer_type) VALUES
('CSM-C001', 'Company'), ('CSM-C002', 'Company'),
('CSM-C003', 'Company'), ('CSM-C004', 'Company'),
('CSM-E001', 'Employee'), ('CSM-E002', 'Employee'),
('CSM-E003', 'Employee'), ('CSM-E004', 'Employee'),
('CSM-E005', 'Employee'), ('CSM-E006', 'Employee'),
('CSM-E007', 'Employee'), ('CSM-E008', 'Employee'),
('CSM-E009', 'Employee'), ('CSM-E010', 'Employee'),
('CSM-E011', 'Employee'), ('CSM-E012', 'Employee');

-- ============================================================
-- 7. COMPANY
-- ============================================================
INSERT INTO company (company_id, consumer_id, tax_code, company_name, phone_no, email, total_rent_area, created_at) VALUES
('CMP-001', 'CSM-C001', '0101234567', 'CÔNG TY TNHH TECH SOLUTIONS VN',   ARRAY['02812345678','0909111222'], 'contact@techsolutions.vn',  200.00, NOW()),
('CMP-002', 'CSM-C002', '0107654321', 'CÔNG TY CP MARKETING BRIGHT',       ARRAY['02887654321'],              'info@marketingbright.vn',   150.00, NOW()),
('CMP-003', 'CSM-C003', '0301122334', 'CÔNG TY TNHH TƯ VẤN GLOBAL CONSULT',ARRAY['02833445566'],             'hello@globalconsult.vn',     60.00, NOW()),
('CMP-004', 'CSM-C004', '0309988776', 'CÔNG TY CP LOGISTICS SWIFT',        ARRAY['02866778899','0988334455'], 'ops@swiftlogistics.vn',     380.00, NOW());

-- ============================================================
-- 8. EMPLOYEE
-- ============================================================
INSERT INTO employee (consumer_id, company_id, employee_id, first_name, last_name, full_name, email, status, license_plate, created_at) VALUES
('CSM-E001','CMP-001','EMP-01','An',   'Nguyễn Thành','Nguyễn Thành An',  'an@techsolutions.vn',    'Active', ARRAY['51A-123.45'], NOW()),
('CSM-E002','CMP-001','EMP-02','Bình', 'Trần Văn',    'Trần Văn Bình',    'binh@techsolutions.vn',  'Active', ARRAY['59B-234.56'], NOW()),
('CSM-E003','CMP-001','EMP-03','Châu', 'Lê Thị',      'Lê Thị Châu',      'chau@techsolutions.vn',  'Active', NULL,               NOW()),
('CSM-E004','CMP-002','EMP-01','Dũng', 'Phạm Anh',    'Phạm Anh Dũng',    'dung@marketingbright.vn','Active', ARRAY['51C-345.67'], NOW()),
('CSM-E005','CMP-002','EMP-02','Ế',   'Hoàng Thị',   'Hoàng Thị Ế',     'e@marketingbright.vn',   'Active', NULL,               NOW()),
('CSM-E006','CMP-003','EMP-01','Phong','Vũ Văn',      'Vũ Văn Phong',     'phong@globalconsult.vn', 'Active', ARRAY['51D-456.78'], NOW()),
('CSM-E007','CMP-003','EMP-02','Giang','Đặng Thị',    'Đặng Thị Giang',   'giang@globalconsult.vn', 'Active', NULL,               NOW()),
('CSM-E008','CMP-004','EMP-01','Hải',  'Đinh Văn',    'Đinh Văn Hải',     'hai@swiftlogistics.vn',  'Active', ARRAY['51E-567.89'], NOW()),
('CSM-E009','CMP-004','EMP-02','Ích',  'Bùi Thị',     'Bùi Thị Ích',      'ich@swiftlogistics.vn',  'Active', ARRAY['51F-678.90'], NOW()),
('CSM-E010','CMP-004','EMP-03','Kiên', 'Cao Văn',     'Cao Văn Kiên',     'kien@swiftlogistics.vn', 'Active', NULL,               NOW()),
('CSM-E011','CMP-004','EMP-04','Linh', 'Ngô Thị',     'Ngô Thị Linh',     'linh@swiftlogistics.vn', 'Active', NULL,               NOW()),
('CSM-E012','CMP-004','EMP-05','Mạnh', 'Tô Văn',      'Tô Văn Mạnh',      'manh@swiftlogistics.vn', 'Active', ARRAY['51G-789.01'], NOW());

-- ============================================================
-- 9. CONTRACT
-- rent_price = đơn giá/m²/tháng (VNĐ/m²)
-- Tiền thuê thực = area × rent_price (tính bởi app)
-- ============================================================
INSERT INTO company_contract (company_id, office_id, start_date, end_date, rent_price, status, created_at) VALUES
('CMP-001','OFF-001','2025-01-01','2026-12-31', 350000.00,'HieuLuc', NOW()),
('CMP-001','OFF-002','2025-01-01','2026-12-31', 320000.00,'HieuLuc', NOW()),
('CMP-002','OFF-004','2025-02-01','2026-01-31', 310000.00,'HieuLuc', NOW()),
('CMP-003','OFF-008','2025-03-01','2025-08-31', 250000.00,'HieuLuc', NOW()),
('CMP-004','OFF-003','2024-07-01','2025-06-30', 300000.00,'HieuLuc', NOW()),
('CMP-004','OFF-006','2024-07-01','2025-06-30', 290000.00,'HieuLuc', NOW());

-- ============================================================
-- 10. USAGE LOG
-- Dịch vụ VS/BV/BT: company consumer, cả tháng
-- Dịch vụ ăn uống/gửi xe: employee consumer, từng ngày
--
-- Đơn giá snapshot (đã tính 1.05^bậc):
--   CMP-001 (200m², 3NV, 10 bậc): VS=8,144,473  BV=4,886,684  BT=3,257,789
--   CMP-002 (150m², 2NV,  5 bậc): VS=6,381,408  BV=3,828,845  BT=2,552,563
--   CMP-003 ( 60m², 2NV,  0 bậc): VS=5,000,000  BV=3,000,000  BT=2,000,000
--   CMP-004 (380m², 5NV, 28 bậc): VS=19,799,316 BV=11,879,590 BT=7,919,726
-- ============================================================

-- --- THÁNG 3/2025 ---
INSERT INTO usage_log (service_id, consumer_id, usage_start, usage_end, unit_price_snapshot, created_at) VALUES
-- Vệ sinh
('SVC-001','CSM-C001','2025-03-01 08:00+07','2025-03-31 18:00+07',  8144473.00, NOW()),
('SVC-001','CSM-C002','2025-03-01 08:00+07','2025-03-31 18:00+07',  6381408.00, NOW()),
('SVC-001','CSM-C003','2025-03-01 08:00+07','2025-03-31 18:00+07',  5000000.00, NOW()),
('SVC-001','CSM-C004','2025-03-01 08:00+07','2025-03-31 18:00+07', 19799316.00, NOW()),
-- Bảo vệ
('SVC-002','CSM-C001','2025-03-01 00:00+07','2025-03-31 23:59+07',  4886684.00, NOW()),
('SVC-002','CSM-C002','2025-03-01 00:00+07','2025-03-31 23:59+07',  3828845.00, NOW()),
('SVC-002','CSM-C003','2025-03-01 00:00+07','2025-03-31 23:59+07',  3000000.00, NOW()),
('SVC-002','CSM-C004','2025-03-01 00:00+07','2025-03-31 23:59+07', 11879590.00, NOW()),
-- Bảo trì
('SVC-003','CSM-C001','2025-03-01 08:00+07','2025-03-31 18:00+07',  3257789.00, NOW()),
('SVC-003','CSM-C002','2025-03-01 08:00+07','2025-03-31 18:00+07',  2552563.00, NOW()),
('SVC-003','CSM-C003','2025-03-01 08:00+07','2025-03-31 18:00+07',  2000000.00, NOW()),
('SVC-003','CSM-C004','2025-03-01 08:00+07','2025-03-31 18:00+07',  7919726.00, NOW()),
-- Ăn uống (nhân viên, từng lượt)
('SVC-004','CSM-E001','2025-03-03 12:00+07','2025-03-03 12:30+07', 50000.00, NOW()),
('SVC-004','CSM-E001','2025-03-04 12:00+07','2025-03-04 12:30+07', 50000.00, NOW()),
('SVC-004','CSM-E001','2025-03-05 12:00+07','2025-03-05 12:30+07', 50000.00, NOW()),
('SVC-004','CSM-E002','2025-03-03 12:00+07','2025-03-03 12:30+07', 50000.00, NOW()),
('SVC-004','CSM-E002','2025-03-06 12:00+07','2025-03-06 12:30+07', 50000.00, NOW()),
('SVC-004','CSM-E003','2025-03-04 12:00+07','2025-03-04 12:30+07', 50000.00, NOW()),
('SVC-004','CSM-E004','2025-03-03 12:00+07','2025-03-03 12:30+07', 50000.00, NOW()),
('SVC-004','CSM-E004','2025-03-05 12:00+07','2025-03-05 12:30+07', 50000.00, NOW()),
('SVC-004','CSM-E005','2025-03-04 12:00+07','2025-03-04 12:30+07', 50000.00, NOW()),
('SVC-004','CSM-E006','2025-03-03 12:00+07','2025-03-03 12:30+07', 50000.00, NOW()),
('SVC-004','CSM-E007','2025-03-05 12:00+07','2025-03-05 12:30+07', 50000.00, NOW()),
('SVC-004','CSM-E008','2025-03-03 12:00+07','2025-03-03 12:30+07', 50000.00, NOW()),
('SVC-004','CSM-E009','2025-03-03 12:00+07','2025-03-03 12:30+07', 50000.00, NOW()),
('SVC-004','CSM-E010','2025-03-04 12:00+07','2025-03-04 12:30+07', 50000.00, NOW()),
('SVC-004','CSM-E011','2025-03-05 12:00+07','2025-03-05 12:30+07', 50000.00, NOW()),
('SVC-004','CSM-E012','2025-03-06 12:00+07','2025-03-06 12:30+07', 50000.00, NOW()),
-- Gửi xe ô tô
('SVC-005','CSM-E001','2025-03-03 08:00+07','2025-03-03 18:00+07', 200000.00, NOW()),
('SVC-005','CSM-E002','2025-03-03 08:00+07','2025-03-03 18:00+07', 200000.00, NOW()),
('SVC-005','CSM-E004','2025-03-03 08:00+07','2025-03-03 18:00+07', 200000.00, NOW()),
('SVC-005','CSM-E006','2025-03-04 08:00+07','2025-03-04 18:00+07', 200000.00, NOW()),
('SVC-005','CSM-E008','2025-03-03 08:00+07','2025-03-03 18:00+07', 200000.00, NOW()),
('SVC-005','CSM-E009','2025-03-04 08:00+07','2025-03-04 18:00+07', 200000.00, NOW()),
('SVC-005','CSM-E012','2025-03-05 08:00+07','2025-03-05 18:00+07', 200000.00, NOW()),
-- Gửi xe máy
('SVC-006','CSM-E003','2025-03-03 08:00+07','2025-03-03 18:00+07', 70000.00, NOW()),
('SVC-006','CSM-E005','2025-03-03 08:00+07','2025-03-03 18:00+07', 70000.00, NOW()),
('SVC-006','CSM-E007','2025-03-04 08:00+07','2025-03-04 18:00+07', 70000.00, NOW()),
('SVC-006','CSM-E010','2025-03-03 08:00+07','2025-03-03 18:00+07', 70000.00, NOW()),
('SVC-006','CSM-E011','2025-03-04 08:00+07','2025-03-04 18:00+07', 70000.00, NOW());

-- --- THÁNG 4/2025 ---
INSERT INTO usage_log (service_id, consumer_id, usage_start, usage_end, unit_price_snapshot, created_at) VALUES
-- Vệ sinh
('SVC-001','CSM-C001','2025-04-01 08:00+07','2025-04-30 18:00+07',  8144473.00, NOW()),
('SVC-001','CSM-C002','2025-04-01 08:00+07','2025-04-30 18:00+07',  6381408.00, NOW()),
('SVC-001','CSM-C003','2025-04-01 08:00+07','2025-04-30 18:00+07',  5000000.00, NOW()),
('SVC-001','CSM-C004','2025-04-01 08:00+07','2025-04-30 18:00+07', 19799316.00, NOW()),
-- Bảo vệ
('SVC-002','CSM-C001','2025-04-01 00:00+07','2025-04-30 23:59+07',  4886684.00, NOW()),
('SVC-002','CSM-C002','2025-04-01 00:00+07','2025-04-30 23:59+07',  3828845.00, NOW()),
('SVC-002','CSM-C003','2025-04-01 00:00+07','2025-04-30 23:59+07',  3000000.00, NOW()),
('SVC-002','CSM-C004','2025-04-01 00:00+07','2025-04-30 23:59+07', 11879590.00, NOW()),
-- Bảo trì
('SVC-003','CSM-C001','2025-04-01 08:00+07','2025-04-30 18:00+07',  3257789.00, NOW()),
('SVC-003','CSM-C002','2025-04-01 08:00+07','2025-04-30 18:00+07',  2552563.00, NOW()),
('SVC-003','CSM-C003','2025-04-01 08:00+07','2025-04-30 18:00+07',  2000000.00, NOW()),
('SVC-003','CSM-C004','2025-04-01 08:00+07','2025-04-30 18:00+07',  7919726.00, NOW()),
-- Ăn uống
('SVC-004','CSM-E001','2025-04-01 12:00+07','2025-04-01 12:30+07', 50000.00, NOW()),
('SVC-004','CSM-E001','2025-04-02 12:00+07','2025-04-02 12:30+07', 50000.00, NOW()),
('SVC-004','CSM-E002','2025-04-01 12:00+07','2025-04-01 12:30+07', 50000.00, NOW()),
('SVC-004','CSM-E003','2025-04-02 12:00+07','2025-04-02 12:30+07', 50000.00, NOW()),
('SVC-004','CSM-E004','2025-04-01 12:00+07','2025-04-01 12:30+07', 50000.00, NOW()),
('SVC-004','CSM-E005','2025-04-02 12:00+07','2025-04-02 12:30+07', 50000.00, NOW()),
('SVC-004','CSM-E006','2025-04-01 12:00+07','2025-04-01 12:30+07', 50000.00, NOW()),
('SVC-004','CSM-E007','2025-04-02 12:00+07','2025-04-02 12:30+07', 50000.00, NOW()),
('SVC-004','CSM-E008','2025-04-01 12:00+07','2025-04-01 12:30+07', 50000.00, NOW()),
('SVC-004','CSM-E009','2025-04-02 12:00+07','2025-04-02 12:30+07', 50000.00, NOW()),
('SVC-004','CSM-E010','2025-04-01 12:00+07','2025-04-01 12:30+07', 50000.00, NOW()),
('SVC-004','CSM-E011','2025-04-02 12:00+07','2025-04-02 12:30+07', 50000.00, NOW()),
('SVC-004','CSM-E012','2025-04-03 12:00+07','2025-04-03 12:30+07', 50000.00, NOW()),
-- Gửi xe ô tô
('SVC-005','CSM-E001','2025-04-01 08:00+07','2025-04-01 18:00+07', 200000.00, NOW()),
('SVC-005','CSM-E002','2025-04-02 08:00+07','2025-04-02 18:00+07', 200000.00, NOW()),
('SVC-005','CSM-E004','2025-04-01 08:00+07','2025-04-01 18:00+07', 200000.00, NOW()),
('SVC-005','CSM-E008','2025-04-01 08:00+07','2025-04-01 18:00+07', 200000.00, NOW()),
('SVC-005','CSM-E009','2025-04-02 08:00+07','2025-04-02 18:00+07', 200000.00, NOW()),
('SVC-005','CSM-E012','2025-04-03 08:00+07','2025-04-03 18:00+07', 200000.00, NOW()),
-- Gửi xe máy
('SVC-006','CSM-E003','2025-04-01 08:00+07','2025-04-01 18:00+07', 70000.00, NOW()),
('SVC-006','CSM-E005','2025-04-02 08:00+07','2025-04-02 18:00+07', 70000.00, NOW()),
('SVC-006','CSM-E007','2025-04-01 08:00+07','2025-04-01 18:00+07', 70000.00, NOW()),
('SVC-006','CSM-E010','2025-04-02 08:00+07','2025-04-02 18:00+07', 70000.00, NOW()),
('SVC-006','CSM-E011','2025-04-03 08:00+07','2025-04-03 18:00+07', 70000.00, NOW());

-- ============================================================
-- 11. INVOICE
-- Tổng tiền = tiền thuê mặt bằng + tiền dịch vụ
--
-- CMP-001 T3:
--   Thuê: 80×350k + 120×320k = 28,000,000 + 38,400,000 = 66,400,000
--   DV:   VS=8,144,473 + BV=4,886,684 + BT=3,257,789
--         + AU=(5 lượt×50k)=250,000 + GXo=(2×200k)=400,000 + GXm=(1×70k)=70,000
--   Tổng DV = 17,008,946 → Tổng hóa đơn = 83,408,946
--
-- CMP-002 T3:
--   Thuê: 150×310k = 46,500,000
--   DV:   VS=6,381,408 + BV=3,828,845 + BT=2,552,563
--         + AU=(3×50k)=150,000 + GXo=(1×200k)=200,000 + GXm=(1×70k)=70,000
--   Tổng DV = 13,182,816 → Tổng = 59,682,816
--
-- CMP-003 T3:
--   Thuê: 60×250k = 15,000,000
--   DV:   VS=5,000,000 + BV=3,000,000 + BT=2,000,000
--         + AU=(2×50k)=100,000 + GXo=(1×200k)=200,000 + GXm=(1×70k)=70,000
--   Tổng DV = 10,370,000 → Tổng = 25,370,000
--
-- CMP-004 T3:
--   Thuê: 200×300k + 180×290k = 60,000,000 + 52,200,000 = 112,200,000
--   DV:   VS=19,799,316 + BV=11,879,590 + BT=7,919,726
--         + AU=(5×50k)=250,000 + GXo=(3×200k)=600,000 + GXm=(2×70k)=140,000
--   Tổng DV = 40,588,632 → Tổng = 152,788,632
-- ============================================================
INSERT INTO invoice (invoice_id, company_id, billing_month, billing_year, invoice_date, due_date, total_amount, invoice_status, created_at) VALUES
('INV-2503-001','CMP-001', 3, 2025,'2025-03-31','2025-04-10',  83408946.00,'DaThanhToan',    NOW()),
('INV-2503-002','CMP-002', 3, 2025,'2025-03-31','2025-04-10',  59682816.00,'DaThanhToan',    NOW()),
('INV-2503-003','CMP-003', 3, 2025,'2025-03-31','2025-04-10',  25370000.00,'DaThanhToan',    NOW()),
('INV-2503-004','CMP-004', 3, 2025,'2025-03-31','2025-04-10', 152788632.00,'DaThanhToan',    NOW()),
('INV-2504-001','CMP-001', 4, 2025,'2025-04-30','2025-05-10',  83508946.00,'ChuaThanhToan',  NOW()),
('INV-2504-002','CMP-002', 4, 2025,'2025-04-30','2025-05-10',  59732816.00,'ChuaThanhToan',  NOW()),
('INV-2504-003','CMP-003', 4, 2025,'2025-04-30','2025-05-10',  25370000.00,'ChuaThanhToan',  NOW()),
('INV-2504-004','CMP-004', 4, 2025,'2025-04-30','2025-05-10', 153038632.00,'QuaHan',         NOW());

-- ============================================================
-- 12. INVOICE DETAIL
-- ============================================================

-- *** INV-2503-001 (CMP-001, T3) ***
INSERT INTO invoice_detail (invoice_id, detail_id, service_id, date, description, quantity, subtotal) VALUES
('INV-2503-001','DTL-01','SVC-001','2025-03-31','Tiền thuê VP OFF-001 (80m² × 350,000)',    80.00,  28000000.00),
('INV-2503-001','DTL-02','SVC-001','2025-03-31','Tiền thuê VP OFF-002 (120m² × 320,000)',  120.00,  38400000.00),
('INV-2503-001','DTL-03','SVC-001','2025-03-31','Vệ sinh T3 (10 bậc, 1.05^10 × 5tr)',       1.00,   8144473.00),
('INV-2503-001','DTL-04','SVC-002','2025-03-31','Bảo vệ T3 (10 bậc, 1.05^10 × 3tr)',        1.00,   4886684.00),
('INV-2503-001','DTL-05','SVC-003','2025-03-31','Bảo trì T3 (10 bậc, 1.05^10 × 2tr)',       1.00,   3257789.00),
('INV-2503-001','DTL-06','SVC-004','2025-03-31','Ăn uống T3 (5 lượt × 50,000)',              5.00,    250000.00),
('INV-2503-001','DTL-07','SVC-005','2025-03-31','Gửi xe ô tô T3 (2 lượt × 200,000)',         2.00,    400000.00),
('INV-2503-001','DTL-08','SVC-006','2025-03-31','Gửi xe máy T3 (1 lượt × 70,000)',           1.00,     70000.00);

-- *** INV-2503-002 (CMP-002, T3) ***
INSERT INTO invoice_detail (invoice_id, detail_id, service_id, date, description, quantity, subtotal) VALUES
('INV-2503-002','DTL-01','SVC-001','2025-03-31','Tiền thuê VP OFF-004 (150m² × 310,000)',  150.00,  46500000.00),
('INV-2503-002','DTL-02','SVC-001','2025-03-31','Vệ sinh T3 (5 bậc, 1.05^5 × 5tr)',         1.00,   6381408.00),
('INV-2503-002','DTL-03','SVC-002','2025-03-31','Bảo vệ T3 (5 bậc, 1.05^5 × 3tr)',          1.00,   3828845.00),
('INV-2503-002','DTL-04','SVC-003','2025-03-31','Bảo trì T3 (5 bậc, 1.05^5 × 2tr)',         1.00,   2552563.00),
('INV-2503-002','DTL-05','SVC-004','2025-03-31','Ăn uống T3 (3 lượt × 50,000)',              3.00,    150000.00),
('INV-2503-002','DTL-06','SVC-005','2025-03-31','Gửi xe ô tô T3 (1 lượt × 200,000)',         1.00,    200000.00),
('INV-2503-002','DTL-07','SVC-006','2025-03-31','Gửi xe máy T3 (1 lượt × 70,000)',           1.00,     70000.00);

-- *** INV-2503-003 (CMP-003, T3) ***
INSERT INTO invoice_detail (invoice_id, detail_id, service_id, date, description, quantity, subtotal) VALUES
('INV-2503-003','DTL-01','SVC-001','2025-03-31','Tiền thuê VP OFF-008 (60m² × 250,000)',    60.00,  15000000.00),
('INV-2503-003','DTL-02','SVC-001','2025-03-31','Vệ sinh T3 (0 bậc, giá base 5tr)',          1.00,   5000000.00),
('INV-2503-003','DTL-03','SVC-002','2025-03-31','Bảo vệ T3 (0 bậc, giá base 3tr)',           1.00,   3000000.00),
('INV-2503-003','DTL-04','SVC-003','2025-03-31','Bảo trì T3 (0 bậc, giá base 2tr)',          1.00,   2000000.00),
('INV-2503-003','DTL-05','SVC-004','2025-03-31','Ăn uống T3 (2 lượt × 50,000)',              2.00,    100000.00),
('INV-2503-003','DTL-06','SVC-005','2025-03-31','Gửi xe ô tô T3 (1 lượt × 200,000)',         1.00,    200000.00),
('INV-2503-003','DTL-07','SVC-006','2025-03-31','Gửi xe máy T3 (1 lượt × 70,000)',           1.00,     70000.00);

-- *** INV-2503-004 (CMP-004, T3) ***
INSERT INTO invoice_detail (invoice_id, detail_id, service_id, date, description, quantity, subtotal) VALUES
('INV-2503-004','DTL-01','SVC-001','2025-03-31','Tiền thuê VP OFF-003 (200m² × 300,000)',  200.00,  60000000.00),
('INV-2503-004','DTL-02','SVC-001','2025-03-31','Tiền thuê VP OFF-006 (180m² × 290,000)',  180.00,  52200000.00),
('INV-2503-004','DTL-03','SVC-001','2025-03-31','Vệ sinh T3 (28 bậc, 1.05^28 × 5tr)',       1.00,  19799316.00),
('INV-2503-004','DTL-04','SVC-002','2025-03-31','Bảo vệ T3 (28 bậc, 1.05^28 × 3tr)',        1.00,  11879590.00),
('INV-2503-004','DTL-05','SVC-003','2025-03-31','Bảo trì T3 (28 bậc, 1.05^28 × 2tr)',       1.00,   7919726.00),
('INV-2503-004','DTL-06','SVC-004','2025-03-31','Ăn uống T3 (5 lượt × 50,000)',              5.00,    250000.00),
('INV-2503-004','DTL-07','SVC-005','2025-03-31','Gửi xe ô tô T3 (3 lượt × 200,000)',         3.00,    600000.00),
('INV-2503-004','DTL-08','SVC-006','2025-03-31','Gửi xe máy T3 (2 lượt × 70,000)',           2.00,    140000.00);

-- *** INV-2504-001 (CMP-001, T4) ***
INSERT INTO invoice_detail (invoice_id, detail_id, service_id, date, description, quantity, subtotal) VALUES
('INV-2504-001','DTL-01','SVC-001','2025-04-30','Tiền thuê VP OFF-001 (80m² × 350,000)',    80.00,  28000000.00),
('INV-2504-001','DTL-02','SVC-001','2025-04-30','Tiền thuê VP OFF-002 (120m² × 320,000)',  120.00,  38400000.00),
('INV-2504-001','DTL-03','SVC-001','2025-04-30','Vệ sinh T4 (10 bậc)',                       1.00,   8144473.00),
('INV-2504-001','DTL-04','SVC-002','2025-04-30','Bảo vệ T4 (10 bậc)',                        1.00,   4886684.00),
('INV-2504-001','DTL-05','SVC-003','2025-04-30','Bảo trì T4 (10 bậc)',                       1.00,   3257789.00),
('INV-2504-001','DTL-06','SVC-004','2025-04-30','Ăn uống T4 (5 lượt × 50,000)',              5.00,    250000.00),
('INV-2504-001','DTL-07','SVC-005','2025-04-30','Gửi xe ô tô T4 (2 lượt × 200,000)',         2.00,    400000.00),
('INV-2504-001','DTL-08','SVC-006','2025-04-30','Gửi xe máy T4 (1 lượt × 70,000)',           1.00,     70000.00);

-- *** INV-2504-002 (CMP-002, T4) ***
INSERT INTO invoice_detail (invoice_id, detail_id, service_id, date, description, quantity, subtotal) VALUES
('INV-2504-002','DTL-01','SVC-001','2025-04-30','Tiền thuê VP OFF-004 (150m² × 310,000)',  150.00,  46500000.00),
('INV-2504-002','DTL-02','SVC-001','2025-04-30','Vệ sinh T4 (5 bậc)',                        1.00,   6381408.00),
('INV-2504-002','DTL-03','SVC-002','2025-04-30','Bảo vệ T4 (5 bậc)',                         1.00,   3828845.00),
('INV-2504-002','DTL-04','SVC-003','2025-04-30','Bảo trì T4 (5 bậc)',                        1.00,   2552563.00),
('INV-2504-002','DTL-05','SVC-004','2025-04-30','Ăn uống T4 (4 lượt × 50,000)',              4.00,    200000.00),
('INV-2504-002','DTL-06','SVC-005','2025-04-30','Gửi xe ô tô T4 (2 lượt × 200,000)',         2.00,    400000.00),
('INV-2504-002','DTL-07','SVC-006','2025-04-30','Gửi xe máy T4 (1 lượt × 70,000)',           1.00,     70000.00);

-- *** INV-2504-003 (CMP-003, T4) ***
INSERT INTO invoice_detail (invoice_id, detail_id, service_id, date, description, quantity, subtotal) VALUES
('INV-2504-003','DTL-01','SVC-001','2025-04-30','Tiền thuê VP OFF-008 (60m² × 250,000)',    60.00,  15000000.00),
('INV-2504-003','DTL-02','SVC-001','2025-04-30','Vệ sinh T4 (0 bậc)',                        1.00,   5000000.00),
('INV-2504-003','DTL-03','SVC-002','2025-04-30','Bảo vệ T4 (0 bậc)',                         1.00,   3000000.00),
('INV-2504-003','DTL-04','SVC-003','2025-04-30','Bảo trì T4 (0 bậc)',                        1.00,   2000000.00),
('INV-2504-003','DTL-05','SVC-004','2025-04-30','Ăn uống T4 (2 lượt × 50,000)',              2.00,    100000.00),
('INV-2504-003','DTL-06','SVC-005','2025-04-30','Gửi xe ô tô T4 (1 lượt × 200,000)',         1.00,    200000.00),
('INV-2504-003','DTL-07','SVC-006','2025-04-30','Gửi xe máy T4 (1 lượt × 70,000)',           1.00,     70000.00);

-- *** INV-2504-004 (CMP-004, T4) ***
INSERT INTO invoice_detail (invoice_id, detail_id, service_id, date, description, quantity, subtotal) VALUES
('INV-2504-004','DTL-01','SVC-001','2025-04-30','Tiền thuê VP OFF-003 (200m² × 300,000)',  200.00,  60000000.00),
('INV-2504-004','DTL-02','SVC-001','2025-04-30','Tiền thuê VP OFF-006 (180m² × 290,000)',  180.00,  52200000.00),
('INV-2504-004','DTL-03','SVC-001','2025-04-30','Vệ sinh T4 (28 bậc)',                       1.00,  19799316.00),
('INV-2504-004','DTL-04','SVC-002','2025-04-30','Bảo vệ T4 (28 bậc)',                        1.00,  11879590.00),
('INV-2504-004','DTL-05','SVC-003','2025-04-30','Bảo trì T4 (28 bậc)',                       1.00,   7919726.00),
('INV-2504-004','DTL-06','SVC-004','2025-04-30','Ăn uống T4 (6 lượt × 50,000)',              6.00,    300000.00),
('INV-2504-004','DTL-07','SVC-005','2025-04-30','Gửi xe ô tô T4 (3 lượt × 200,000)',         3.00,    600000.00),
('INV-2504-004','DTL-08','SVC-006','2025-04-30','Gửi xe máy T4 (2 lượt × 70,000)',           2.00,    140000.00);

-- ============================================================
-- 13. CẬP NHẬT DOANH THU DỊCH VỤ (thuộc tính phái sinh)
-- ============================================================
UPDATE service SET service_revenue = (
  SELECT COALESCE(SUM(d.subtotal), 0)
  FROM invoice_detail d
  WHERE d.service_id = service.service_id
);

-- ============================================================
-- 14. CẬP NHẬT LƯƠNG NHÂN VIÊN TOÀ NHÀ (thuộc tính phái sinh)
-- salary = base_salary + SUM(service_revenue × rate%)
-- ============================================================
UPDATE building_staff SET salary = (
  SELECT b.base_salary + COALESCE((
    SELECT SUM(s.service_revenue * wa.revenue_rate_share / 100)
    FROM work_assignment wa
    JOIN service s ON s.service_id = wa.service_id
    WHERE wa.staff_id = b.staff_id AND wa.year = 2025 AND wa.month = 4
  ), 0)
  FROM building_staff b WHERE b.staff_id = building_staff.staff_id
);

-- ============================================================
-- KIỂM TRA NHANH
-- ============================================================
SELECT invoice_id, company_id, billing_month, total_amount, invoice_status
FROM invoice ORDER BY billing_month, company_id;