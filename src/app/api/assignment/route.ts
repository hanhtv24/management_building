import { NextResponse } from 'next/server';
import { db } from '@/db';
import { eq, and } from 'drizzle-orm';

// 🚀 QUAN TRỌNG: Đã đổi 'staff' thành 'buildingStaff' cho khớp DB của bạn
import { workAssignment, buildingStaff, service } from '@/db/schema'; 

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    const data = await db
      .select({
        staffId: workAssignment.staffId,
        serviceId: workAssignment.serviceId,
        staffName: buildingStaff.fullName, 
        serviceName: service.serviceName,
        position: workAssignment.position, 
        revenueRateShare: workAssignment.revenueRateShare, 
        baseSalary: buildingStaff.baseSalary, 
      })
      .from(workAssignment)
      .leftJoin(buildingStaff, eq(workAssignment.staffId, buildingStaff.staffId))
      .leftJoin(service, eq(workAssignment.serviceId, service.serviceId))
      .where(and(eq(workAssignment.month, month), eq(workAssignment.year, year)));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    await db.insert(workAssignment).values({
      staffId: body.staffId,
      serviceId: body.serviceId,
      month: parseInt(body.month),
      year: parseInt(body.year),
      position: body.position, 
      revenueRateShare: body.revenueRateShare.toString(), 
    });
    
    return NextResponse.json({ success: true, message: "Phân công thành công!" });
  } catch (error: any) {
    console.error("POST Error:", error);
    return NextResponse.json({ success: false, message: "Lỗi: Nhân viên đã được phân công." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get('staffId');
    const serviceId = searchParams.get('serviceId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!staffId || !serviceId || !month || !year) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    await db.delete(workAssignment).where(
      and(
        eq(workAssignment.staffId, staffId),
        eq(workAssignment.serviceId, serviceId),
        eq(workAssignment.month, parseInt(month)),
        eq(workAssignment.year, parseInt(year))
      )
    );
    
    return NextResponse.json({ success: true, message: 'Đã xóa phân công' });
  } catch (error: any) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ success: false, message: 'Lỗi xóa phân công' }, { status: 500 });
  }
}