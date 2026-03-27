import { NextResponse } from 'next/server';
import { db } from '@/db';
// 1. IMPORT ĐÚNG TÊN BIẾN TỪ SCHEMA
import { buildingStaff } from '@/db/schema/staff.schema'; // Nhớ sửa lại đường dẫn nếu cần
import { eq, sql, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const data = await db.select()
      .from(buildingStaff)
      .where(sql`${buildingStaff.deletedAt} IS NULL`)
      .orderBy(desc(buildingStaff.createdAt));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi lấy dữ liệu' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { staffId, fullName, dob, gender, phone, role, baseSalary } = body;

    // 2. XỬ LÝ TÁCH TÊN (Vì firstName và lastName bắt buộc NotNull)
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts.pop() || ''; // Chữ cuối cùng là Tên
    const lastName = nameParts.join(' ') || firstName; // Phần còn lại là Họ đệm

    // Kiểm tra tồn tại
    const existing = await db.select().from(buildingStaff).where(eq(buildingStaff.staffId, staffId)).limit(1);
    if (existing.length > 0) {
      const isDeleted = existing[0].deletedAt !== null;
      return NextResponse.json({ 
          success: false, 
          message: isDeleted ? `Mã NV ${staffId} đã tồn tại và bị xóa.` : `Mã NV ${staffId} đang được sử dụng!` 
      }, { status: 400 });
    }

    // 3. INSERT VÀO DB VỚI ĐÚNG ĐỊNH DẠNG
    await db.insert(buildingStaff).values({
      staffId,
      firstName,
      lastName,
      fullName,
      dob, // Dạng chuỗi YYYY-MM-DD
      gender, // Phải khớp với genderEnum (VD: 'Male', 'Female' hoặc 'Nam', 'Nữ')
      phone: [phone], // Bọc vào mảng theo định nghĩa .array()
      role: [role || 'NhanVien'], // Bọc vào mảng theo định nghĩa .array()
      baseSalary: baseSalary.toString(), // numeric ép về chuỗi
    });

    return NextResponse.json({ success: true, message: 'Thêm nhân viên thành công' });
  } catch (error: any) {
    console.error("Lỗi POST Staff:", error);
    let safeMessage = "Lỗi hệ thống. Không thể lưu dữ liệu.";
    if (error.code === '23505') safeMessage = "Mã nhân viên đã tồn tại.";
    
    // Log thêm chi tiết lỗi để bạn dễ debug nếu sai enum
    return NextResponse.json({ success: false, message: `${safeMessage} Chi tiết: ${error.message}` }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { staffId, createdAt, updatedAt, deletedAt, ...updateData } = body;

    // Tách tên lại nếu người dùng đổi FullName
    if (updateData.fullName) {
        const nameParts = updateData.fullName.trim().split(' ');
        updateData.firstName = nameParts.pop() || '';
        updateData.lastName = nameParts.join(' ') || updateData.firstName;
    }

    await db.update(buildingStaff)
      .set({
          ...updateData,
          phone: Array.isArray(updateData.phone) ? updateData.phone : [updateData.phone],
          role: Array.isArray(updateData.role) ? updateData.role : [updateData.role],
          baseSalary: updateData.baseSalary ? updateData.baseSalary.toString() : undefined
      })
      .where(eq(buildingStaff.staffId, staffId));

    return NextResponse.json({ success: true, message: 'Cập nhật thành công' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Lỗi cập nhật: " + error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false }, { status: 400 });

  await db.update(buildingStaff).set({ deletedAt: new Date() }).where(eq(buildingStaff.staffId, id));
  return NextResponse.json({ success: true, message: 'Đã xóa nhân viên' });
}