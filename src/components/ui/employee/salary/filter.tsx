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
import { DateTime } from 'luxon';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

import { ERR_MSG } from '@/lib/constants';
import { TFilter } from '@/types';

type Props = {
  filter: TFilter;
  setFilter: React.Dispatch<React.SetStateAction<TFilter>>;
};

const ValidateSchema = z
  .object({
    q: z.string().optional(),
    thang: z
      .string()
      .optional()
      .transform((val) => (!val ? undefined : Number(val)))
      .refine((val) => !val || (val >= 1 && val <= 12), {
        error: ERR_MSG.RANGE(1, 12),
      }),
    nam: z
      .string()
      .optional()
      .transform((val) => (!val ? undefined : Number(val)))
      .refine(
        (val) => !val || (val >= 1970 && val <= new Date().getFullYear()),
        { error: ERR_MSG.RANGE(1970, new Date().getFullYear()) },
      ),
  })
  .superRefine((data, ctx) => {
    if (data.nam && !data.thang) {
      ctx.addIssue({
        code: 'custom',
        path: ['thang'],
        message: 'Vui lòng chọn tháng',
      });
    }

    if (data.thang && !data.nam) {
      ctx.addIssue({
        code: 'custom',
        path: ['nam'],
        message: 'Vui lòng chọn năm',
      });
    }
  });

const FilterSalary: React.FC<Props> = ({ filter, setFilter }) => {
  const {
    control,
    trigger,
    handleSubmit,
    formState: { errors, isSubmitting, submitCount },
  } = useForm({
    defaultValues: {
      q: filter.q || '',
      thang: filter.thang ?? '',
      nam: filter.nam ?? '',
    },
    resolver: zodResolver(ValidateSchema),
  });

  const onSubmit: SubmitHandler<z.infer<typeof ValidateSchema>> = ({
    thang,
    nam,
    ...data
  }) => {
    let thoiGian = '';

    if (nam && thang) {
      thoiGian = DateTime.fromJSDate(new Date(+nam, +thang - 1, 1)).toFormat(
        'yyyy-MM-dd',
      );
    }

    setFilter((prev) => ({ ...prev, ...data, thoiGian, page: 1 }));
  };

  return (
    <Card className="">
      <CardHeader className="flex items-center gap-1">
        <IconFilter className="h-5 w-5" />
        <h4 className="text-lg">Bộ lọc</h4>
      </CardHeader>
      <CardBody className="@container">
        <Form
          className="flex flex-row justify-end gap-3 @max-3xl:flex-wrap"
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
            name="thang"
            render={({ field: { onChange } }) => (
              <Autocomplete
                className="@max-3xl:w-[calc(50%_-_calc(var(--spacing)_*_1.5))] @max-sm:w-full"
                label="Tháng"
                labelPlacement="outside"
                placeholder="Chọn tháng"
                items={Array.from({ length: 12 }, (_, i) => i + 1).map((m) => ({
                  key: `${m}`,
                  label: `${m}`,
                }))}
                onSelectionChange={(key) => onChange(key || '')}
                onClear={() => {
                  onChange('');
                  if (submitCount) trigger();
                }}
                onBlur={() => {
                  if (submitCount) trigger();
                }}
                isInvalid={!!errors.thang}
                errorMessage={errors.thang?.message}
              >
                {(item) => (
                  <AutocompleteItem key={item.key} className="capitalize">
                    {item.label}
                  </AutocompleteItem>
                )}
              </Autocomplete>
            )}
          />

          <Controller
            control={control}
            name="nam"
            render={({ field: { onChange } }) => (
              <Autocomplete
                className="@max-3xl:w-[calc(50%_-_calc(var(--spacing)_*_1.5))] @max-sm:w-full"
                label="Năm"
                labelPlacement="outside"
                placeholder="Chọn năm"
                items={Array.from(
                  { length: 10 },
                  (_, i) => new Date().getFullYear() - i,
                ).map((m) => ({
                  key: `${m}`,
                  label: `${m}`,
                }))}
                onSelectionChange={(key) => onChange(key || '')}
                onClear={() => {
                  onChange('');
                  if (submitCount) trigger();
                }}
                onBlur={() => {
                  if (submitCount) trigger();
                }}
                isInvalid={!!errors.nam}
                errorMessage={errors.nam?.message}
              >
                {(item) => (
                  <AutocompleteItem key={item.key} className="capitalize">
                    {item.label}
                  </AutocompleteItem>
                )}
              </Autocomplete>
            )}
          />

          <div className="flex flex-col gap-1">
            <label className="text-small text-foreground invisible @max-3xl:hidden">
              A
            </label>
            <Button
              type="submit"
              isLoading={isSubmitting}
              isDisabled={isSubmitting || Object.keys(errors).length > 0}
            >
              Tìm kiếm
            </Button>
          </div>
        </Form>
      </CardBody>
    </Card>
  );
};

export default FilterSalary;
