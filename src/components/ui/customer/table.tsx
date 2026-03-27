import React, { useCallback } from 'react';

import {
  Card,
  CardBody,
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

import { Customer, TTable } from '@/types';

type Props = {} & TTable<Customer>;

const columns = [
  { key: 'maKh', label: 'Mã khách hàng' },
  { key: 'loaiKh', label: 'Loại khách hàng' },
  { key: 'tenKh', label: 'Tên khách hàng' },
  { key: 'sdt', label: 'Số điện thoại' },
  { key: 'email', label: 'Email' },
  { key: 'diaChi', label: 'Địa chỉ' },
  { key: 'ngaySinh', label: 'Ngày sinh' },
  { key: 'gioiTinh', label: 'Giới tính' },
  { key: 'cccd', label: 'CCCD' },
  { key: 'maSoThue', label: 'Mã số thuế' },
  { key: 'nguoiDaiDien', label: 'Người đại diện' },
];

const TableCustomer: React.FC<Props> = ({
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
      const emptyValue = '-'.repeat(6);

      switch (columnKey) {
        case 'tenKh':
          return data?.cn?.tenKh || data?.dn?.tenDn || '';

        case 'ngaySinh':
          return data.cn?.ngaySinh || emptyValue;

        case 'sdt':
          return data.sdt || emptyValue;

        case 'gioiTinh':
          return data.cn
            ? data.cn.gioiTinh === 'nam'
              ? 'Nam'
              : 'Nữ'
            : emptyValue;

        case 'cccd':
          return data.cn?.cccd || emptyValue;

        case 'maSoThue':
          return data.dn?.maSoThue || emptyValue;

        case 'nguoiDaiDien':
          return data.dn?.nguoiDaiDien || emptyValue;

        default:
          if (
            cellValue instanceof Date ||
            (typeof cellValue === 'string' &&
              /^\d{4}-\d{2}-\d{2}(T.*)?$/.test(cellValue) &&
              DateTime.fromISO(cellValue).isValid)
          ) {
            return DateTime.fromJSDate(new Date(cellValue)).toFormat(
              'HH:mm dd-MM-yyyy',
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

          return String(cellValue || emptyValue);
      }
    },
    [],
  );

  return (
    <Card>
      <CardBody className="gap-3">
        <Table
          isHeaderSticky
          classNames={{
            base: 'flex-1 overflow-auto',
            wrapper: 'p-0 flex-1 !h-full shadow-none',
          }}
          aria-label="Bảng khách hàng"
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
              <TableRow key={item.maKh}>
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
  );
};

export default TableCustomer;
