'use client';

import { useRouter } from 'next/navigation';
import { FC, useState } from 'react';
import { Card, HeroUIProvider, ToastProvider, addToast } from '@heroui/react';
import { I18nProvider } from '@react-aria/i18n';
import {
  IconBuilding,
  IconUsers,
  IconReceipt2,
  IconContract,
  IconTools,
  IconChartPie,
  IconUserCheck,
  IconLayoutDashboard,
  IconHistory, // 🚀 Icon Nhật ký
  IconUserCode, // 🚀 Icon Phân công
} from '@tabler/icons-react';
import { AxiosRequestConfig } from 'axios';
import { motion } from 'motion/react';
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';
import { SWRConfig } from 'swr';

import { SidebarBody, SidebarLink, SidebarProvider } from '@/components/ui/sidebar';
import ThemeSwitcher from '@/components/ui/theme-switcher';
import api from '@/lib/utils/api';
import { cn } from '@/lib/utils/cn';

export const onFetchError = (err: any) =>
  addToast({ title: 'Fetch Error', description: err.message, color: 'danger' });

export const fetcher = async <T = unknown, V = Record<string, unknown>>(
  ...args: [string, V?, AxiosRequestConfig?][]
): Promise<T> =>
  await api.get<T, V>(...(args.flat() as [string, V?, AxiosRequestConfig?]));

// 🚀 ĐÃ CHIA NHÓM MENU CHUYÊN NGHIỆP
const menuGroups = [
  {
    title: "TỔNG QUAN",
    items: [
      { label: 'Tổng quan', href: '/', icon: <IconLayoutDashboard className="h-5 w-5 shrink-0" /> },
    ]
  },
  {
    title: "MẶT BẰNG & KHÁCH HÀNG",
    items: [
      { label: 'Văn phòng', href: '/office', icon: <IconBuilding className="h-5 w-5 shrink-0" /> },
      { label: 'Khách hàng (Công ty)', href: '/company', icon: <IconUsers className="h-5 w-5 shrink-0" /> },
      { label: 'Hợp đồng thuê', href: '/contract', icon: <IconContract className="h-5 w-5 shrink-0" /> },
    ]
  },
  {
    title: "DỊCH VỤ & TÀI CHÍNH",
    items: [
      { label: 'Dịch vụ & Giá', href: '/service', icon: <IconTools className="h-5 w-5 shrink-0" /> },
      { label: 'Nhật ký sử dụng', href: '/usage', icon: <IconHistory className="h-5 w-5 shrink-0" /> },
      { label: 'Hóa đơn & Thu phí', href: '/billing', icon: <IconReceipt2 className="h-5 w-5 shrink-0" /> },
    ]
  },
  {
    title: "NHÂN SỰ TÒA NHÀ",
    items: [
      { label: 'Nhân viên tòa nhà', href: '/staff', icon: <IconUserCheck className="h-5 w-5 shrink-0" /> },
      { label: 'Phân công & Lương', href: '/assignment', icon: <IconUserCode className="h-5 w-5 shrink-0" /> },
    ]
  },
  {
    title: "HỆ THỐNG BÁO CÁO",
    items: [
      { label: 'Báo cáo lợi nhuận', href: '/reports/profit', icon: <IconChartPie className="h-5 w-5 shrink-0" /> },
    ]
  }
];

const Template: FC<Partial<Pick<HTMLElement, 'className'> & ThemeProviderProps>> = ({
  children,
  className,
  ...props
}) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <SWRConfig value={{ revalidateOnFocus: false, shouldRetryOnError: false, fetcher, onError: onFetchError }}>
      <HeroUIProvider locale="vi-VN" navigate={router.push} className={cn('flex h-screen w-full flex-col', className)}>
        <ToastProvider />
        <NextThemesProvider attribute="class" defaultTheme="system" enableSystem {...props}>
          <I18nProvider locale="vi">
            <Card className="flex flex-1 flex-col overflow-hidden rounded-none p-1.5 md:flex-row border-none shadow-none">
              <SidebarProvider open={open} setOpen={setOpen} animate={false}>
                <SidebarBody className="justify-between gap-10 bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800">
                  <Logo />
                  <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">

                    {/* 🚀 VÒNG LẶP RENDER GROUP MENU */}
                    {/* 🚀 VÒNG LẶP RENDER GROUP MENU CHUẨN SAAS */}
                    <div className="flex flex-col gap-6 mt-2"> {/* Tăng khoảng cách giữa các nhóm */}
                      {menuGroups.map((group, idx) => (
                        <div key={idx} className="flex flex-col">

                          {/* 1. Tiêu đề nhóm: Nhỏ hơn, mờ hơn (neutral-400), sát xuống menu item hơn (mb-1.5) */}
                          <p className="px-4 mb-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-widest whitespace-nowrap overflow-hidden">
                            {group.title}
                          </p>

                          {/* 2. Danh sách link: Ép khoảng cách (gap-0.5) để chúng tạo thành 1 khối chặt chẽ */}
                          <div className="flex flex-col gap-0.5 px-2">
                            {group.items.map((link, linkIdx) => (
                              <SidebarLink key={linkIdx} link={link} />
                            ))}
                          </div>

                        </div>
                      ))}
                    </div>

                  </div>
                  <div className="flex justify-end p-2">
                    <ThemeSwitcher />
                  </div>
                </SidebarBody>
              </SidebarProvider>

              <main className="relative flex flex-grow flex-col gap-3 overflow-hidden rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800 ml-2">
                {children}
              </main>
            </Card>
          </I18nProvider>
        </NextThemesProvider>
      </HeroUIProvider>
    </SWRConfig>
  );
};

export const Logo = () => (
  <div className="flex items-center space-x-2 py-2 px-1">
    <IconBuilding size={32} className="text-blue-600" />
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col whitespace-nowrap overflow-hidden">
      <span className="font-bold text-sm leading-tight uppercase tracking-wide">Building Care</span>
      <span className="text-[10px] text-neutral-500 font-medium italic">M25CQIS02 - Đề tài 7</span>
    </motion.div>
  </div>
);

export default Template;