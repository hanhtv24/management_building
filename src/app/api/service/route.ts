import { NextResponse } from 'next/server';
import { db } from '@/db';
import { service, pricingPolicy } from '@/db/schema/service.schema'; // Nhớ sửa lại tên import nếu cần
import { eq, sql, desc } from 'drizzle-orm';

export async function GET() {
  try {
    // 1. Lấy tất cả dịch vụ
    const services = await db.select().from(service)
      .where(sql`${service.deletedAt} IS NULL`)
      .orderBy(desc(service.createdAt));

    // 2. Lấy giá cơ bản (basePrice) từ bảng pricingPolicy cho mỗi dịch vụ
    const policies = await db.select().from(pricingPolicy);
    
    // Gộp dữ liệu: Trả về cho UI mảng services kèm theo basePrice
    const data = services.map(svc => {
      const policy = policies.find(p => p.serviceId === svc.serviceId);
      return {
        ...svc,
        basePrice: policy ? policy.basePrice : '0', // Nối giá vào để UI hiển thị
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi lấy dữ liệu dịch vụ' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { serviceId, serviceName, serviceType, unitMeasurement, basePrice } = body;

    const existing = await db.select().from(service).where(eq(service.serviceId, serviceId)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ success: false, message: `Mã dịch vụ ${serviceId} đã tồn tại!` }, { status: 400 });
    }

    // 🚀 SỬ DỤNG TRANSACTION: Đảm bảo cả Service và Policy đều được lưu, lỗi 1 cái là hoàn tác hết
    await db.transaction(async (tx) => {
        // 1. Lưu vào bảng Service
        await tx.insert(service).values({
            serviceId,
            serviceName,
            serviceType,
            unitMeasurement,
            serviceRevenue: "0" // Mặc định 0
        });

        // 2. Lưu giá cơ bản vào bảng PricingPolicy (Supertype)
        // Tạo policyId ngẫu nhiên hoặc nối từ serviceId
        const policyId = `POL_${serviceId}`; 
        await tx.insert(pricingPolicy).values({
            serviceId,
            policyId,
            basePrice: basePrice.toString(),
            increasePercentage: "0.00", // Mặc định 0%
            policyType: 'DEFAULT' // Loại mặc định, bạn có thể chỉnh sau
        });
    });

    return NextResponse.json({ success: true, message: 'Thêm dịch vụ thành công' });
  } catch (error: any) {
    console.error("Lỗi POST Service:", error);
    return NextResponse.json({ success: false, message: "Lỗi lưu dữ liệu: " + error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { serviceId, serviceName, serviceType, unitMeasurement, basePrice } = body;

    await db.transaction(async (tx) => {
        // 1. Cập nhật bảng Service
        await tx.update(service).set({ serviceName, serviceType, unitMeasurement }).where(eq(service.serviceId, serviceId));
        
        // 2. Cập nhật bảng Giá (Nếu tồn tại)
        await tx.update(pricingPolicy).set({ basePrice: basePrice.toString() }).where(eq(pricingPolicy.serviceId, serviceId));
    });

    return NextResponse.json({ success: true, message: 'Cập nhật dịch vụ thành công' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Lỗi cập nhật: " + error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false }, { status: 400 });

  await db.update(service).set({ deletedAt: new Date() }).where(eq(service.serviceId, id));
  return NextResponse.json({ success: true, message: 'Đã xóa dịch vụ' });
}