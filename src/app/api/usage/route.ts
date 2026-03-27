import { NextResponse } from 'next/server';
import { db } from '@/db';
import { usageLog, company, service, contract, serviceConsumer } from '@/db/schema'; // 🚀 Nhớ import serviceConsumer
import { eq, sql, desc, and } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || (new Date().getMonth() + 1).toString();
    const year = searchParams.get('year') || new Date().getFullYear().toString();

    // 1. Lấy tất cả Nhật ký sử dụng (Usage Logs)
    const logs = await db
      .select({
        serviceId: usageLog.serviceId,
        consumerId: usageLog.consumerId,
        usageStart: usageLog.usageStart,
        usageEnd: usageLog.usageEnd,
        unitPriceSnapshot: usageLog.unitPriceSnapshot,
        serviceName: service.serviceName,
        serviceType: service.serviceType,
        companyName: company.companyName,
      })
      .from(usageLog)
      .leftJoin(service, eq(usageLog.serviceId, service.serviceId))
      .leftJoin(company, eq(usageLog.consumerId, company.companyId))
      .where(sql`EXTRACT(MONTH FROM ${usageLog.usageStart}) = ${month} AND EXTRACT(YEAR FROM ${usageLog.usageStart}) = ${year}`)
      .orderBy(desc(usageLog.usageStart));

    // 2. Lấy dữ liệu Công ty và Hợp đồng
    const contracts = await db
      .select({
        companyId: contract.companyId,
        companyName: company.companyName,
        totalRentArea: company.totalRentArea,
        rentPrice: contract.rentPrice,
      })
      .from(contract)
      .leftJoin(company, eq(contract.companyId, company.companyId))
      .where(sql`${contract.deletedAt} IS NULL`);

    // 3. TỔNG HỢP BÁO CÁO
    const reportMap = new Map();

    contracts.forEach((ct: any) => {
      const area = Number(ct.totalRentArea || 0);
      const price = Number(ct.rentPrice || 0);
      const rentTotal = area * price;

      reportMap.set(ct.companyId, {
        companyId: ct.companyId,
        companyName: ct.companyName,
        rentDetail: `${area} m² x ${price.toLocaleString()} đ`,
        rentTotal: rentTotal,
        servicesTotal: 0,
        serviceDetails: [],
        grandTotal: rentTotal
      });
    });

    logs.forEach((log: any) => {
      if (reportMap.has(log.consumerId)) {
        const compReport = reportMap.get(log.consumerId);
        const cost = Number(log.unitPriceSnapshot);
        compReport.servicesTotal += cost;
        compReport.grandTotal += cost;
        compReport.serviceDetails.push({
          serviceName: log.serviceName,
          serviceType: log.serviceType,
          date: log.usageStart,
          cost: cost
        });
      }
    });

    const reportData = Array.from(reportMap.values())
      .sort((a, b) => b.grandTotal - a.grandTotal);

    return NextResponse.json({ success: true, logs, reportData });
  } catch (error: any) {
    console.error("Lỗi GET Usage:", error);
    return NextResponse.json({ success: false, message: 'Lỗi server' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { consumerId, serviceId, usageStart, usageEnd, unitPriceSnapshot } = body;

    // 🚀 SỬ DỤNG TRANSACTION ĐỂ FIX LỖI KHÓA NGOẠI TỰ ĐỘNG
    await db.transaction(async (tx) => {
        // Kiểm tra xem công ty này đã có trong bảng service_consumer chưa
        const existingConsumer = await tx.select()
            .from(serviceConsumer)
            .where(eq(serviceConsumer.consumerId, consumerId))
            .limit(1);

        // Nếu chưa có (Lỗi bạn gặp), hệ thống tự động chèn vào cho bạn
        if (existingConsumer.length === 0) {
            await tx.insert(serviceConsumer).values({
                consumerId: consumerId,
                consumerType: 'Company' // Mặc định là công ty
            });
        }

        // Sau đó mới chèn nhật ký sử dụng
        await tx.insert(usageLog).values({
            consumerId,
            serviceId,
            usageStart: new Date(usageStart),
            usageEnd: usageEnd ? new Date(usageEnd) : null,
            unitPriceSnapshot: unitPriceSnapshot.toString(),
        });
    });

    return NextResponse.json({ success: true, message: 'Ghi nhận thành công!' });
  } catch (error: any) {
    console.error("Lỗi POST Usage:", error);
    let message = "Lỗi hệ thống khi ghi nhận.";
    if (error.code === '23505') message = "Bản ghi này đã tồn tại (Trùng thời gian/dịch vụ).";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sId = searchParams.get('serviceId');
    const cId = searchParams.get('consumerId');
    const uStart = searchParams.get('usageStart');

    if (!sId || !cId || !uStart) return NextResponse.json({ success: false }, { status: 400 });

    await db.delete(usageLog).where(and(
      eq(usageLog.serviceId, sId),
      eq(usageLog.consumerId, cId),
      eq(usageLog.usageStart, new Date(uStart))
    ));
    return NextResponse.json({ success: true, message: 'Đã xóa bản ghi' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Lỗi xóa' }, { status: 500 });
  }
}