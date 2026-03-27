'use client';

import { useState } from 'react';

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Skeleton,
} from '@heroui/react';
import {
  IconCreditCardPay,
  IconCreditCardRefund,
  IconFilter,
} from '@tabler/icons-react';
import { omitBy } from 'lodash';
import { DateTime } from 'luxon';
import useSWR from 'swr';

import { INIT_FILTER } from '@/lib/constants';
import { StatsInterest, TFilter } from '@/types';

import FilterDashboardInterest from './filter';

const DashboardInterest = () => {
  const [filter, setFilter] = useState<TFilter>({
    ...INIT_FILTER,
    page: 0,
    take: 0,
    thoiGian: DateTime.now().startOf('month').toISODate(),
  });

  const { data = { soTienNhan: 0, soTienTra: 0 }, isLoading } =
    useSWR<StatsInterest>([
      '/api/stats/interest',
      omitBy(filter, (value) => !value),
    ]);

  return (
    <Card className="">
      <CardHeader className="justify-between gap-3">
        <h4 className="text-foreground text-lg font-semibold">Thống kê lãi</h4>
        <Popover placement={'bottom-end'}>
          <PopoverTrigger>
            <Button isIconOnly>
              <IconFilter />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-2">
            <FilterDashboardInterest filter={filter} setFilter={setFilter} />
          </PopoverContent>
        </Popover>
      </CardHeader>
      <CardBody className="@container gap-3">
        <div className="grid grid-cols-1 gap-3 @md:grid-cols-2 @2xl:grid-cols-3 @6xl:grid-cols-4">
          {[
            {
              name: 'Tổng lãi nhận',
              icon: (
                <IconCreditCardRefund size={24} className="text-emerald-400" />
              ),
              value: data.soTienNhan,
            },
            {
              name: 'Tổng lãi trả',
              icon: <IconCreditCardPay size={24} className="text-red-400" />,
              value: data.soTienTra,
            },
          ].map((e, i) => (
            <div key={i} className="rounded-large flex-1">
              {e && (
                <div className="rounded-large bg-default-100 flex flex-1 gap-2 p-3">
                  <div className="flex flex-1 flex-col gap-2">
                    <h4 className="text-lg font-semibold">{e.name}</h4>

                    <div className="text-md">
                      {isLoading ? (
                        <Skeleton className="rounded-large h-6" />
                      ) : e.value ? (
                        Number(e.value).toLocaleString('vi-VN')
                      ) : (
                        ''
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">{e.icon}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};

export default DashboardInterest;
