'use client';

import { useState } from 'react';

import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { IconRefresh } from '@tabler/icons-react';
import { omitBy } from 'lodash';
import { DateTime } from 'luxon';
import useSWR from 'swr';

import { INIT_FILTER, INIT_META } from '@/lib/constants';
import { IPaginated, StatsDebit, TFilter } from '@/types';

import FilterDashboardDebit from './filter';
import TableDashboardDebit from './table';

const DashboardDebit = () => {
  const [filter, setFilter] = useState<TFilter>({
    ...INIT_FILTER,
    thoiGian: DateTime.now().startOf('month').toISODate(),
  });

  const {
    data = { data: [], meta: INIT_META },
    isLoading,
    mutate,
  } = useSWR<IPaginated<StatsDebit>>([
    '/api/stats/debit',
    omitBy(filter, (value) => !value),
  ]);

  return (
    <>
      <Card className="">
        <CardHeader className="justify-between gap-3">
          <h4 className="text-foreground text-lg font-semibold">Nợ tồn đọng</h4>
          <Button isIconOnly onPress={() => mutate()}>
            <IconRefresh />
          </Button>
        </CardHeader>
        <CardBody className="gap-3">
          <FilterDashboardDebit filter={filter} setFilter={setFilter} />
          <TableDashboardDebit
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

export default DashboardDebit;
