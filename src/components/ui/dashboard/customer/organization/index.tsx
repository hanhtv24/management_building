'use client';

import { useState } from 'react';

import { Card, CardBody, CardHeader } from '@heroui/react';
import { omitBy } from 'lodash';
import useSWR from 'swr';

import { INIT_FILTER, INIT_META } from '@/lib/constants';
import { IPaginated, StatsCustomerOrganization, TFilter } from '@/types';

import FilterDashboardCustomerOrganization from './filter';
import TableDashboardCustomerOrganization from './table';

const DashboardCustomerOrganization = () => {
  const [filter, setFilter] = useState<TFilter>(INIT_FILTER);
  const { data = { data: [], meta: INIT_META }, isLoading } = useSWR<
    IPaginated<StatsCustomerOrganization>
  >(['/api/stats/customer/organization', omitBy(filter, (value) => !value)]);

  return (
    <>
      <Card className="">
        <CardHeader>
          <h4 className="text-foreground text-lg font-semibold">
            Thống kê khách hàng doanh nghiệp
          </h4>
        </CardHeader>
        <CardBody className="gap-3">
          <FilterDashboardCustomerOrganization
            filter={filter}
            setFilter={setFilter}
          />
          <TableDashboardCustomerOrganization
            isLoading={isLoading}
            data={data}
            filter={filter}
            setFilter={setFilter}
          />
        </CardBody>
      </Card>
    </>
  );
};

export default DashboardCustomerOrganization;
