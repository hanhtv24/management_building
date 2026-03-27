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

import { AccountType, TTable } from '@/types';

type Props = {} & TTable<AccountType>;

const columns = [
  { key: 'maLtk', label: 'Mã loại' },
  { key: 'tenLtk', label: 'Tên loại' },
  { key: 'soLuongTk', label: 'Số lượng tài khoản' },
  { key: 'phiThuongNien', label: 'Phí thường niên' },
  { key: 'laiSuatNam', label: 'Lãi suất năm' },
  { key: 'hanMuc', label: 'Hạn mức' },
];

const TableAccountType: React.FC<Props> = ({
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
      <Card>
        <CardBody className="gap-3">
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
                <TableRow key={item.maLtk}>
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

export default TableAccountType;
