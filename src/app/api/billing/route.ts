import { NextResponse } from 'next/server';
import { db } from '@/db';
import { invoice, invoiceDetail, company } from '@/db/schema'; // Nhớ ktra đường dẫn schema
import { eq, sql, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const data = await db
      .select({
        invoiceId: invoice.invoiceId,
        companyId: invoice.companyId,
        companyName: company.companyName, // Join lấy tên công ty
        billingMonth: invoice.billingMonth,
        billingYear: invoice.billingYear,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        totalAmount: invoice.totalAmount,
        invoiceStatus: invoice.invoiceStatus,
      })
      .from(invoice)
      .leftJoin(company, eq(invoice.companyId, company.companyId))
      .where(sql`${invoice.deletedAt} IS NULL`)
      .orderBy(desc(invoice.createdAt));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Lỗi GET Invoice:', error);
    return NextResponse.json({ success: false, message: 'Lỗi lấy dữ liệu hóa đơn' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { companyId, billingMonth, billingYear, invoiceDate, dueDate, items } = body;

    if (!companyId || !billingMonth || !billingYear || !invoiceDate || !dueDate || !items || items.length === 0) {
        return NextResponse.json({ success: false, message: 'Vui lòng nhập thông tin và ít nhất 1 dịch vụ' }, { status: 400 });
    }

    // 1. Tự động tính lại Tổng tiền từ danh sách chi tiết (Để chống hack sửa giá từ Frontend)
    let calculatedTotal = 0;
    items.forEach((item: any) => {
        calculatedTotal += Number(item.subtotal);
    });

    const newInvoiceId = `INV-${billingYear}${billingMonth.toString().padStart(2, '0')}-${Math.floor(Date.now() / 1000)}`;

    // 2. 🚀 SỬ DỤNG TRANSACTION: Lưu Master và Detail cùng lúc
    await db.transaction(async (tx) => {
        // Bước A: Lưu Hóa đơn gốc (Master)
        await tx.insert(invoice).values({
            invoiceId: newInvoiceId,
            companyId,
            billingMonth: parseInt(billingMonth),
            billingYear: parseInt(billingYear),
            invoiceDate,
            dueDate,
            totalAmount: calculatedTotal.toString(), // Lưu tổng tiền đã tính
            invoiceStatus: 'ChuaThanhToan', 
        });

        // Bước B: Lưu từng dòng Chi tiết hóa đơn (Detail)
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            await tx.insert(invoiceDetail).values({
                invoiceId: newInvoiceId,
                detailId: `DTL_${i + 1}`, // Đánh số thứ tự 1, 2, 3...
                serviceId: item.serviceId,
                date: invoiceDate, // Lấy ngày xuất HĐ làm ngày ghi nhận dịch vụ
                description: item.description || '',
                quantity: item.quantity.toString(),
                subtotal: item.subtotal.toString(),
            });
        }
    });

    return NextResponse.json({ success: true, message: 'Phát hành hóa đơn thành công' });
  } catch (error: any) {
    console.error("Lỗi POST Invoice:", error);
    return NextResponse.json({ success: false, message: "Lỗi lưu dữ liệu: " + error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { invoiceId, invoiceStatus } = body;

    // API này chủ yếu dùng để Cập nhật trạng thái thanh toán
    await db.update(invoice)
      .set({ invoiceStatus })
      .where(eq(invoice.invoiceId, invoiceId));

    return NextResponse.json({ success: true, message: 'Cập nhật trạng thái thành công' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Lỗi cập nhật: " + error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false }, { status: 400 });

  await db.update(invoice).set({ deletedAt: new Date() }).where(eq(invoice.invoiceId, id));
  return NextResponse.json({ success: true, message: 'Đã hủy hóa đơn' });
}