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
  DatePicker,
  Form,
  Input,
  Select,
  SelectItem,
  addToast,
} from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CalendarDate,
  getLocalTimeZone,
  parseDate,
  today,
} from '@internationalized/date';
import { IconArrowLeft } from '@tabler/icons-react';
import { pick } from 'lodash';
import { DateTime } from 'luxon';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

import { addCustomer, editCustomer } from '@/lib/action/customer';
import {
  ERR_MSG,
  GioiTinh,
  GioiTinhView,
  LoaiKh,
  LoaiKhView,
} from '@/lib/constants';
import { Customer } from '@/types';

type Props = { selected?: Customer };

const CCCD_LEN = 12;
const MST_LEN = 20;

const ValidateSchema = z
  .object({
    loaiKh: z.enum(LoaiKh, { error: ERR_MSG.REQUIRED }),
    email: z.email({ error: ERR_MSG.EMAIL }),
    sdt: z
      .string()
      .nonempty({ error: ERR_MSG.REQUIRED })
      .length(10, {
        error: (val) => ERR_MSG.LENGTH((val.maximum || val.minimum) as number),
      })
      .regex(/^\d+$/, { error: ERR_MSG.NUMBER }),
    diaChi: z.string().nonempty({ error: ERR_MSG.REQUIRED }),
    tenKh: z.string().optional(),
    cccd: z.string().optional(),
    ngaySinh: z
      .string()
      .refine(
        (val) =>
          DateTime.fromISO(val).isValid &&
          DateTime.fromISO(val).toMillis() >=
            DateTime.fromISO('1970-01-01').toMillis(),
        {
          error: ERR_MSG.DATE,
        },
      )
      .optional(),
    gioiTinh: z.enum(GioiTinh, { error: ERR_MSG.REQUIRED }).optional(),
    tenDn: z.string().optional(),
    maSoThue: z.string().optional(),
    nguoiDaiDien: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.loaiKh === 'CN') {
      if (!data.tenKh?.trim()) {
        ctx.addIssue({
          path: ['tenKh'],
          code: 'custom',
          message: ERR_MSG.REQUIRED,
        });
      }
      if (!data.ngaySinh) {
        ctx.addIssue({
          path: ['ngaySinh'],
          code: 'custom',
          message: ERR_MSG.REQUIRED,
        });
      }
      if (!data.gioiTinh) {
        ctx.addIssue({
          path: ['gioiTinh'],
          code: 'custom',
          message: ERR_MSG.REQUIRED,
        });
      }
      if (!data.cccd?.trim()) {
        ctx.addIssue({
          path: ['cccd'],
          code: 'custom',
          message: ERR_MSG.REQUIRED,
        });
      } else if (!/^\d+$/.test(data.cccd)) {
        ctx.addIssue({
          path: ['cccd'],
          code: 'custom',
          message: ERR_MSG.NUMBER,
        });
      } else if (data.cccd.length !== CCCD_LEN) {
        ctx.addIssue({
          path: ['cccd'],
          code: 'custom',
          message: ERR_MSG.LENGTH(CCCD_LEN),
        });
      }
    }

    if (data.loaiKh === 'DN') {
      if (!data.tenDn?.trim()) {
        ctx.addIssue({
          path: ['tenDn'],
          code: 'custom',
          message: ERR_MSG.REQUIRED,
        });
      }

      if (!data.maSoThue?.trim()) {
        ctx.addIssue({
          path: ['maSoThue'],
          code: 'custom',
          message: ERR_MSG.REQUIRED,
        });
      } else if (!/^\d+$/.test(data.maSoThue)) {
        ctx.addIssue({
          path: ['maSoThue'],
          code: 'custom',
          message: ERR_MSG.NUMBER,
        });
      } else if (data.maSoThue.length !== MST_LEN) {
        ctx.addIssue({
          path: ['maSoThue'],
          code: 'custom',
          message: ERR_MSG.LENGTH(MST_LEN),
        });
      }

      if (!data.nguoiDaiDien?.trim()) {
        ctx.addIssue({
          path: ['nguoiDaiDien'],
          code: 'custom',
          message: ERR_MSG.REQUIRED,
        });
      }
    }
  });

const FormCustomer: React.FC<Props> = ({ selected }) => {
  const router = useRouter();

  const {
    control,
    watch,
    trigger,
    handleSubmit,
    formState: { errors, isSubmitting, submitCount, isDirty, dirtyFields },
  } = useForm<z.infer<typeof ValidateSchema>>({
    defaultValues: {
      loaiKh: selected ? (selected.loaiKh as LoaiKh) : LoaiKh.CN,
      email: selected?.email ?? '',
      sdt: selected?.sdt ?? '',
      diaChi: selected?.diaChi ?? '',
      tenKh: selected?.cn?.tenKh ?? '',
      cccd: selected?.cn?.cccd ?? '',
      ngaySinh: selected?.cn?.ngaySinh ?? DateTime.now().toISODate(),
      gioiTinh: (selected?.cn?.gioiTinh as GioiTinh) ?? GioiTinh.Nam,
      tenDn: selected?.dn?.tenDn ?? '',
      maSoThue: selected?.dn?.maSoThue ?? '',
      nguoiDaiDien: selected?.dn?.nguoiDaiDien ?? '',
    },
    resolver: zodResolver(ValidateSchema),
  });

  const onSubmit: SubmitHandler<z.infer<typeof ValidateSchema>> = async (
    data,
  ) => {
    if (selected) {
      const dirtyOnly = pick(data, Object.keys(dirtyFields));

      try {
        await editCustomer(selected.maKh, dirtyOnly);
      } catch (e) {
        addToast({
          title: 'Sửa khách hàng thất bại',
          description: e.message,
          color: 'danger',
        });
        return;
      }
    } else {
      try {
        await addCustomer(data);
      } catch (e) {
        addToast({
          title: 'Thêm khách hàng thất bại',
          description: e.message,
          color: 'danger',
        });
        return;
      }
    }

    router.push('/customer');
  };

  const loaiKh = watch('loaiKh');

  return (
    <div className="-m-3 flex flex-1 flex-col gap-3 overflow-hidden p-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-foreground flex items-center gap-2 text-xl font-bold">
          <Link href="/customer" className="block cursor-pointer">
            <IconArrowLeft />
          </Link>
          {selected ? 'Sửa' : 'Thêm'} khách hàng
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
                  label="Mã khách hàng"
                  labelPlacement="outside"
                  isDisabled
                  value={selected?.maKh}
                />
              )}

              <div className="flex gap-3">
                <Controller
                  control={control}
                  name="loaiKh"
                  render={({ field: { onChange, value } }) => (
                    <Autocomplete
                      isClearable={false}
                      label="Loại khách hàng"
                      labelPlacement="outside"
                      placeholder="Chọn loại khách hàng"
                      defaultSelectedKey={value}
                      isDisabled={!!selected}
                      items={Object.values(LoaiKh).map((e) => ({
                        key: e,
                        label: LoaiKhView[e],
                      }))}
                      onSelectionChange={(key) => {
                        if (key && `${key}` !== `${value}`) onChange(key);
                        if (submitCount) trigger();
                      }}
                      isInvalid={!!errors.loaiKh}
                      errorMessage={errors.loaiKh?.message}
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
                  name="email"
                  render={({ field: { onChange, ...field } }) => (
                    <Input
                      label="Email"
                      labelPlacement="outside"
                      placeholder="Nhập Email"
                      {...field}
                      onValueChange={onChange}
                      isInvalid={!!errors.email}
                      errorMessage={errors.email?.message}
                    />
                  )}
                />
              </div>

              <div className="flex gap-3">
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
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h4 className="text-lg">
                Thông tin {loaiKh === 'CN' ? 'cá nhân' : 'doanh nghiệp'}
              </h4>
            </CardHeader>
            <CardBody className="flex flex-col gap-3">
              <div className="flex gap-3">
                {loaiKh === LoaiKh.CN && (
                  <>
                    <Controller
                      control={control}
                      name="tenKh"
                      render={({ field: { onChange, ...field } }) => (
                        <Input
                          label="Tên khách hàng"
                          labelPlacement="outside"
                          placeholder="Nhập tên khách hàng"
                          {...field}
                          onValueChange={onChange}
                          isInvalid={!!errors.tenKh}
                          errorMessage={errors.tenKh?.message}
                        />
                      )}
                    />
                    <Controller
                      control={control}
                      name="ngaySinh"
                      render={({ field: { onChange, value } }) => (
                        <DatePicker
                          hideTimeZone
                          showMonthAndYearPickers
                          hourCycle={24}
                          granularity="day"
                          label="Ngày sinh"
                          labelPlacement="outside"
                          firstDayOfWeek="mon"
                          minValue={new CalendarDate(1970, 1, 1)}
                          maxValue={today(getLocalTimeZone())}
                          value={parseDate(value ?? DateTime.now().toISODate())}
                          onChange={(value) => onChange(value?.toString())}
                          classNames={{
                            calendarContent:
                              '[&_[data-slot="header-wrapper"]]:px-2 [&_[data-slot="header-wrapper"]]:gap-1 [&_[data-slot="header"]]:px-1.5 [&_[data-slot="header"]]:gap-1 [&_[data-slot="header"]_[data-slot="title"]]:capitalize [&_[data-slot="grid-header-row"]]:px-2 [&_[data-slot="grid-header-cell"]]:w-full [&_[data-slot="grid-body-row"]]:px-2 [&_[data-slot="cell"]]:w-full',
                            timeInput: 'px-2 pb-2',
                          }}
                          timeInputProps={{ label: 'Thời gian' }}
                          isInvalid={!!errors.ngaySinh}
                          errorMessage={errors.ngaySinh?.message}
                        />
                      )}
                    />
                  </>
                )}

                {loaiKh === LoaiKh.DN && (
                  <>
                    <Controller
                      control={control}
                      name="tenDn"
                      render={({ field: { onChange, ...field } }) => (
                        <Input
                          label="Tên doanh nghiệp"
                          labelPlacement="outside"
                          placeholder="Nhập tên doanh nghiệp"
                          {...field}
                          onValueChange={onChange}
                          isInvalid={!!errors.tenDn}
                          errorMessage={errors.tenDn?.message}
                        />
                      )}
                    />
                    <Controller
                      control={control}
                      name="maSoThue"
                      render={({ field: { onChange, ...field } }) => (
                        <Input
                          label="Mã số thuế"
                          labelPlacement="outside"
                          placeholder="Nhập mã số thuế"
                          {...field}
                          onValueChange={onChange}
                          isInvalid={!!errors.maSoThue}
                          errorMessage={errors.maSoThue?.message}
                        />
                      )}
                    />
                  </>
                )}
              </div>

              <div className="flex gap-3">
                {loaiKh === LoaiKh.CN && (
                  <>
                    <Controller
                      control={control}
                      name="gioiTinh"
                      render={({ field: { onChange, value } }) => (
                        <Select
                          label="Giới tính"
                          labelPlacement="outside"
                          placeholder="Chọn giới tính"
                          selectedKeys={value ? [value] : []}
                          items={Object.values(GioiTinh).map((e) => ({
                            key: e,
                            label: GioiTinhView[e],
                          }))}
                          onChange={(e) => {
                            const key = e.target.value;
                            if (key && `${key}` !== `${value}`) onChange(key);
                          }}
                          isInvalid={!!errors.gioiTinh}
                          errorMessage={errors.gioiTinh?.message}
                        >
                          {(item) => (
                            <SelectItem key={item.key} className="capitalize">
                              {item.label}
                            </SelectItem>
                          )}
                        </Select>
                      )}
                    />

                    <Controller
                      control={control}
                      name="cccd"
                      render={({ field: { onChange, ...field } }) => (
                        <Input
                          label="CCCD"
                          labelPlacement="outside"
                          placeholder="Nhập CCCD"
                          {...field}
                          onValueChange={onChange}
                          isInvalid={!!errors.cccd}
                          errorMessage={errors.cccd?.message}
                        />
                      )}
                    />
                  </>
                )}

                {loaiKh === LoaiKh.DN && (
                  <>
                    <Controller
                      control={control}
                      name="nguoiDaiDien"
                      render={({ field: { onChange, ...field } }) => (
                        <Input
                          label="Người đại diện"
                          labelPlacement="outside"
                          placeholder="Nhập người đại diện"
                          {...field}
                          onValueChange={onChange}
                          isInvalid={!!errors.nguoiDaiDien}
                          errorMessage={errors.nguoiDaiDien?.message}
                        />
                      )}
                    />
                    <div className="w-full"></div>
                  </>
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

export default FormCustomer;
