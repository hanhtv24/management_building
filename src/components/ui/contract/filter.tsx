'use client';

import React from 'react';

import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Card,
  CardBody,
  CardHeader,
  Form,
  Input,
} from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconFilter, IconSearch } from '@tabler/icons-react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

import { useDebouncedAsyncList } from '@/hooks/use-debounced-async-list';
import api from '@/lib/utils/api';
import { ContractType, IPaginated, Status, TFilter } from '@/types';

type Props = {
  filter: TFilter;
  setFilter: React.Dispatch<React.SetStateAction<TFilter>>;
};

const ValidateSchema = z.object({
  q: z.string().optional(),
  tenLhd: z.string().optional(),
  maTt: z.string().optional(),
});

const FilterContract: React.FC<Props> = ({ filter, setFilter }) => {
  const loaiHdList = useDebouncedAsyncList<ContractType>(
    async ({ signal, filterText }) => {
      const res = await api.get<IPaginated<ContractType>>(
        '/api/contract-type/distinct',
        { ...(filterText ? { q: filterText } : {}) },
        { signal },
      );
      return { items: res.data };
    },
  );

  const trangThaiList = useDebouncedAsyncList<Status>(
    async ({ signal, filterText }) => {
      const res = await api.get<IPaginated<Status>>(
        '/api/status',
        { loaiTt: 'hop_dong', ...(filterText ? { q: filterText } : {}) },
        { signal },
      );
      return { items: res.data };
    },
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      q: filter.q || '',
      tenLhd: filter.loaiHd || '',
      maTt: filter.maTt || '',
    },
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
          className="flex flex-row items-end justify-end gap-3 @max-3xl:flex-wrap"
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
                placeholder="Nhập Mã / Tên"
                startContent={<IconSearch className="h-4 w-4 text-gray-400" />}
                {...field}
                onValueChange={onChange}
              />
            )}
          />

          <Controller
            control={control}
            name="tenLhd"
            render={({ field: { onChange, value } }) => (
              <Autocomplete
                className="@max-3xl:w-[calc(50%_-_calc(var(--spacing)_*_1.5))] @max-lg:w-full"
                label="Loại tài khoản"
                labelPlacement="outside"
                placeholder="Chọn loại tài khoản"
                selectedKey={value}
                inputValue={loaiHdList.inputValue}
                isLoading={loaiHdList.isLoading}
                items={loaiHdList.items}
                onInputChange={loaiHdList.triggerFilter}
                onSelectionChange={(key) => {
                  if (key && `${key}` !== `${value}`) {
                    onChange(key);
                    const item = loaiHdList.items.find(
                      (i) => `${i.tenLhd}` === `${key}`,
                    );
                    loaiHdList.setInputValue(item?.tenLhd ?? '');
                  }
                }}
                onClear={() => {
                  onChange('');
                  loaiHdList.setInputValue('');
                }}
                isInvalid={!!errors.tenLhd}
                errorMessage={errors.tenLhd?.message}
              >
                {(item) => (
                  <AutocompleteItem key={item.tenLhd} className="capitalize">
                    {item.tenLhd}
                  </AutocompleteItem>
                )}
              </Autocomplete>
            )}
          />

          <Controller
            control={control}
            name="maTt"
            render={({ field: { onChange, value } }) => (
              <Autocomplete
                className="@max-3xl:w-[calc(50%_-_calc(var(--spacing)_*_1.5))] @max-lg:w-full"
                label="Trạng thái"
                labelPlacement="outside"
                placeholder="Chọn trạng thái"
                selectedKey={value}
                inputValue={trangThaiList.inputValue}
                isLoading={trangThaiList.isLoading}
                items={trangThaiList.items}
                onInputChange={trangThaiList.triggerFilter}
                onSelectionChange={(key) => {
                  if (key && `${key}` !== `${value}`) {
                    onChange(key);
                    const item = trangThaiList.items.find(
                      (i) => `${i.maTt}` === `${key}`,
                    );
                    trangThaiList.setInputValue(item?.tenTt ?? '');
                  }
                }}
                onClear={() => {
                  onChange('');
                  trangThaiList.setInputValue('');
                }}
                isInvalid={!!errors.maTt}
                errorMessage={errors.maTt?.message}
              >
                {(item) => (
                  <AutocompleteItem key={item.maTt} className="capitalize">
                    {item.tenTt}
                  </AutocompleteItem>
                )}
              </Autocomplete>
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

export default FilterContract;
