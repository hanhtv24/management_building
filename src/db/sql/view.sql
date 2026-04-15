-- 1. Xóa View cũ
DROP VIEW IF EXISTS view_loi_nhuan_toa_nha_hang_thang;

-- 2. Tạo mới lại với logic chuẩn cho Seed Data của bạn
CREATE VIEW view_loi_nhuan_toa_nha_hang_thang AS
WITH doanh_thu AS (
    SELECT 
        billing_month as thang,
        billing_year as nam,
        SUM(total_amount) as tong_doanh_thu
    FROM invoice
    -- Lưu ý: Kiểm tra xem Seed Data của bạn dùng 'DaThanhToan' hay 'Paid'
    WHERE invoice_status = 'DaThanhToan' 
    GROUP BY billing_year, billing_month
),
chi_phi AS (
    SELECT 
        wa.month as thang,
        wa.year as nam,
        SUM(CAST(bs.base_salary AS NUMERIC)) as tong_chi_phi
    FROM work_assignment wa
    JOIN building_staff bs ON wa.staff_id = bs.staff_id
    GROUP BY wa.year, wa.month
)
SELECT 
    CAST(COALESCE(d.nam, c.nam) AS INTEGER) as nam,
    CAST(COALESCE(d.thang, c.thang) AS INTEGER) as thang,
    CAST(COALESCE(d.tong_doanh_thu, 0) AS NUMERIC) as tong_doanh_thu,
    CAST(COALESCE(c.tong_chi_phi, 0) AS NUMERIC) as tong_chi_phi,
    CAST((COALESCE(d.tong_doanh_thu, 0) - COALESCE(c.tong_chi_phi, 0)) AS NUMERIC) as loi_nhuan
FROM doanh_thu d
FULL OUTER JOIN chi_phi c ON d.nam = c.nam AND d.thang = c.thang;


CREATE OR REPLACE VIEW view_chot_doanh_thu_chi_tiet AS
-- 1. Tiền thuê mặt bằng (Lấy từ hợp đồng có hiệu lực)
SELECT 
    cc.company_id,
    cc.office_id as service_id, 
    EXTRACT(MONTH FROM cc.start_date)::integer as thang,
    'Tiền thuê văn phòng ' || o.room as description,
    1 as quantity,
    cc.rent_price as subtotal
FROM company_contract cc
JOIN office o ON cc.office_id = o.office_id
WHERE cc.status = 'HieuLuc'

UNION ALL

-- 2. Tiền dịch vụ biến động (Ăn uống, gửi xe... đếm từ usage_log)
SELECT 
    c.company_id,
    ul.service_id,
    EXTRACT(MONTH FROM ul.usage_start)::integer as thang,
    s.service_name as description,
    COUNT(*)::integer as quantity, -- 🚀 ĐÃ SỬA: Dùng COUNT(*) thay vì log_id
    SUM(ul.unit_price_snapshot) as subtotal
FROM usage_log ul
JOIN service s ON ul.service_id = s.service_id
JOIN employee e ON ul.consumer_id = e.consumer_id 
JOIN company c ON e.company_id = c.company_id
GROUP BY c.company_id, ul.service_id, thang, s.service_name;



-- Cập nhật năm cho hóa đơn
UPDATE invoice SET billing_year = 2026 WHERE billing_year = 2025;
UPDATE invoice SET created_at = created_at + interval '1 year' WHERE EXTRACT(YEAR FROM created_at) = 2025;

-- Cập nhật năm cho phân công công việc
UPDATE work_assignment SET year = 2026 WHERE year = 2025;


-- 1. Cập nhật Hợp đồng (Để các văn phòng đều đang trong trạng thái HieuLuc vào năm 2026)
UPDATE company_contract 
SET start_date = '2026-01-01', 
    end_date = '2027-12-31';

-- 2. Cập nhật Nhật ký sử dụng dịch vụ (Usage Log)
-- Chuyển toàn bộ nhật ký từ năm 2025 sang 2026
UPDATE usage_log 
SET usage_start = usage_start + interval '1 year',
    usage_end = usage_end + interval '1 year'
WHERE EXTRACT(YEAR FROM usage_start) = 2025;

-- 3. Cập nhật Phân công công việc (Work Assignment) - Quyết định CHI PHÍ lương trên biểu đồ
UPDATE work_assignment 
SET year = 2026 
WHERE year = 2025;

-- 4. Cập nhật Hóa đơn (Invoice) - Quyết định DOANH THU trên biểu đồ
-- Chuyển năm 2025 thành 2026
UPDATE invoice 
SET billing_year = 2026 
WHERE billing_year = 2025;

-- Đảm bảo created_at của hóa đơn cũng rơi vào năm 2026
UPDATE invoice 
SET created_at = created_at + interval '1 year'
WHERE EXTRACT(YEAR FROM created_at) = 2025;

-- 5. CHỐT DOANH THU: Để các hóa đơn tháng 3 và 4 năm 2026 thành 'DaThanhToan'
-- (Nếu không cập nhật cái này, biểu đồ sẽ vẫn hiện doanh thu bằng 0)
UPDATE invoice 
SET invoice_status = 'DaThanhToan' 
WHERE billing_month IN (3, 4) AND billing_year = 2026;

-- 6. Cập nhật lại các thuộc tính phái sinh (Dòng này giúp đồng bộ tiền lương và doanh thu dịch vụ)
UPDATE service SET service_revenue = (
  SELECT COALESCE(SUM(id.subtotal), 0)
  FROM invoice_detail id
  WHERE id.service_id = service.service_id
);

UPDATE building_staff SET salary = (
  SELECT bs.base_salary + COALESCE(
    (SELECT SUM(s.service_revenue * wa.revenue_rate_share / 100)
     FROM work_assignment wa
     JOIN service s ON s.service_id = wa.service_id
     WHERE wa.staff_id = bs.staff_id AND wa.year = 2026 AND wa.month IN (3, 4)),
    0)
  FROM building_staff bs WHERE bs.staff_id = building_staff.staff_id
);


CREATE OR REPLACE VIEW view_dashboard_kpi AS
WITH DienTich AS (
    -- Tính tổng diện tích toàn bộ tòa nhà
    SELECT COALESCE(SUM(area), 1) AS tong_dien_tich FROM office
),
ChoThue AS (
    -- Tính tổng diện tích đang được thuê (Hợp đồng có hiệu lực)
    SELECT COALESCE(SUM(o.area), 0) AS dien_tich_cho_thue 
    FROM company_contract cc 
    JOIN office o ON cc.office_id = o.office_id 
    WHERE cc.status = 'HieuLuc'
),
KhachHang AS (
    -- Đếm số lượng công ty đang thuê
    SELECT COUNT(DISTINCT company_id) AS so_khach_thue
    FROM company_contract
    WHERE status = 'HieuLuc'
)
SELECT 
    d.tong_dien_tich,
    c.dien_tich_cho_thue,
    -- Tính % lấp đầy làm tròn 2 chữ số
    ROUND((c.dien_tich_cho_thue / d.tong_dien_tich) * 100, 2) AS ti_le_lap_day,
    k.so_khach_thue
FROM DienTich d, ChoThue c, KhachHang k;


CREATE OR REPLACE VIEW view_thong_bao_he_thong AS
SELECT 
    c.company_name,
    o.room,
    cc.end_date,
    -- Tính số ngày còn lại
    (cc.end_date - CURRENT_DATE) AS so_ngay_con_lai
FROM company_contract cc
JOIN company c ON cc.company_id = c.company_id
JOIN office o ON cc.office_id = o.office_id
WHERE cc.status = 'HieuLuc' 
  -- Lọc các hợp đồng sẽ hết hạn trong 30 ngày tới
  AND (cc.end_date - CURRENT_DATE) <= 30 
  AND (cc.end_date - CURRENT_DATE) >= 0
ORDER BY so_ngay_con_lai ASC;



-- 1. Tạo hàm tính toán tự động
CREATE OR REPLACE FUNCTION update_total_rent_area()
RETURNS TRIGGER AS $$
BEGIN
    -- Cập nhật lại total_rent_area cho công ty bị ảnh hưởng
    -- (Dùng NEW.company_id nếu là lệnh INSERT/UPDATE, OLD.company_id nếu là DELETE)
    UPDATE company
    SET total_rent_area = (
        SELECT COALESCE(SUM(o.area), 0)
        FROM company_contract cc
        JOIN office o ON cc.office_id = o.office_id
        WHERE cc.company_id = COALESCE(NEW.company_id, OLD.company_id) 
          AND cc.status = 'HieuLuc'
    )
    WHERE company_id = COALESCE(NEW.company_id, OLD.company_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Gắn Trigger vào bảng company_contract
CREATE TRIGGER trg_update_company_area
AFTER INSERT OR UPDATE OR DELETE ON company_contract
FOR EACH ROW
EXECUTE FUNCTION update_total_rent_area();