'use client';

import React from 'react';

import { Button, Card, CardBody, CardHeader, Form, Input } from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconFilter, IconSearch } from '@tabler/icons-react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

import { TFilter } from '@/types';

type Props = {
  filter: TFilter;
  setFilter: React.Dispatch<React.SetStateAction<TFilter>>;
};

const ValidateSchema = z.object({
  q: z.string().optional(),
});

const FilterAccountType: React.FC<Props> = ({ filter, setFilter }) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { q: filter.q || '' },
    resolver: zodResolver(ValidateSchema),
  });

  const onSubmit: SubmitHandler<z.infer<typeof ValidateSchema>> = (data) => {
    setFilter((prev) => ({ ...prev, ...data, page: 1 }));
  };

  return (
    <Card className="">
      <CardHeader className="flex items-center gap-1">
        <IconFilter className="h-5 w-5" />
        <h4 className="text-lg">Bộ lọc</h4>
      </CardHeader>
      <CardBody>
        <Form
          className="flex flex-col items-end gap-3 md:flex-row"
          onSubmit={
            Object.keys(errors).length > 0 ? undefined : handleSubmit(onSubmit)
          }
        >
          <Controller
            control={control}
            name="q"
            render={({ field: { onChange, ...field } }) => (
              <Input
                label="Từ khoá"
                labelPlacement="outside"
                placeholder="Nhập Mã / Tên..."
                startContent={<IconSearch className="h-4 w-4 text-gray-400" />}
                {...field}
                onValueChange={onChange}
              />
            )}
          />

          <Button
            type="submit"
            isLoading={isSubmitting}
            isDisabled={isSubmitting || Object.keys(errors).length > 0}
          >
            Tìm kiếm
          </Button>
        </Form>
      </CardBody>
    </Card>
  );
};

export default FilterAccountType;
