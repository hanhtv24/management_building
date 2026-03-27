'use client';

import { useCallback } from 'react';

import {
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';

import { StatsTop10Customer, TTable } from '@/types';

type Props = {} & Pick<TTable<StatsTop10Customer>, 'isLoading' | 'data'>;

const columns = [
  { key: 'maKh', label: 'Mã khách hàng' },
  { key: 'tenKh', label: 'Tên khách hàng' },
  { key: 'soTien', label: 'Số tiền' },
];

const TableDashboardTop10Customer: React.FC<Props> = ({ isLoading, data }) => {
  const renderCell = useCallback(
    (data: Props['data']['data'][number], columnKey: React.Key) => {
      const cellValue = data[columnKey as keyof typeof data];
      const emptyValue = '-'.repeat(6);

      switch (columnKey) {
        default:
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
    <>
      <Table
        isHeaderSticky
        classNames={{
          base: 'flex-1 overflow-auto',
          wrapper: 'p-0 flex-1 !h-full shadow-none',
        }}
        aria-label="Bảng khách hàng"
        selectionMode="single"
        selectionBehavior="toggle"
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.key}>{column.label}</TableColumn>
          )}
        </TableHeader>
        <TableBody
          items={data.data ?? []}
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
    </>
  );
};

export default TableDashboardTop10Customer;
