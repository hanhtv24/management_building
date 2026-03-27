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

import { addPosition, editPosition } from '@/lib/action/position';
import { Position } from '@/types';

type Props = { selected?: Position };

const ValidateSchema = z.object({
  tenCv: z.string().nonempty({ error: 'Đây là trường bắt buộc' }),
  luong: z
    .int()
    .nonnegative({ error: 'Đây là trường bắt buộc' })
    .gt(0, { error: 'Giá trị phải lớn hơn 0' }),
});

const FormPosition: React.FC<Props> = ({ selected }) => {
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<z.infer<typeof ValidateSchema>>({
    defaultValues: {
      tenCv: selected ? selected.tenCv : '',
      luong: selected ? +selected.luong : 1,
    },
    resolver: zodResolver(ValidateSchema),
  });

  const onSubmit: SubmitHandler<z.infer<typeof ValidateSchema>> = async (
    data,
  ) => {
    const { luong, ...rest } = data;

    const numericKeys = ['luong'] as const;

    if (selected) {
      const dirtyOnly = pick(rest, Object.keys(dirtyFields));

      const numericFields = Object.fromEntries(
        numericKeys
          .filter((key) => dirtyFields[key])
          .map((key) => [key, String(data[key])]),
      );

      try {
        await editPosition(selected.maCv, { ...dirtyOnly, ...numericFields });
      } catch (e) {
        addToast({
          title: 'Sửa chức vụ thất bại',
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
        await addPosition({ ...rest, ...numericFields });
      } catch (e) {
        addToast({
          title: 'Thêm chức vụ thất bại',
          description: e.message,
          color: 'danger',
        });
        return;
      }
    }

    router.push('/employee/position');
  };

  return (
    <div className="-m-3 flex flex-1 flex-col gap-3 overflow-hidden p-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-foreground flex items-center gap-2 text-xl font-bold">
          <Link href="/employee/position" className="block cursor-pointer">
            <IconArrowLeft />
          </Link>
          {selected ? 'Sửa' : 'Thêm'} chức vụ
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
                  value={selected?.maCv}
                />
              )}

              <div className="flex gap-3">
                <Controller
                  control={control}
                  name="tenCv"
                  render={({ field: { onChange, ...field } }) => (
                    <Input
                      label="Tên"
                      labelPlacement="outside"
                      placeholder="Nhập tên"
                      {...field}
                      onValueChange={onChange}
                      isInvalid={!!errors.tenCv}
                      errorMessage={errors.tenCv?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="luong"
                  render={({ field: { onChange, ...field } }) => (
                    <NumberInput
                      hideStepper
                      minValue={1}
                      step={1}
                      label="Lương"
                      labelPlacement="outside"
                      placeholder="Nhập lương"
                      {...field}
                      onValueChange={onChange}
                      isInvalid={!!errors.luong}
                      errorMessage={errors.luong?.message}
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

export default FormPosition;
