import { NextResponse } from 'next/server';
import { db } from '@/db';
import { company, serviceConsumer } from '@/db/schema';
import { eq, sql, desc } from 'drizzle-orm';
// Dùng crypto có sẵn của Node.js để tạo chuỗi ngẫu nhiên
import { randomBytes } from 'crypto';

export async function GET() {
  try {
    const data = await db.select()
      .from(company)
      .where(sql`${company.deletedAt} IS NULL`)
      .orderBy(desc(company.createdAt));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { companyId, companyName, taxCode, phoneNo, email } = body;
    const newConsumerId = `CON_${require('crypto').randomBytes(4).toString('hex')}`;

    const existingCompany = await db.select().from(company).where(eq(company.companyId, companyId)).limit(1);

    if (existingCompany.length > 0) {
      const comp = existingCompany[0];
      if (comp.deletedAt) {
        return NextResponse.json({
          success: false,
          message: `Mã công ty ${companyId} đã từng tồn tại và bị xóa. Vui lòng dùng mã khác hoặc liên hệ Admin để khôi phục!`
        }, { status: 400 });
      } else {
        return NextResponse.json({
          success: false,
          message: `Mã công ty ${companyId} đang được sử dụng. Vui lòng chọn mã khác!`
        }, { status: 400 });
      }
    }

    await db.insert(serviceConsumer).values({
      consumerId: newConsumerId,
      consumerType: 'Company'
    }).onConflictDoNothing();

    await db.insert(company).values({
      consumerId: newConsumerId,
      companyId,
      companyName,
      taxCode,
      phoneNo: [phoneNo],
      email,
      totalRentArea: "0" // Thử truyền số 0 thay vì chuỗi "0"
    });

    return NextResponse.json({ success: true, message: 'Thêm công ty thành công' });
  } catch (error: any) {
    console.error("Lỗi Server:", error); // Chỉ in log ở server để dev xem

    // 🚀 LÀM SẠCH THÔNG BÁO LỖI TRƯỚC KHI GỬI VỀ CLIENT
    let safeMessage = "Không thể lưu dữ liệu. Vui lòng kiểm tra lại định dạng các ô nhập liệu.";

    if (error.code === '23505' || (error.message && error.message.includes('duplicate key'))) {
      safeMessage = 'Mã công ty, Mã số thuế hoặc Email này đã được sử dụng!';
    } else if (error.message && error.message.includes('too long')) {
      safeMessage = 'Dữ liệu nhập vào quá dài (Ví dụ: Mã số thuế vượt quá số ký tự cho phép).';
    }

    // Trả về câu thông báo đã làm sạch, tuyệt đối không trả error.message
    return NextResponse.json({ success: false, message: safeMessage }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    // Bóc tách để loại bỏ các trường ngày tháng gây lỗi toISOString
    const { consumerId, createdAt, updatedAt, deletedAt, ...updateData } = body;

    await db.update(company)
      .set({
        companyId: updateData.companyId,
        companyName: updateData.companyName,
        taxCode: updateData.taxCode,
        phoneNo: Array.isArray(updateData.phoneNo) ? updateData.phoneNo : [updateData.phoneNo],
        email: updateData.email,
      })
      .where(eq(company.consumerId, consumerId));

    return NextResponse.json({ success: true, message: 'Cập nhật thành công' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false }, { status: 400 });

  await db.update(company).set({ deletedAt: new Date() }).where(eq(company.consumerId, id));
  return NextResponse.json({ success: true, message: 'Đã xóa công ty' });
}