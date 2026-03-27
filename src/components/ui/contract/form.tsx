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
  NumberInput,
  Select,
  SelectItem,
  addToast,
} from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconArrowLeft } from '@tabler/icons-react';
import { uniq } from 'lodash';
import {
  Control,
  Controller,
  SubmitHandler,
  useForm,
  useFormState,
} from 'react-hook-form';
import z from 'zod';

import { useDebouncedAsyncList } from '@/hooks/use-debounced-async-list';
import { addContract } from '@/lib/action/contract';
import { ERR_MSG } from '@/lib/constants';
import api from '@/lib/utils/api';
import {
  Account,
  Contract,
  ContractType,
  Customer,
  Employee,
  IPaginated,
} from '@/types';

type Props = { selected?: Contract };

const ValidateSchema = z.object({
  tenLhd: z.string().nonempty({ error: ERR_MSG.REQUIRED }),
  soThang: z
    .string({ error: ERR_MSG.REQUIRED })
    .nonempty({ error: ERR_MSG.REQUIRED })
    .regex(/^\d+$/, { error: ERR_MSG.NUMBER }),
  maKh: z.string().nonempty({ error: ERR_MSG.REQUIRED }),
  soTienGoc: z.int({ error: ERR_MSG.REQUIRED }).min(1, {
    error: (val) => ERR_MSG.MIN(val.minimum as number),
  }),
  maNvxl: z.string().nonempty({ error: ERR_MSG.REQUIRED }),
  maTkNguon: z.string().optional(),
  tenHd: z.string().optional(),
  ghiChu: z.string().optional(),
});

const FormContract: React.FC<Props> = ({ selected }) => {
  const router = useRouter();

  const loaiHdList = useDebouncedAsyncList<ContractType>(
    async ({ signal, filterText }) => {
      const res = await api.get<IPaginated<ContractType>>(
        '/api/contract-type',
        filterText ? { q: filterText } : {},
        { signal },
      );
      return { items: res.data };
    },
  );

  const khachHangList = useDebouncedAsyncList<Customer>(
    async ({ signal, filterText }) => {
      const res = await api.get<IPaginated<Customer>>(
        '/api/customer',
        filterText ? { q: filterText } : {},
        { signal },
      );
      return { items: res.data };
    },
  );

  const nhanVienList = useDebouncedAsyncList<Employee>(
    async ({ signal, filterText }) => {
      const res = await api.get<IPaginated<Employee>>(
        '/api/employee',
        filterText ? { q: filterText } : {},
        { signal },
      );
      return { items: res.data };
    },
  );

  const {
    control,
    watch,
    resetField,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<z.infer<typeof ValidateSchema>>({
    defaultValues: {
      tenLhd: '',
      soThang: '',
      maKh: '',
      soTienGoc: 1,
      maNvxl: '',
      maTkNguon: undefined,
      tenHd: '',
      ghiChu: '',
    },
    resolver: zodResolver(ValidateSchema),
  });

  const onSubmit: SubmitHandler<z.infer<typeof ValidateSchema>> = async (
    data,
  ) => {
    const { soTienGoc, tenLhd, soThang, ...rest } = data;

    const numericKeys = ['soTienGoc'] as const;

    const numericFields: Record<(typeof numericKeys)[number], string> =
      Object.fromEntries(
        numericKeys.map((key) => [key, String(data[key])]),
      ) as Record<(typeof numericKeys)[number], string>;

    const maLhd = loaiHdList.items.find(
      (item) => item.tenLhd === tenLhd && item.soThang === +soThang,
    )?.maLhd;

    if (!maLhd) {
      addToast({
        title: 'Thêm hợp đồng thất bại',
        description: 'Loại hợp đồng không hợp lệ',
        color: 'danger',
      });
      return;
    }

    try {
      await addContract({ ...rest, ...numericFields, maLhd });
    } catch (e) {
      addToast({
        title: 'Thêm hợp đồng thất bại',
        description: e.message,
        color: 'danger',
      });
      return;
    }

    router.push('/contract');
  };

  const maKh = watch('maKh');
  const tenLhd = watch('tenLhd');

  return (
    <div className="-m-3 flex flex-1 flex-col gap-3 overflow-hidden p-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-foreground flex items-center gap-2 text-xl font-bold">
          <Link href="/contract" className="block cursor-pointer">
            <IconArrowLeft />
          </Link>
          {selected ? 'Sửa' : 'Thêm'} hợp đồng
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
                <Controller
                  control={control}
                  name="tenLhd"
                  render={({ field: { onChange, value } }) => (
                    <Autocomplete
                      isDisabled={!!selected}
                      className="@max-3xl:w-[calc(50%_-_calc(var(--spacing)_*_1.5))] @max-lg:w-full"
                      label="Loại hợp đồng"
                      labelPlacement="outside"
                      placeholder="Chọn loại hợp đồng"
                      inputValue={loaiHdList.inputValue}
                      isLoading={loaiHdList.isLoading}
                      items={uniq(loaiHdList.items.map((e) => e.tenLhd)).map(
                        (e) => ({ id: e, name: e }),
                      )}
                      onInputChange={loaiHdList.triggerFilter}
                      onSelectionChange={(key) => {
                        if (key && `${key}` !== `${value}`) {
                          onChange(key);
                          loaiHdList.setInputValue(`${key}`);
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
                        <AutocompleteItem key={item.id} className="capitalize">
                          {item.name}
                        </AutocompleteItem>
                      )}
                    </Autocomplete>
                  )}
                />

                {tenLhd ? (
                  <Controller
                    control={control}
                    name="soThang"
                    render={({ field: { onChange } }) => (
                      <Select
                        isDisabled={!!selected}
                        className="@max-3xl:w-[calc(50%_-_calc(var(--spacing)_*_1.5))] @max-lg:w-full"
                        label="Số tháng"
                        labelPlacement="outside"
                        placeholder="Chọn số tháng"
                        items={uniq(
                          loaiHdList.items
                            .filter((x) => x.tenLhd === tenLhd)
                            .map((e) => e.soThang),
                        ).map((e) => ({ id: `${e}`, name: `${e}` }))}
                        onSelectionChange={onChange}
                        isInvalid={!!errors.soThang}
                        errorMessage={errors.soThang?.message}
                      >
                        {(item) => (
                          <SelectItem key={item.id} className="capitalize">
                            {item.name}
                          </SelectItem>
                        )}
                      </Select>
                    )}
                  />
                ) : (
                  <div className="w-full" />
                )}
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
                          khachHangList.setInputValue('');
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
                  name="soTienGoc"
                  render={({ field: { onChange, ...field } }) => (
                    <NumberInput
                      isDisabled={!!selected}
                      hideStepper
                      minValue={0}
                      step={1}
                      label="Số tiền gốc"
                      labelPlacement="outside"
                      placeholder="Nhập số tiền gốc"
                      {...field}
                      onValueChange={onChange}
                      isInvalid={!!errors.soTienGoc}
                      errorMessage={errors.soTienGoc?.message}
                    />
                  )}
                />
              </div>

              <div className="flex gap-3">
                <Controller
                  control={control}
                  name="maNvxl"
                  render={({ field: { onChange, value } }) => (
                    <Autocomplete
                      isDisabled={!!selected}
                      className="@max-3xl:w-[calc(50%_-_calc(var(--spacing)_*_1.5))] @max-lg:w-full"
                      label="Nhân viên xử lý"
                      labelPlacement="outside"
                      placeholder="Chọn nhân viên xử lý"
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
                          nhanVienList.setInputValue('');
                          resetField('maNvxl');
                        }
                      }}
                      isInvalid={!!errors.maNvxl}
                      errorMessage={errors.maNvxl?.message}
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

                {!selected ? (
                  <>
                    {maKh && tenLhd === 'Gửi' ? (
                      <AutocompleteTkNguon control={control} maKh={maKh} />
                    ) : (
                      <div className="w-full" />
                    )}
                  </>
                ) : null}
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

type TkNguonProps = {
  control: Control<z.infer<typeof ValidateSchema>>;
  maKh: string;
};

const AutocompleteTkNguon: React.FC<TkNguonProps> = ({ control, maKh }) => {
  const { errors } = useFormState({ control });

  const taiKhoanList = useDebouncedAsyncList<Account>(
    async ({ signal, filterText }) => {
      const res = await api.get<IPaginated<Account>>(
        '/api/account',
        {
          maKh,
          tenLtk: ['Debit', 'Saving'],
          ...(filterText ? { q: filterText } : {}),
        },
        { signal },
      );
      return { items: res.data };
    },
  );

  return (
    <Controller
      control={control}
      name="maTkNguon"
      render={({ field: { onChange, value } }) => (
        <Autocomplete
          className="@max-3xl:w-[calc(50%_-_calc(var(--spacing)_*_1.5))] @max-lg:w-full"
          label="Tài khoản nguồn"
          labelPlacement="outside"
          placeholder="Chọn tài khoản nguồn"
          selectedKey={value}
          inputValue={taiKhoanList.inputValue}
          isLoading={taiKhoanList.isLoading}
          items={taiKhoanList.items}
          onInputChange={taiKhoanList.triggerFilter}
          onSelectionChange={(key) => {
            if (key && `${key}` !== `${value}`) {
              onChange(key);
              const item = taiKhoanList.items.find(
                (i) => `${i.maTk}` === `${key}`,
              );
              taiKhoanList.setInputValue(item?.maTk ?? '');
            }
          }}
          onClear={() => {
            onChange('');
            taiKhoanList.setInputValue('');
          }}
          isInvalid={!!errors.maTkNguon}
          errorMessage={errors.maTkNguon?.message}
        >
          {(item) => (
            <AutocompleteItem
              key={item.maTk}
              className="capitalize"
              endContent={
                <span className="text-xs text-neutral-500">
                  {item.loaiTk.tenLtk}
                </span>
              }
            >
              {item.maTk}
            </AutocompleteItem>
          )}
        </Autocomplete>
      )}
    />
  );
};

export default FormContract;
