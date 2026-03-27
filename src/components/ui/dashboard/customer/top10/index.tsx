'use client';

import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { IconRefresh } from '@tabler/icons-react';
import useSWR from 'swr';

import { INIT_META } from '@/lib/constants';
import { IPaginated, StatsTop10Customer } from '@/types';

import TableDashboardTop10Customer from './table';

const DashboardTop10Customer = () => {
  const {
    data = { data: [], meta: INIT_META },
    isLoading,
    mutate,
  } = useSWR<IPaginated<StatsTop10Customer>>('/api/stats/customer/top10');

  return (
    <>
      <Card className="">
        <CardHeader className="justify-between gap-3">
          <h4 className="text-foreground text-lg font-semibold">
            Top 10 khách hàng gửi tiền
          </h4>
          <Button isIconOnly onPress={() => mutate()}>
            <IconRefresh />
          </Button>
        </CardHeader>
        <CardBody className="gap-3">
          <TableDashboardTop10Customer isLoading={isLoading} data={data} />
        </CardBody>
      </Card>
    </>
  );
};

export default DashboardTop10Customer;
