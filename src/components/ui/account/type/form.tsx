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

import { addAccountType, editAccountType } from '@/lib/action/account-type';
import { AccountType } from '@/types';

type Props = { selected?: AccountType };

const ValidateSchema = z.object({
  tenLtk: z.string().nonempty({ error: 'Đây là trường bắt buộc' }),
  soLuongTk: z
    .int()
    .nonnegative({ error: 'Đây là trường bắt buộc' })
    .gt(0, { error: 'Giá trị phải lớn hơn 0' }),
  phiThuongNien: z.int().nonnegative({ error: 'Đây là trường bắt buộc' }),
  laiSuatNam: z.number().nonnegative({ error: 'Đây là trường bắt buộc' }),
  hanMuc: z.int().nonnegative({ error: 'Đây là trường bắt buộc' }),
});

const FormAccountType: React.FC<Props> = ({ selected }) => {
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<z.infer<typeof ValidateSchema>>({
    defaultValues: {
      tenLtk: selected ? selected.tenLtk : '',
      soLuongTk: selected ? selected.soLuongTk : 1,
      phiThuongNien: selected ? +selected.phiThuongNien : 0,
      laiSuatNam: selected ? +selected.laiSuatNam : 0,
      hanMuc: selected ? +selected.hanMuc : 0,
    },
    resolver: zodResolver(ValidateSchema),
  });

  const onSubmit: SubmitHandler<z.infer<typeof ValidateSchema>> = async (
    data,
  ) => {
    const { phiThuongNien, laiSuatNam, hanMuc, ...rest } = data;

    const numericKeys = ['phiThuongNien', 'laiSuatNam', 'hanMuc'] as const;

    if (selected) {
      const dirtyOnly = pick(rest, Object.keys(dirtyFields));

      const numericFields = Object.fromEntries(
        numericKeys
          .filter((key) => dirtyFields[key])
          .map((key) => [key, String(data[key])]),
      );

      try {
        await editAccountType(selected.maLtk, {
          ...dirtyOnly,
          ...numericFields,
        });
      } catch (e) {
        addToast({
          title: 'Sửa loại tài khoản thất bại',
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
        await addAccountType({ ...rest, ...numericFields });
      } catch (e) {
        addToast({
          title: 'Thêm loại tài khoản thất bại',
          description: e.message,
          color: 'danger',
        });
        return;
      }
    }

    router.push('/type/account');
  };

  return (
    <div className="-m-3 flex flex-1 flex-col gap-3 overflow-hidden p-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-foreground flex items-center gap-2 text-xl font-bold">
          <Link href="/type/account" className="block cursor-pointer">
            <IconArrowLeft />
          </Link>
          {selected ? 'Sửa' : 'Thêm'} loại tài khoản
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
                  value={selected?.maLtk}
                />
              )}

              <div className="flex gap-3">
                <Controller
                  control={control}
                  name="tenLtk"
                  render={({ field: { onChange, ...field } }) => (
                    <Input
                      label="Tên"
                      labelPlacement="outside"
                      placeholder="Nhập tên"
                      {...field}
                      onValueChange={onChange}
                      isInvalid={!!errors.tenLtk}
                      errorMessage={errors.tenLtk?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="soLuongTk"
                  render={({ field: { onChange, ...field } }) => (
                    <NumberInput
                      hideStepper
                      minValue={1}
                      step={1}
                      label="Số tài khoản tối đa"
                      labelPlacement="outside"
                      placeholder="Nhập số tài khoản tối đa"
                      {...field}
                      onValueChange={onChange}
                      isInvalid={!!errors.soLuongTk}
                      errorMessage={errors.soLuongTk?.message}
                    />
                  )}
                />
              </div>

              <div className="flex gap-3">
                <Controller
                  control={control}
                  name="phiThuongNien"
                  render={({ field: { onChange, ...field } }) => (
                    <NumberInput
                      hideStepper
                      minValue={0}
                      step={1}
                      label="Phí thường niên"
                      labelPlacement="outside"
                      placeholder="Nhập phí thường niên"
                      {...field}
                      onValueChange={onChange}
                      isInvalid={!!errors.phiThuongNien}
                      errorMessage={errors.phiThuongNien?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="laiSuatNam"
                  render={({ field: { onChange, ...field } }) => (
                    <NumberInput
                      hideStepper
                      minValue={0}
                      step={0.1}
                      label="Lãi suất năm"
                      labelPlacement="outside"
                      placeholder="Nhập lãi suất năm"
                      {...field}
                      onValueChange={onChange}
                      isInvalid={!!errors.laiSuatNam}
                      errorMessage={errors.laiSuatNam?.message}
                    />
                  )}
                />
              </div>

              <div className="flex gap-3">
                <Controller
                  control={control}
                  name="hanMuc"
                  render={({ field: { onChange, ...field } }) => (
                    <NumberInput
                      hideStepper
                      minValue={0}
                      step={1}
                      label="Hạn mức"
                      labelPlacement="outside"
                      placeholder="Nhập hạn mức"
                      {...field}
                      onValueChange={onChange}
                      isInvalid={!!errors.hanMuc}
                      errorMessage={errors.hanMuc?.message}
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

export default FormAccountType;
