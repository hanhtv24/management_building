import { NextResponse } from 'next/server';
import { db } from '@/db';
import { office } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

// 1. LẤY DANH SÁCH
export async function GET() {
  const data = await db.select().from(office).where(sql`${office.deletedAt} IS NULL`);
  return NextResponse.json({ success: true, data });
}

// 2. THÊM MỚI
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Đảm bảo bóc tách đúng tên và gán đúng cột
    const { officeId, floor, room, area, unitPrice, location } = body;

    await db.insert(office).values({
      officeId: officeId,
      floor: parseInt(floor),
      room: room,
      area: area.toString(),      // Gán đúng vào diện tích
      unitPrice: unitPrice.toString(), // Gán đúng vào đơn giá
      location: location || "",    // Thêm trường location nếu db yêu cầu, hoặc để trống
    });

    return NextResponse.json({ success: true, message: 'Thêm văn phòng thành công' });
  } catch (error: any) {
    console.error("Lỗi chi tiết:", error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Lỗi truy vấn Database" 
    }, { status: 500 });
  }
}

// 3. CHỈNH SỬA
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    // QUAN TRỌNG: Loại bỏ hoàn toàn các trường ngày tháng khỏi updateData
    const { officeId, createdAt, updatedAt, deletedAt, ...updateData } = body;

    await db.update(office)
      .set({
        floor: parseInt(updateData.floor),
        room: updateData.room,
        area: updateData.area.toString(),
        unitPrice: updateData.unitPrice.toString(),
        // Không đưa các trường ngày tháng vào đây
      })
      .where(eq(office.officeId, officeId));

    return NextResponse.json({ success: true, message: 'Cập nhật thành công' });
  } catch (error: any) {
    console.error("Lỗi PUT:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 4. XÓA (Soft Delete)
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false }, { status: 400 });
  
  // Thay vì xóa hẳn, ta update ngày xóa để giữ lịch sử
  await db.update(office).set({ deletedAt: new Date() }).where(eq(office.officeId, id));
  return NextResponse.json({ success: true, message: 'Đã xóa văn phòng' });
}