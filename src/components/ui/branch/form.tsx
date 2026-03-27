'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  addToast,
} from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconArrowLeft } from '@tabler/icons-react';
import { pick } from 'lodash';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

import { useDebouncedAsyncList } from '@/hooks/use-debounced-async-list';
import { addBranch, editBranch } from '@/lib/action/branch';
import { ERR_MSG } from '@/lib/constants';
import api from '@/lib/utils/api';
import { Branch, Employee, IPaginated } from '@/types';

type Props = { selected?: Branch };

const ValidateSchema = z.object({
  tenCn: z.string().nonempty({ error: ERR_MSG.REQUIRED }),
  sdt: z
    .string()
    .nonempty({ error: ERR_MSG.REQUIRED })
    .length(10, {
      error: (val) => ERR_MSG.LENGTH((val.maximum || val.minimum) as number),
    })
    .regex(/^\d+$/, { error: ERR_MSG.NUMBER }),
  email: z.email({ error: ERR_MSG.EMAIL }),
  diaChi: z.string().nonempty({ error: ERR_MSG.REQUIRED }),
  maNql: z.string().optional(),
});

const FormBranch: React.FC<Props> = ({ selected }) => {
  const router = useRouter();

  const nhanVienList = useDebouncedAsyncList<Employee>(
    async ({ signal, filterText }) => {
      const res = await api.get<IPaginated<Employee>>(
        '/api/employee',
        {
          ...(selected ? { chiNhanh: selected.maCn } : {}),
          ...(filterText ? { q: filterText } : {}),
        },
        { signal },
      );
      return { items: res.data };
    },
    selected?.quanLy?.tenNv ?? '',
  );

  const {
    control,
    resetField,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<z.infer<typeof ValidateSchema>>({
    defaultValues: {
      tenCn: selected ? selected.tenCn : '',
      sdt: selected ? selected.sdt : '',
      email: selected ? selected.email : '',
      diaChi: selected ? selected.diaChi : '',
      maNql: selected ? selected.quanLy?.maNv : '',
    },
    resolver: zodResolver(ValidateSchema),
  });

  const onSubmit: SubmitHandler<z.infer<typeof ValidateSchema>> = async (
    data,
  ) => {
    if (selected) {
      const dirtyOnly = pick(data, Object.keys(dirtyFields));

      try {
        await editBranch(selected.maCn, dirtyOnly);
      } catch (e) {
        addToast({
          title: 'Sửa chi nhánh thất bại',
          description: e.message,
          color: 'danger',
        });
        return;
      }
    } else {
      try {
        await addBranch(data);
      } catch (e) {
        addToast({
          title: 'Thêm chi nhánh thất bại',
          description: e.message,
          color: 'danger',
        });
        return;
      }
    }

    router.push('/branch');
  };

  return (
    <div className="-m-3 flex flex-1 flex-col gap-3 overflow-hidden p-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-foreground flex items-center gap-2 text-xl font-bold">
          <Link href="/branch" className="block cursor-pointer">
            <IconArrowLeft />
          </Link>
          {selected ? 'Sửa' : 'Thêm'} chi nhánh
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
              <div className="flex gap-3">
                {selected && (
                  <Input
                    label="Mã chi nhánh"
                    labelPlacement="outside"
                    isDisabled
                    value={selected?.maCn}
                  />
                )}

                <Controller
                  control={control}
                  name="tenCn"
                  render={({ field: { onChange, ...field } }) => (
                    <Input
                      label="Tên chi nhánh"
                      labelPlacement="outside"
                      placeholder="Nhập tên"
                      {...field}
                      onValueChange={onChange}
                      isInvalid={!!errors.tenCn}
                      errorMessage={errors.tenCn?.message}
                    />
                  )}
                />
              </div>

              <div className="flex gap-3">
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, ...field } }) => (
                    <Input
                      label="Email"
                      labelPlacement="outside"
                      placeholder="Nhập email"
                      {...field}
                      onValueChange={onChange}
                      isInvalid={!!errors.email}
                      errorMessage={errors.email?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="sdt"
                  render={({ field: { onChange, ...field } }) => (
                    <Input
                      label="Số điện thoại"
                      labelPlacement="outside"
                      placeholder="Nhập số điện thoại"
                      {...field}
                      onValueChange={onChange}
                      isInvalid={!!errors.sdt}
                      errorMessage={errors.sdt?.message}
                    />
                  )}
                />
              </div>

              <div className="flex gap-3">
                <Controller
                  control={control}
                  name="diaChi"
                  render={({ field: { onChange, ...field } }) => (
                    <Input
                      label="Địa chỉ"
                      labelPlacement="outside"
                      placeholder="Nhập địa chỉ"
                      {...field}
                      onValueChange={onChange}
                      isInvalid={!!errors.diaChi}
                      errorMessage={errors.diaChi?.message}
                    />
                  )}
                />

                {selected && (
                  <Controller
                    control={control}
                    name="maNql"
                    render={({ field: { onChange, value } }) => (
                      <Autocomplete
                        className="@max-3xl:w-[calc(50%_-_calc(var(--spacing)_*_1.5))] @max-lg:w-full"
                        label="Quản lý"
                        labelPlacement="outside"
                        placeholder="Chọn nhân viên"
                        selectedKey={value}
                        inputValue={nhanVienList.inputValue}
                        isLoading={nhanVienList.isLoading}
                        items={nhanVienList.items}
                        onInputChange={nhanVienList.triggerFilter}
                        onSelectionChange={(key) => {
                          if (key && `${key}` !== `${value}`) {
                            onChange(key);
                            const item = nhanVienList.items.find(
                              (i) => `${i.maNv}` === `${key}`,
                            );
                            nhanVienList.setInputValue(item?.tenNv ?? '');
                          }
                        }}
                        onClear={() => {
                          onChange('');
                          nhanVienList.setInputValue('');
                        }}
                        onBlur={() => {
                          if (!value) {
                            nhanVienList.setInputValue(
                              selected?.quanLy?.tenNv ?? '',
                            );
                            resetField('maNql');
                          }
                        }}
                        isInvalid={!!errors.maNql}
                        errorMessage={errors.maNql?.message}
                      >
                        {(item) => (
                          <AutocompleteItem
                            key={item.maNv}
                            className="capitalize"
                            endContent={
                              <span className="text-xs text-neutral-500">
                                {item.maNv}
                              </span>
                            }
                          >
                            {item.tenNv}
                          </AutocompleteItem>
                        )}
                      </Autocomplete>
                    )}
                  />
                )}
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

export default FormBranch;
