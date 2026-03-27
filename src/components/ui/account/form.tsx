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
  NumberInput,
  addToast,
} from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconArrowLeft } from '@tabler/icons-react';
import { pick } from 'lodash';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

import { useDebouncedAsyncList } from '@/hooks/use-debounced-async-list';
import { addAccount, editAccount } from '@/lib/action/account';
import { ERR_MSG, LoaiKh } from '@/lib/constants';
import api from '@/lib/utils/api';
import {
  Account,
  AccountType,
  Customer,
  Employee,
  IPaginated,
  Status,
} from '@/types';

type Props = { selected?: Account };

const ValidateSchema = z.object({
  maLtk: z.string().nonempty({ error: ERR_MSG.REQUIRED }),
  maKh: z.string().nonempty({ error: ERR_MSG.REQUIRED }),
  maNvt: z.string().nonempty({ error: ERR_MSG.REQUIRED }),
  maTt: z
    .int({ error: ERR_MSG.REQUIRED })
    .nonnegative({ error: ERR_MSG.NUMBER })
    .optional(),
  hanMucKd: z
    .number({ error: ERR_MSG.REQUIRED })
    .nonnegative({ error: ERR_MSG.NUMBER })
    .optional(),
});

const FormAccount: React.FC<Props> = ({ selected }) => {
  const router = useRouter();

  const loaiTkList = useDebouncedAsyncList<AccountType>(
    async ({ signal }) => {
      if (selected) return { items: [selected.loaiTk] };

      const res = await api.get<IPaginated<AccountType>>(
        '/api/account-type',
        {},
        { signal },
      );
      return { items: res.data };
    },
    selected ? `${selected.loaiTk.tenLtk}` : '',
  );

  const khachHangList = useDebouncedAsyncList<Customer>(
    async ({ signal, filterText }) => {
      if (selected) {
        return {
          items: [
            {
              maKh: selected.khachHang.maKh,
              ...(selected.khachHang.loaiKh === LoaiKh.CN
                ? { cn: { tenKh: selected.khachHang.tenKh } }
                : { dn: { tenDn: selected.khachHang.tenKh } }),
            },
          ] as Customer[],
        };
      }
      const res = await api.get<IPaginated<Customer>>(
        '/api/customer',
        filterText ? { q: filterText } : {},
        { signal },
      );
      return { items: res.data };
    },
    selected ? `${selected.khachHang.tenKh}` : '',
  );

  const nhanVienList = useDebouncedAsyncList<Employee>(
    async ({ signal, filterText }) => {
      if (selected) return { items: [selected.nhanVien] };

      const res = await api.get<IPaginated<Employee>>(
        '/api/employee',
        filterText ? { q: filterText } : {},
        { signal },
      );
      return { items: res.data };
    },
    selected ? `${selected.nhanVien.tenNv}` : '',
  );

  const trangThaiList = useDebouncedAsyncList<Status>(
    async ({ signal, filterText }) => {
      const res = await api.get<IPaginated<Status>>(
        '/api/status',
        { loaiTt: 'tai_khoan', ...(filterText ? { q: filterText } : {}) },
        { signal },
      );
      return { items: res.data };
    },
    selected ? `${selected.trangThai.tenTt}` : '',
  );

  const {
    control,
    resetField,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<z.infer<typeof ValidateSchema>>({
    defaultValues: {
      maLtk: selected ? selected.loaiTk.maLtk : '',
      maKh: selected ? selected.khachHang.maKh : '',
      maNvt: selected ? selected.nhanVien.maNv : '',
      maTt: selected ? selected.trangThai.maTt : 1,
      hanMucKd: +(selected?.hanMucKd ?? 0),
    },
    resolver: zodResolver(ValidateSchema),
  });

  const onSubmit: SubmitHandler<z.infer<typeof ValidateSchema>> = async (
    data,
  ) => {
    const { hanMucKd, ...rest } = data;
    const numericKeys = ['hanMucKd'] as const;

    if (selected) {
      const dirtyOnly = pick({ maTt: data.maTt }, Object.keys(dirtyFields));

      const numericFields = Object.fromEntries(
        numericKeys
          .filter((key) => dirtyFields[key])
          .map((key) => [key, String(data[key])]),
      );

      try {
        await editAccount(selected.maTk, { ...dirtyOnly, ...numericFields });
      } catch (e) {
        addToast({
          title: 'Sửa tài khoản thất bại',
          description: e.message,
          color: 'danger',
        });
        return;
      }
    } else {
      try {
        await addAccount(rest);
      } catch (e) {
        addToast({
          title: 'Thêm tài khoản thất bại',
          description: e.message,
          color: 'danger',
        });
        return;
      }
    }

    router.push('/account');
  };

  return (
    <div className="-m-3 flex flex-1 flex-col gap-3 overflow-hidden p-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-foreground flex items-center gap-2 text-xl font-bold">
          <Link href="/account" className="block cursor-pointer">
            <IconArrowLeft />
          </Link>
          {selected ? 'Sửa' : 'Thêm'} tài khoản
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
                    label="Mã tài khoản"
                    labelPlacement="outside"
                    isDisabled
                    value={selected?.maTk}
                  />
                )}

                <Controller
                  control={control}
                  name="maLtk"
                  render={({ field: { onChange, value } }) => (
                    <Autocomplete
                      isDisabled={!!selected}
                      className="@max-3xl:w-[calc(50%_-_calc(var(--spacing)_*_1.5))] @max-lg:w-full"
                      label="Loại tài khoản"
                      labelPlacement="outside"
                      placeholder="Chọn loại tài khoản"
                      selectedKey={value}
                      inputValue={loaiTkList.inputValue}
                      isLoading={loaiTkList.isLoading}
                      items={loaiTkList.items}
                      onInputChange={loaiTkList.triggerFilter}
                      onSelectionChange={(key) => {
                        if (key && `${key}` !== `${value}`) {
                          onChange(key);
                          const item = loaiTkList.items.find(
                            (i) => `${i.maLtk}` === `${key}`,
                          );
                          loaiTkList.setInputValue(item?.tenLtk ?? '');
                        }
                      }}
                      onClear={() => {
                        onChange('');
                        loaiTkList.setInputValue('');
                      }}
                      onBlur={() => {
                        if (!value) {
                          loaiTkList.setInputValue(
                            selected?.loaiTk.tenLtk ?? '',
                          );
                          resetField('maLtk');
                        }
                      }}
                      isInvalid={!!errors.maLtk}
                      errorMessage={errors.maLtk?.message}
                    >
                      {(item) => (
                        <AutocompleteItem
                          key={item.maLtk}
                          className="capitalize"
                        >
                          {item.tenLtk}
                        </AutocompleteItem>
                      )}
                    </Autocomplete>
                  )}
                />
              </div>

              <div className="flex gap-3">
                <Controller
                  control={control}
                  name="maKh"
                  render={({ field: { onChange, value } }) => (
                    <Autocomplete
                      isDisabled={!!selected}
                      className="@max-3xl:w-[calc(50%_-_calc(var(--spacing)_*_1.5))] @max-lg:w-full"
                      label="Khách hàng"
                      labelPlacement="outside"
                      placeholder="Chọn khách hàng"
                      selectedKey={value}
                      inputValue={khachHangList.inputValue}
                      isLoading={khachHangList.isLoading}
                      items={khachHangList.items}
                      onInputChange={khachHangList.triggerFilter}
                      onSelectionChange={(key) => {
                        if (key && `${key}` !== `${value}`) {
                          onChange(key);
                          const item = khachHangList.items.find(
                            (i) => `${i.maKh}` === `${key}`,
                          );
                          khachHangList.setInputValue(
                            (item?.cn?.tenKh || item?.dn?.tenDn) ?? '',
                          );
                        }
                      }}
                      onClear={() => {
                        onChange('');
                        khachHangList.setInputValue('');
                      }}
                      onBlur={() => {
                        if (!value) {
                          khachHangList.setInputValue(
                            selected?.khachHang?.tenKh ?? '',
                          );
                          resetField('maKh');
                        }
                      }}
                      isInvalid={!!errors.maKh}
                      errorMessage={errors.maKh?.message}
                    >
                      {(item) => (
                        <AutocompleteItem
                          key={item.maKh}
                          className="capitalize"
                          endContent={
                            <span className="text-xs text-neutral-500">
                              {item.maKh}
                            </span>
                          }
                        >
                          {item.cn?.tenKh || item.dn?.tenDn}
                        </AutocompleteItem>
                      )}
                    </Autocomplete>
                  )}
                />

                <Controller
                  control={control}
                  name="maNvt"
                  render={({ field: { onChange, value } }) => (
                    <Autocomplete
                      isDisabled={!!selected}
                      className="@max-3xl:w-[calc(50%_-_calc(var(--spacing)_*_1.5))] @max-lg:w-full"
                      label="Nhân viên"
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
                            selected?.nhanVien.tenNv ?? '',
                          );
                          resetField('maNvt');
                        }
                      }}
                      isInvalid={!!errors.maNvt}
                      errorMessage={errors.maNvt?.message}
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
              </div>

              {selected && (
                <div className="flex gap-3">
                  <Controller
                    control={control}
                    name="maTt"
                    render={({ field: { onChange, value } }) => (
                      <Autocomplete
                        className="@max-3xl:w-[calc(50%_-_calc(var(--spacing)_*_1.5))] @max-lg:w-full"
                        label="Trạng thái"
                        labelPlacement="outside"
                        placeholder="Chọn trạng thái"
                        selectedKey={`${value}`}
                        inputValue={trangThaiList.inputValue}
                        isLoading={trangThaiList.isLoading}
                        items={trangThaiList.items}
                        onInputChange={trangThaiList.triggerFilter}
                        onSelectionChange={(key) => {
                          if (key && `${key}` !== `${value}`) {
                            onChange(+key);
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
                        onBlur={() => {
                          if (!value) {
                            trangThaiList.setInputValue(
                              selected?.trangThai?.tenTt ?? '',
                            );
                            resetField('maTt');
                          }
                        }}
                        isInvalid={!!errors.maTt}
                        errorMessage={errors.maTt?.message}
                      >
                        {(item) => (
                          <AutocompleteItem
                            key={`${item.maTt}`}
                            className="capitalize"
                            endContent={
                              <span className="text-xs text-neutral-500">
                                {item.maTt}
                              </span>
                            }
                          >
                            {item.tenTt}
                          </AutocompleteItem>
                        )}
                      </Autocomplete>
                    )}
                  />

                  <Controller
                    control={control}
                    name="hanMucKd"
                    render={({ field: { onChange, ...field } }) => (
                      <NumberInput
                        hideStepper
                        minValue={0}
                        step={1}
                        label="Hạn mức tín dụng khả dụng"
                        labelPlacement="outside"
                        placeholder="Nhập hạn mức tín dụng khả dụng"
                        {...field}
                        onValueChange={onChange}
                        isInvalid={!!errors.hanMucKd}
                        errorMessage={errors.hanMucKd?.message}
                      />
                    )}
                  />
                </div>
              )}
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

export default FormAccount;
