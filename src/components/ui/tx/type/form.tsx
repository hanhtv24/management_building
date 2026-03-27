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
  addToast,
} from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconArrowLeft } from '@tabler/icons-react';
import { pick } from 'lodash';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

import { addTxType, editTxType } from '@/lib/action/tx-type';
import { TxType } from '@/types';

type Props = { selected?: TxType };

const ValidateSchema = z.object({
  tenLgd: z.string().nonempty({ error: 'Đây là trường bắt buộc' }),
  moTa: z.string().nonempty({ error: 'Đây là trường bắt buộc' }),
});

const FormTxType: React.FC<Props> = ({ selected }) => {
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<z.infer<typeof ValidateSchema>>({
    defaultValues: {
      tenLgd: selected ? selected.tenLgd : '',
      moTa: selected?.moTa ?? '',
    },
    resolver: zodResolver(ValidateSchema),
  });

  const onSubmit: SubmitHandler<z.infer<typeof ValidateSchema>> = async (
    data,
  ) => {
    if (selected) {
      const dirtyOnly = pick(data, Object.keys(dirtyFields));

      try {
        await editTxType(selected.maLgd, dirtyOnly);
      } catch (e) {
        addToast({
          title: 'Sửa loại giao dịch thất bại',
          description: e.message,
          color: 'danger',
        });
        return;
      }
    } else {
      try {
        await addTxType(data);
      } catch (e) {
        addToast({
          title: 'Thêm loại giao dịch thất bại',
          description: e.message,
          color: 'danger',
        });
        return;
      }
    }

    router.push('/type/tx');
  };

  return (
    <div className="-m-3 flex flex-1 flex-col gap-3 overflow-hidden p-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-foreground flex items-center gap-2 text-xl font-bold">
          <Link href="/type/tx" className="block cursor-pointer">
            <IconArrowLeft />
          </Link>
          {selected ? 'Sửa' : 'Thêm'} loại giao dịch
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
                  value={selected?.maLgd}
                />
              )}

              <div className="flex gap-3">
                <Controller
                  control={control}
                  name="tenLgd"
                  render={({ field: { onChange, ...field } }) => (
                    <Input
                      label="Tên"
                      labelPlacement="outside"
                      placeholder="Nhập tên"
                      {...field}
                      onValueChange={onChange}
                      isInvalid={!!errors.tenLgd}
                      errorMessage={errors.tenLgd?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="moTa"
                  render={({ field: { onChange, ...field } }) => (
                    <Input
                      label="Mô tả"
                      labelPlacement="outside"
                      placeholder="Nhập mô tả"
                      {...field}
                      onValueChange={onChange}
                      isInvalid={!!errors.tenLgd}
                      errorMessage={errors.tenLgd?.message}
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

export default FormTxType;
