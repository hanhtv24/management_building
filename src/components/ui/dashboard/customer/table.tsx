'use client';

import { useCallback } from 'react';

import {
  Pagination,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';

import { StatsCustomer, TTable } from '@/types';

type Props = {} & Omit<
  TTable<StatsCustomer>,
  'selectedKeys' | 'setSelectedKeys'
>;

const columns = [
  { key: 'maTk', label: 'Mã tài khoản' },
  { key: 'tenKh', label: 'Tên khách hàng' },
  { key: 'soTien', label: 'Số tiền' },
];

const TableDashboardCustomer: React.FC<Props> = ({
  isLoading,
  data,
  filter,
  setFilter,
}) => {
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
            <TableRow key={item.maTk}>
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
            total={data.meta.totalPage ?? 0}
            onChange={(page) => {
              setFilter((prev) => ({ ...prev, page }));
            }}
          />
        </div>
      )}
    </>
  );
};

export default TableDashboardCustomer;
