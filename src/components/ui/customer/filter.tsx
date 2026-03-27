'use client';

import React from 'react';

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Form,
  Input,
  Select,
  SelectItem,
} from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconFilter, IconSearch } from '@tabler/icons-react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

import { LoaiKh, LoaiKhView } from '@/lib/constants';
import { TFilter } from '@/types';

type Props = {
  filter: TFilter;
  setFilter: React.Dispatch<React.SetStateAction<TFilter>>;
};

const ValidateSchema = z.object({
  q: z.string(),
  loaiKh: z.string(),
});

const FilterCustomer: React.FC<Props> = ({ filter, setFilter }) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { q: filter.q || '', loaiKh: filter.loaiKh || '' },
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
      <CardBody className="@container">
        <Form
          className="flex flex-row items-end justify-end gap-3 @max-lg:flex-wrap"
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
                placeholder="Nhập Mã / Tên / Email / SĐT"
                startContent={<IconSearch className="h-4 w-4 text-gray-400" />}
                {...field}
                onValueChange={onChange}
              />
            )}
          />

          <Controller
            control={control}
            name="loaiKh"
            render={({ field: { onChange, value } }) => (
              <Select
                label="Loại khách hàng"
                labelPlacement="outside"
                placeholder="Chọn loại khách hàng"
                defaultSelectedKeys={[value]}
                items={[
                  { key: '', label: 'Tất cả' },
                  ...Object.values(LoaiKh).map((e) => ({
                    key: e,
                    label: LoaiKhView[e],
                  })),
                ]}
                onSelectionChange={onChange}
              >
                {(item) => (
                  <SelectItem key={item.key} className="capitalize">
                    {item.label}
                  </SelectItem>
                )}
              </Select>
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

export default FilterCustomer;
