import React, { useCallback } from 'react';

import {
  Card,
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

import { TrangThaiColor } from '@/lib/constants';
import { Debit, TTable } from '@/types';

type Props = {} & TTable<Debit>;

const columns = [
  { key: 'maTk', label: 'Mã tài khoản' },
  { key: 'thoiGian', label: 'Thời gian' },
  { key: 'soTienGoc', label: 'Số tiền gốc' },
  { key: 'soTienLai', label: 'Số tiền lãi' },
  { key: 'tienDaTra', label: 'Tiền đã trả' },
  { key: 'ngayTinhLai', label: 'Ngày tính lãi' },
  { key: 'trangThai', label: 'Trạng thái' },
];

const TableDebit: React.FC<Props> = ({
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

        case 'thoiGian':
        case 'ngayTinhLai':
          return cellValue
            ? DateTime.fromJSDate(new Date(cellValue as string)).toFormat(
                'dd-MM-yyyy',
              )
            : '-'.repeat(6);

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

          return String(cellValue || '-'.repeat(6));
      }
    },
    [],
  );

  return (
    <>
      <Card className="gap-3">
        <Table
          isHeaderSticky
          classNames={{
            base: 'flex-1 overflow-auto',
            wrapper: 'p-0 flex-1 !h-full shadow-none',
          }}
          aria-label="Bảng loại tài khoản"
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
              total={data?.meta?.totalPage ?? 0}
              onChange={(page) => {
                setFilter((prev) => ({ ...prev, page }));
                setSelectedKeys(new Set());
              }}
            />
          </div>
        )}
      </Card>
    </>
  );
};

export default TableDebit;
