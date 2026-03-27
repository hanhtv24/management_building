import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get('year') || '2026');

    // Lấy dữ liệu thực tế từ View
    const result = await db.execute(
      sql`SELECT * FROM view_loi_nhuan_toa_nha_hang_thang WHERE nam = ${year} ORDER BY thang ASC` as any
    );
    
    const rawData = result.rows as any[];
    
    // Tạo mảng 12 tháng đầy đủ để biểu đồ luôn đẹp (fill 0 nếu tháng đó chưa có dữ liệu)
    const fullYearData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthData = rawData.find(d => Number(d.thang) === month);
      
      return monthData ? {
        thang: month,
        nam: year,
        tong_doanh_thu: Number(monthData.tong_doanh_thu),
        tong_chi_phi: Number(monthData.tong_chi_phi),
        loi_nhuan: Number(monthData.loi_nhuan)
      } : {
        thang: month,
        nam: year,
        tong_doanh_thu: 0,
        tong_chi_phi: 0,
        loi_nhuan: 0
      };
    });

    return NextResponse.json({ success: true, data: fullYearData });
  } catch (error) {
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}