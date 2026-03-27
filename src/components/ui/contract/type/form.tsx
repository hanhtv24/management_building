'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Form,
  Input,
  NumberInput,
  addToast,
} from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconArrowLeft } from '@tabler/icons-react';
import { pick } from 'lodash';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

import { addContractType, editContractType } from '@/lib/action/contract-type';
import { ContractType } from '@/types';

type Props = { selected?: ContractType };

const ValidateSchema = z.object({
  tenLhd: z.string().nonempty({ error: 'Đây là trường bắt buộc' }),
  soThang: z
    .int()
    .nonnegative({ error: 'Đây là trường bắt buộc' })
    .gt(0, { error: 'Số tháng phải lớn hơn 0' }),
  laiSuatCd: z
    .number()
    .nonnegative({ error: 'Đây là trường bắt buộc' })
    .gt(0, { error: 'Giá trị phải lớn hơn 0' }),
  laiSuatKcd: z
    .number()
    .nonnegative({ error: 'Đây là trường bắt buộc' })
    .gt(0, { error: 'Lãi suất không cố định phải lớn hơn 0' }),
});

const FormContractType: React.FC<Props> = ({ selected }) => {
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<z.infer<typeof ValidateSchema>>({
    defaultValues: {
      tenLhd: selected ? selected.tenLhd : '',
      soThang: selected ? selected.soThang : 1,
      laiSuatCd: selected ? +selected.laiSuatCd : 0,
      laiSuatKcd: selected ? +selected.laiSuatKcd : 0,
    },
    resolver: zodResolver(ValidateSchema),
  });

  const onSubmit: SubmitHandler<z.infer<typeof ValidateSchema>> = async (
    data,
  ) => {
    const { laiSuatCd, laiSuatKcd, ...rest } = data;

    const numericKeys = ['laiSuatCd', 'laiSuatKcd'] as const;

    if (selected) {
      const dirtyOnly = pick(rest, Object.keys(dirtyFields));

      const numericFields = Object.fromEntries(
        numericKeys
          .filter((key) => dirtyFields[key])
          .map((key) => [key, String(data[key])]),
      );

      try {
        await editContractType(selected.maLhd, {
          ...dirtyOnly,
          ...numericFields,
        });
      } catch (e) {
        addToast({
          title: 'Sửa loại hợp đồng thất bại',
          description: e.message,
          color: 'danger',
        });
        return;
      }
    } else {
      const numericFields: Record<(typeof numericKeys)[number], string> =
        Object.fromEntries(
          numericKeys.map((key) => [key, String(data[key])]),
        ) as Record<(typeof numericKeys)[number], string>;

      try {
        await addContractType({ ...rest, ...numericFields });
      } catch (e) {
        addToast({
          title: 'Thêm loại hợp đồng thất bại',
          description: e.message,
          color: 'danger',
        });
        return;
      }
    }

    router.push('/type/contract');
  };

  return (
    <div className="-m-3 flex flex-1 flex-col gap-3 overflow-hidden p-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-foreground flex items-center gap-2 text-xl font-bold">
          <Link href="/type/contract" className="block cursor-pointer">
            <IconArrowLeft />
          </Link>
          {selected ? 'Sửa' : 'Thêm'} loại hợp đồng
        </h1>
      </div>

      <Form
        className="-m-3 flex flex-1 flex-col items-center overflow-auto p-3"
        onSubmit={
          Object.keys(errors).length < 1 && isDirty
            ? handleSubmit(onSubmit)
            : undefined
        }
      >
        <div className="flex w-full flex-col gap-3">
          <Card>
            <CardHeader>
              <h4 className="text-lg">Thông tin</h4>
            </CardHeader>

            <CardBody className="flex flex-col gap-3">
              {selected && (
                <Input
                  label="Mã loại"
                  labelPlacement="outside"
                  isDisabled
                  value={selected?.maLhd}
                />
              )}

              <div className="flex gap-3">
                <Controller
                  control={control}
                  name="tenLhd"
                  render={({ field: { onChange, ...field } }) => (
                    <Input
                      label="Tên"
                      labelPlacement="outside"
                      placeholder="Nhập tên"
                      {...field}
                      onValueChange={onChange}
                      isInvalid={!!errors.tenLhd}
                      errorMessage={errors.tenLhd?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="soThang"
                  render={({ field: { onChange, ...field } }) => (
                    <NumberInput
                      hideStepper
                      minValue={1}
                      step={1}
                      label="Số tháng"
                      labelPlacement="outside"
                      placeholder="Nhập số tháng"
                      {...field}
                      onValueChange={onChange}
                      isInvalid={!!errors.soThang}
                      errorMessage={errors.soThang?.message}
                    />
                  )}
                />
              </div>

              <div className="flex gap-3">
                <Controller
                  control={control}
                  name="laiSuatCd"
                  render={({ field: { onChange, ...field } }) => (
                    <NumberInput
                      hideStepper
                      minValue={0}
                      step={0.1}
                      label="Lãi suất cố định"
                      labelPlacement="outside"
                      placeholder="Nhập lãi suất cố định"
                      {...field}
                      onValueChange={onChange}
                      isInvalid={!!errors.laiSuatCd}
                      errorMessage={errors.laiSuatCd?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="laiSuatKcd"
                  render={({ field: { onChange, ...field } }) => (
                    <NumberInput
                      hideStepper
                      minValue={0}
                      step={0.1}
                      label="Lãi suất không cố định"
                      labelPlacement="outside"
                      placeholder="Nhập lãi suất không cố định"
                      {...field}
                      onValueChange={onChange}
                      isInvalid={!!errors.laiSuatKcd}
                      errorMessage={errors.laiSuatKcd?.message}
                    />
                  )}
                />
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="flex">
          <Button
            className="text-white"
            type="submit"
            color={selected ? 'warning' : 'primary'}
            isLoading={isSubmitting}
            isDisabled={
              isSubmitting || Object.keys(errors).length > 0 || !isDirty
            }
          >
            {selected ? 'Cập nhật' : 'Thêm'}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default FormContractType;
