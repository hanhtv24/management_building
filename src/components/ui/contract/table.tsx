import React, { useCallback } from 'react';

import {
  Card,
  CardBody,
  Chip,
  Pagination,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { DateTime } from 'luxon';

import { LoaiHdColor, TrangThaiColor } from '@/lib/constants';
import { Contract, TTable } from '@/types';

type Props = {} & TTable<Contract>;

const columns = [
  { key: 'maHd', label: 'Mã hợp đồng' },
  { key: 'ngayTao', label: 'Ngày tạo' },
  { key: 'ngayKetThuc', label: 'Ngày kết thúc' },
  { key: 'ngayTatToan', label: 'Ngày tất toán' },
  { key: 'loaiHd', label: 'Loại hợp đồng' },
  { key: 'tenHd', label: 'Tên hợp đồng' },
  { key: 'soTienGoc', label: 'Số tiền gốc' },
  { key: 'soTienLai', label: 'Số tiền lãi' },
  { key: 'trangThai', label: 'Trạng thái' },
  { key: 'khachHang', label: 'Khách hàng' },
  { key: 'nhanVien', label: 'Nhân viên' },
  { key: 'ghiChu', label: 'Ghi chú' },
];

const TableContract: React.FC<Props> = ({
  isLoading,
  data,
  filter,
  setFilter,
  selectedKeys,
  setSelectedKeys,
}) => {
  const renderCell = useCallback(
    (data: Props['data']['data'][number], columnKey: React.Key) => {
      const cellValue = data[columnKey as keyof typeof data];

      switch (columnKey) {
        case 'loaiHd':
          return (
            <Chip
              className="text-default-600 gap-1 border-none capitalize"
              color={
                LoaiHdColor[data.loaiHd.tenLhd as keyof typeof LoaiHdColor]
              }
              size="sm"
              variant="flat"
            >
              {data.loaiHd.tenLhd}
            </Chip>
          );

        case 'trangThai':
          return (
            <Chip
              className="text-default-600 gap-1 border-none capitalize"
              color={
                TrangThaiColor[
                  data.trangThai.tenTt as keyof typeof TrangThaiColor
                ]
              }
              size="sm"
              variant="flat"
            >
              {data.trangThai.tenTt}
            </Chip>
          );

        case 'khachHang':
          return data.khachHang.tenKh;

        case 'nhanVien':
          return data.nhanVien.tenNv;

        default:
          if (
            cellValue instanceof Date ||
            (typeof cellValue === 'string' &&
              /^\d{4}-\d{2}-\d{2}(T.*)?$/.test(cellValue) &&
              DateTime.fromISO(cellValue).isValid)
          ) {
            return DateTime.fromJSDate(new Date(cellValue)).toFormat(
              'dd-MM-yyyy',
            );
          }

          if (
            typeof cellValue === 'number' ||
            (typeof cellValue === 'string' &&
              cellValue !== '' &&
              !isNaN(Number(cellValue)))
          ) {
            return Number(cellValue).toLocaleString('vi-VN');
          }

          return String(cellValue || '-'.repeat(6));
      }
    },
    [],
  );

  return (
    <>
      <Card>
        <CardBody className="gap-3">
          <Table
            isHeaderSticky
            classNames={{
              base: 'flex-1 overflow-auto',
              wrapper: 'p-0 flex-1 !h-full shadow-none',
            }}
            aria-label="Bảng loại hợp đồng"
            selectionMode="single"
            selectionBehavior="toggle"
            selectedKeys={selectedKeys}
            onSelectionChange={setSelectedKeys}
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn key={column.key}>{column.label}</TableColumn>
              )}
            </TableHeader>
            <TableBody
              items={data?.data ?? []}
              loadingContent={<Spinner color="current" />}
              loadingState={isLoading ? 'loading' : 'idle'}
              emptyContent="Không có dữ liệu"
            >
              {(item) => (
                <TableRow key={item.maHd}>
                  {(columnKey) => (
                    <TableCell className="whitespace-nowrap">
                      {renderCell(item, columnKey)}
                    </TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>

          {data.meta.totalPage > 1 && (
            <div className="flex w-full justify-center">
              <Pagination
                showControls
                classNames={{ cursor: 'bg-foreground text-background' }}
                isDisabled={isLoading}
                page={filter.page}
                total={data?.meta?.totalPage ?? 0}
                onChange={(page) => {
                  setFilter((prev) => ({ ...prev, page }));
                  setSelectedKeys(new Set());
                }}
              />
            </div>
          )}
        </CardBody>
      </Card>
    </>
  );
};

export default TableContract;
