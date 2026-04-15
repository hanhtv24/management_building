'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, Spinner } from '@heroui/react';
import { IconBuilding, IconUsers, IconReceipt2, IconChartLine, IconArrowUpRight, IconAlertCircle } from '@tabler/icons-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Đăng ký ChartJS
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Hàm format tiền tệ rút gọn (VD: 1.5 Tỷ, 450 Tr)
const formatCurrencyShort = (value: number) => {
  if (value >= 1000000000) return (value / 1000000000).toFixed(2) + ' Tỷ';
  if (value >= 1000000) return (value / 1000000).toFixed(0) + ' Tr';
  return value.toLocaleString() + ' đ';
};

export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);

  // States lưu dữ liệu từ API
  const [kpi, setKpi] = useState({ ti_le_lap_day: 0, so_khach_thue: 0 });
  const [profitData, setProfitData] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    setIsClient(true);
    setCurrentTime(new Date().toLocaleTimeString('vi-VN'));

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // GỌI 3 API CÙNG LÚC ĐỂ TỐI ƯU TỐC ĐỘ
        const [kpiRes, profitRes, notiRes] = await Promise.all([
          fetch('/api/dashboard/kpi').then(res => res.ok ? res.json() : { data: { ti_le_lap_day: 0, so_khach_thue: 0 } }),
          fetch('/api/reports/profit?year=2026').then(res => res.json()),
          fetch('/api/dashboard/notifications').then(res => res.ok ? res.json() : { data: [] })
        ]);

        if (kpiRes.data) setKpi(kpiRes.data);
        if (profitRes.success) setProfitData(profitRes.data);
        if (notiRes.data) setNotifications(notiRes.data);

      } catch (error) {
        console.error("Lỗi tải dữ liệu Dashboard:", error);
      }
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  // Lấy dữ liệu tháng hiện tại (Hoặc tháng 4 làm mặc định theo Seed Data của bạn)
  const currentMonthData = profitData.find(d => Number(d.thang) === 4) || { tong_doanh_thu: 0, loi_nhuan: 0 };

  // Cấu hình mảng KPI Card
  const summary = [
    { label: 'Tỉ lệ lấp đầy', value: `${kpi.ti_le_lap_day}%`, icon: <IconBuilding />, color: 'text-blue-500', trend: 'Hiện tại' },
    { label: 'Khách hàng đang thuê', value: kpi.so_khach_thue < 10 ? `0${kpi.so_khach_thue}` : kpi.so_khach_thue, icon: <IconUsers />, color: 'text-green-500', trend: 'Công ty' },
    { label: 'Doanh thu (Tháng 4)', value: formatCurrencyShort(Number(currentMonthData.tong_doanh_thu)), icon: <IconReceipt2 />, color: 'text-orange-500', trend: 'VNĐ' },
    { label: 'Lợi nhuận (Tháng 4)', value: formatCurrencyShort(Number(currentMonthData.loi_nhuan)), icon: <IconChartLine />, color: 'text-purple-500', trend: 'VNĐ' },
  ];

  // Cấu hình Biểu đồ
  const chartData = {
    labels: profitData.map(d => `T${d.thang}`),
    datasets: [
      {
        label: 'Doanh Thu',
        data: profitData.map(d => Number(d.tong_doanh_thu)),
        backgroundColor: '#3b82f6',
        borderRadius: 4,
      },
      {
        label: 'Chi Phí',
        data: profitData.map(d => Number(d.tong_chi_phi)),
        backgroundColor: '#f87171',
        borderRadius: 4,
      }
    ]
  };

  if (!isClient) return null;

  return (
    <div className="p-4 md:p-6 space-y-8 min-h-screen pb-20">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-800 dark:text-white">Hệ thống Quản lý Tòa nhà</h1>
        <p className="text-sm text-neutral-500 italic">
          Chào mừng bạn trở lại, dữ liệu được cập nhật từ PostgreSQL lúc {currentTime}
        </p>
      </div>
      
      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.map((item, i) => (
          <Card key={i} className="border-none shadow-sm bg-white border border-neutral-100">
            <CardBody className="flex flex-row items-center justify-between p-5">
              <div className="flex flex-row items-center gap-4">
                <div className={`p-3 rounded-xl bg-neutral-50 shadow-inner ${item.color}`}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">{item.label}</p>
                  <p className="text-xl font-black text-neutral-800">{loading ? '...' : item.value}</p>
                </div>
              </div>
              <div className="flex items-center text-[10px] font-bold text-neutral-400 bg-neutral-50 border border-neutral-100 px-2 py-1 rounded">
                {item.trend}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* CHARTS & NOTIFICATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KHU VỰC BIỂU ĐỒ */}
        <Card className="lg:col-span-2 p-6 border-none shadow-sm border border-neutral-100 min-h-[350px]">
          <h3 className="font-bold mb-6 text-neutral-700">Tương quan Doanh thu - Chi phí (2026)</h3>
          <div className="h-[300px] w-full">
            {loading ? (
              <div className="flex h-full items-center justify-center"><Spinner size="lg" /></div>
            ) : (
              <Bar 
                data={chartData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'top' } },
                  scales: { y: { ticks: { callback: (v: any) => (v / 1000000) + ' Tr' } } }
                }} 
              />
            )}
          </div>
        </Card>
        
        {/* KHU VỰC THÔNG BÁO */}
        <Card className="p-6 border-none shadow-sm border border-neutral-100 flex flex-col h-[400px]">
          <h3 className="font-bold mb-4 text-neutral-700 flex items-center gap-2">
            <IconAlertCircle size={20} className="text-orange-500" />
            Cảnh báo hợp đồng
          </h3>
          <div className="space-y-4 overflow-y-auto flex-1 pr-2 scrollbar-hide">
            {loading ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : notifications.length > 0 ? (
              notifications.map((noti, n) => (
                <div key={n} className="flex gap-3 text-sm p-3 bg-orange-50 rounded-lg border border-orange-100">
                  <div className="w-1 bg-orange-500 rounded-full shrink-0"></div>
                  <div>
                    <p className="font-bold text-neutral-800">{noti.company_name}</p>
                    <p className="text-xs text-neutral-600 mt-1">Phòng: <span className="font-semibold">{noti.room}</span></p>
                    <p className="text-[11px] font-bold text-orange-600 mt-2">
                      Hết hạn sau {noti.so_ngay_con_lai} ngày ({(new Date(noti.end_date)).toLocaleDateString('vi-VN')})
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-neutral-400 text-sm py-10">
                Không có hợp đồng nào sắp hết hạn trong 30 ngày tới.
              </div>
            )}
          </div>
        </Card>

      </div>
    </div>
  );
}