'use client';
 
import { useEffect, useState } from 'react';
import { Card, CardBody, Select, SelectItem, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip } from '@heroui/react';
import { IconChartPie, IconTrendingUp, IconTrendingDown, IconReceipt2, IconWallet } from '@tabler/icons-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
 
// Đăng ký các module của ChartJS
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);
 
export default function ProfitReportPage() {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
 
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/reports/profit?year=${filterYear}`);
        const result = await res.json();
        if (result.success) setReportData(result.data);
      } catch (error) {
        console.error("Lỗi lấy báo cáo", error);
      }
      setLoading(false);
    };
    fetchData();
  }, [filterYear]);
 
  // Tính tổng năm
  const totalRevenue = reportData.reduce((sum, item: any) => sum + Number(item.tong_doanh_thu), 0);
  const totalCost = reportData.reduce((sum, item: any) => sum + Number(item.tong_chi_phi), 0);
  const totalProfit = reportData.reduce((sum, item: any) => sum + Number(item.loi_nhuan), 0);
 
  // Cấu hình dữ liệu cho Biểu đồ
  const chartData = {
    labels: reportData.map((d: any) => `Tháng ${d.thang}`),
    datasets: [
      {
        label: 'Doanh Thu',
        data: reportData.map((d: any) => Number(d.tong_doanh_thu)),
        backgroundColor: 'rgba(59, 130, 246, 0.8)', // Blue-500
        borderRadius: 4,
      },
      {
        label: 'Chi Phí',
        data: reportData.map((d: any) => Number(d.tong_chi_phi)),
        backgroundColor: 'rgba(239, 68, 68, 0.8)', // Red-500
        borderRadius: 4,
      }
    ],
  };
 
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${context.raw.toLocaleString()} đ`
        }
      }
    },
    scales: {
      y: { beginAtZero: true, ticks: { callback: (value: any) => (value / 1000000) + ' Tr' } }
    }
  };
 
  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full min-h-0">
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-indigo-700">
            <IconChartPie /> Báo cáo Doanh thu & Lợi nhuận
          </h1>
          <p className="text-sm text-neutral-500">Phân tích tình hình tài chính của toàn bộ tòa nhà</p>
        </div>
        <Select size="sm" className="w-32" label="Năm tài chính" selectedKeys={[filterYear]} onChange={e => setFilterYear(e.target.value)}>
          {['2024', '2025', '2026'].map((y) => <SelectItem key={y} textValue={y}>Năm {y}</SelectItem>)}
        </Select>
      </div>
 
      {/* THẺ TỔNG QUAN YTD (Year To Date) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-blue-50 border border-blue-100">
          <CardBody className="flex flex-row items-center gap-4 p-5">
            <div className="p-3 bg-blue-500 text-white rounded-xl shadow-sm"><IconTrendingUp size={28} /></div>
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Tổng Doanh Thu</p>
              <p className="text-2xl font-black text-blue-900">{totalRevenue.toLocaleString()} đ</p>
            </div>
          </CardBody>
        </Card>
        <Card className="border-none shadow-sm bg-red-50 border border-red-100">
          <CardBody className="flex flex-row items-center gap-4 p-5">
            <div className="p-3 bg-red-500 text-white rounded-xl shadow-sm"><IconTrendingDown size={28} /></div>
            <div>
              <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Tổng Chi Phí</p>
              <p className="text-2xl font-black text-red-900">{totalCost.toLocaleString()} đ</p>
            </div>
          </CardBody>
        </Card>
        <Card className="border-none shadow-sm bg-emerald-50 border border-emerald-100">
          <CardBody className="flex flex-row items-center gap-4 p-5">
            <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-sm"><IconWallet size={28} /></div>
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Lợi Nhuận Ròng</p>
              <p className="text-2xl font-black text-emerald-900">{totalProfit.toLocaleString()} đ</p>
            </div>
          </CardBody>
        </Card>
      </div>
 
      {/* KHU VỰC BIỂU ĐỒ */}
      <Card className="p-6 border-none shadow-sm h-[400px]">
        <h3 className="font-bold mb-4 text-neutral-700 flex items-center gap-2">
           Biểu đồ tương quan Doanh thu - Chi phí (Năm {filterYear})
        </h3>
        <div className="relative h-full w-full pb-8">
          {reportData.length > 0 ? (
            <Bar data={chartData} options={chartOptions} />
          ) : (
            <div className="flex h-full items-center justify-center text-neutral-400">Đang tải biểu đồ...</div>
          )}
        </div>
      </Card>
 
      {/* BẢNG CHI TIẾT SỐ LIỆU */}
      <Table aria-label="Bảng chi tiết lợi nhuận" shadow="none" className="border border-neutral-200 rounded-xl">
        <TableHeader>
          <TableColumn>KỲ BÁO CÁO</TableColumn>
          <TableColumn align="end">DOANH THU (VNĐ)</TableColumn>
          <TableColumn align="end">CHI PHÍ (VNĐ)</TableColumn>
          <TableColumn align="end">LỢI NHUẬN (VNĐ)</TableColumn>
          <TableColumn align="center">TRẠNG THÁI</TableColumn>
        </TableHeader>
        <TableBody isLoading={loading} emptyContent="Không có dữ liệu báo cáo cho năm này.">
          {reportData.map((item: any, idx: number) => {
            const loiNhuan = Number(item.loi_nhuan);
            return (
              <TableRow key={idx}>
                <TableCell className="font-bold">Tháng {item.thang} / {item.nam}</TableCell>
                <TableCell className="text-right font-medium text-blue-600">{Number(item.tong_doanh_thu).toLocaleString()}</TableCell>
                <TableCell className="text-right font-medium text-red-600">{Number(item.tong_chi_phi).toLocaleString()}</TableCell>
                <TableCell className="text-right font-bold text-emerald-600">{loiNhuan.toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex justify-center">
                    {loiNhuan >= 0 
                      ? <Chip size="sm" color="success" variant="flat">Lãi</Chip>
                      : <Chip size="sm" color="danger" variant="flat">Lỗ</Chip>
                    }
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}