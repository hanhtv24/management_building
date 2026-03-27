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

import { ContractType, TTable } from '@/types';

type Props = {} & TTable<ContractType>;

const columns = [
  { key: 'maLhd', label: 'Mã loại' },
  { key: 'tenLhd', label: 'Tên loại' },
  { key: 'soThang', label: 'Số tháng' },
  { key: 'laiSuatCd', label: 'Lãi suất cố định' },
  { key: 'laiSuatKcd', label: 'Lãi suất ký hợp đồng' },
];

const TableContractType: React.FC<Props> = ({
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

      const date =
        cellValue instanceof Date
          ? DateTime.fromJSDate(cellValue)
          : typeof cellValue === 'string'
            ? DateTime.fromISO(cellValue)
            : null;

      if (date?.isValid) return date.toFormat('HH:mm dd-MM-yyyy');

      if (
        typeof cellValue === 'number' ||
        (typeof cellValue === 'string' &&
          cellValue !== '' &&
          !isNaN(Number(cellValue)))
      ) {
        return Number(cellValue).toLocaleString('vi-VN');
      }

      return String(cellValue || '-'.repeat(6));
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
                <TableRow key={item.maLhd}>
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

export default TableContractType;
