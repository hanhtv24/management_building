'use client';

import { useState } from 'react';

import { Card, CardBody, CardHeader } from '@heroui/react';
import { omitBy } from 'lodash';
import { DateTime } from 'luxon';
import useSWR from 'swr';

import { INIT_FILTER, INIT_META } from '@/lib/constants';
import { IPaginated, StatsCustomer, TFilter } from '@/types';

import FilterDashboardCustomer from './filter';
import TableDashboardCustomer from './table';

const DashboardCustomer = () => {
  const [filter, setFilter] = useState<TFilter>({
    ...INIT_FILTER,
    thoiGian: DateTime.now().startOf('month').toFormat('yyyy-MM-dd'),
  });
  const { data = { data: [], meta: INIT_META }, isLoading } = useSWR<
    IPaginated<StatsCustomer>
  >(['/api/stats/customer', omitBy(filter, (value) => !value)]);

  return (
    <Card className="">
      <CardHeader>
        <h4 className="text-foreground text-lg font-semibold">
          Thống kê khách hàng
        </h4>
      </CardHeader>
      <CardBody className="gap-3">
        <FilterDashboardCustomer filter={filter} setFilter={setFilter} />
        <TableDashboardCustomer
          isLoading={isLoading}
          data={data}
          filter={filter}
          setFilter={setFilter}
        />
      </CardBody>
    </Card>
  );
};

export default DashboardCustomer;
