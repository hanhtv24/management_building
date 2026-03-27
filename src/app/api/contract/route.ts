import { NextResponse } from 'next/server';
import { db } from '@/db'; 
import { contract, company } from '@/db/schema'; // Nhớ ktra đường dẫn schema
import { eq, sql, desc, and } from 'drizzle-orm';

export async function GET() {
  try {
    const data = await db
      .select({
        // Tạo ID ảo gộp 3 trường để Frontend làm key (Vì khóa chính là composite key)
        contractId: sql`concat(${contract.companyId}, '|', ${contract.officeId}, '|', ${contract.startDate})`.as('contractId'),
        companyId: contract.companyId,
        companyName: company.companyName, 
        officeId: contract.officeId,
        startDate: contract.startDate,
        endDate: contract.endDate,
        rentPrice: contract.rentPrice,
        status: contract.status,
      })
      .from(contract)
      .leftJoin(company, eq(contract.companyId, company.companyId))
      .where(sql`${contract.deletedAt} IS NULL`)
      .orderBy(desc(contract.createdAt));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Lỗi GET hợp đồng:', error);
    return NextResponse.json({ success: false, message: 'Lỗi máy chủ khi lấy dữ liệu' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (!body.companyId || !body.officeId || !body.startDate || !body.rentPrice) {
      return NextResponse.json({ success: false, message: 'Vui lòng điền đủ thông tin bắt buộc!' }, { status: 400 });
    }

    await db.insert(contract).values({
      companyId: body.companyId,
      officeId: body.officeId,
      startDate: body.startDate, 
      endDate: body.endDate || null, 
      rentPrice: body.rentPrice.toString(), // Đảm bảo lưu numeric dưới dạng chuỗi
      status: body.status || 'HieuLuc',
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Ký hợp đồng thành công! Diện tích công ty đã được cập nhật.' 
    });
  } catch (error: any) {
    console.error('Lỗi ký hợp đồng:', error);
    
    // Bắt lỗi từ Trigger DB (Nếu bạn đã viết trigger)
    if (error.message && error.message.includes('đang được một công ty khác thuê')) {
      return NextResponse.json({ success: false, message: 'Văn phòng này đã có người thuê trong khoảng thời gian này!' }, { status: 409 });
    }
    // Bắt lỗi trùng lặp khóa chính
    if (error.code === '23505') {
        return NextResponse.json({ success: false, message: 'Hợp đồng này đã tồn tại trên hệ thống!' }, { status: 409 });
    }

    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const compId = searchParams.get('companyId');
    const offId = searchParams.get('officeId');
    const sDate = searchParams.get('startDate');

    if (!compId || !offId || !sDate) {
      return NextResponse.json({ success: false, message: 'Thiếu thông tin khóa để xóa' }, { status: 400 });
    }

    // Xóa mềm bằng cách update deletedAt
    await db.update(contract)
      .set({ deletedAt: new Date() })
      .where(and(
        eq(contract.companyId, compId),
        eq(contract.officeId, offId),
        eq(contract.startDate, sDate)
      ));

    return NextResponse.json({ success: true, message: 'Đã hủy hợp đồng thành công!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Lỗi khi xóa: ' + error.message }, { status: 500 });
  }
}