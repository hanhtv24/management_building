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

import { Salary, TTable } from '@/types';

type Props = {} & Omit<TTable<Salary>, 'selectedKeys' | 'setSelectedKeys'>;

const columns = [
  { key: 'maNv', label: 'Mã nhân viên' },
  { key: 'tenNv', label: 'Tên nhân viên' },
  { key: 'thoiGian', label: 'Thời gian' },
  { key: 'luongCoBan', label: 'Lương cơ bản' },
  { key: 'hoaHong', label: 'Hoa hồng' },
  { key: 'tongLuong', label: 'Tổng lương' },
];

const TableSalary: React.FC<Props> = ({
  isLoading,
  data,
  filter,
  setFilter,
}) => {
  const renderCell = useCallback(
    (data: Props['data']['data'][number], columnKey: React.Key) => {
      const cellValue = data[columnKey as keyof typeof data];

      switch (columnKey) {
        case 'thoiGian':
          return DateTime.fromJSDate(new Date(cellValue)).toFormat(
            'dd-MM-yyyy',
          );

        default:
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
                <TableRow key={item.maNv}>
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
                }}
              />
            </div>
          )}
        </CardBody>
      </Card>
    </>
  );
};

export default TableSalary;
