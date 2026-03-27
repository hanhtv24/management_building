'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody } from '@heroui/react';
import { IconBuilding, IconUsers, IconReceipt2, IconChartLine, IconArrowUpRight } from '@tabler/icons-react';

export default function Dashboard() {
  // 🚀 Thêm state để quản lý thời gian, tránh lỗi Hydration
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    // Chỉ lấy thời gian khi chạy ở Client
    setCurrentTime(new Date().toLocaleTimeString('vi-VN'));
  }, []);

  const summary = [
    { label: 'Tỉ lệ lấp đầy', value: '85%', icon: <IconBuilding />, color: 'text-blue-500', trend: '+2%' },
    { label: 'Khách thuê mới', value: '03', icon: <IconUsers />, color: 'text-green-500', trend: 'Tháng này' },
    { label: 'Doanh thu dự kiến', value: '1.2B', icon: <IconReceipt2 />, color: 'text-orange-500', trend: 'VNĐ' },
    { label: 'Lợi nhuận ròng', value: '450M', icon: <IconChartLine />, color: 'text-purple-500', trend: '+5.2%' },
  ];

  return (
    <div className="p-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800 dark:text-white">Hệ thống Quản lý Tòa nhà</h1>
        <p className="text-sm text-neutral-500 italic">
          Chào mừng bạn trở lại, dữ liệu được cập nhật từ PostgreSQL lúc {currentTime}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.map((item, i) => (
          <Card key={i} className="border-none shadow-sm bg-neutral-50 dark:bg-neutral-900/50">
            <CardBody className="flex flex-row items-center justify-between p-5">
              <div className="flex flex-row items-center gap-4">
                <div className={`p-3 rounded-xl bg-white dark:bg-neutral-800 shadow-sm ${item.color}`}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">{item.label}</p>
                  <p className="text-xl font-black">{item.value}</p>
                </div>
              </div>
              <div className="flex items-center text-[10px] font-bold text-green-500 bg-green-50 px-1.5 py-0.5 rounded">
                {item.trend} <IconArrowUpRight size={12} />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 border-none shadow-sm min-h-[300px]">
          <h3 className="font-bold mb-4">Biểu đồ Lợi nhuận hàng tháng</h3>
          <div className="flex flex-col items-center justify-center h-full text-neutral-400 border-2 border-dashed border-neutral-100 rounded-xl">
            <p className="text-sm italic text-center px-10">Dữ liệu View <b>view_loi_nhuan_toa_nha_hang_thang</b> sẽ được hiển thị biểu đồ Chart.js tại đây.</p>
          </div>
        </Card>
        
        <Card className="p-6 border-none shadow-sm">
          <h3 className="font-bold mb-4">Thông báo hệ thống</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex gap-3 text-sm">
                <div className="w-1 bg-blue-500 rounded-full h-10"></div>
                <div>
                  <p className="font-medium">Hợp đồng Cty A sắp hết hạn</p>
                  <p className="text-[10px] text-neutral-500">2 ngày trước</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}