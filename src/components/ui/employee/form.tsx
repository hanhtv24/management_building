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

import { useDebouncedAsyncList } from '@/hooks/use-debounced-async-list';
import { addEmployee, editEmployee } from '@/lib/action/employee';
import { ERR_MSG, GioiTinh, GioiTinhView } from '@/lib/constants';
import api from '@/lib/utils/api';
import { Branch, Employee, IPaginated, Position } from '@/types';

type Props = { selected?: Employee };

const ValidateSchema = z.object({
  tenNv: z.string().nonempty({ error: ERR_MSG.REQUIRED }),
  sdt: z
    .string()
    .nonempty({ error: ERR_MSG.REQUIRED })
    .length(10, {
      error: (val) => ERR_MSG.LENGTH((val.maximum || val.minimum) as number),
    })
    .regex(/^\d+$/, { error: ERR_MSG.NUMBER }),
  email: z.email({ error: ERR_MSG.EMAIL }),
  diaChi: z.string().nonempty({ error: ERR_MSG.REQUIRED }),
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
    ),
  gioiTinh: z.enum(GioiTinh, { error: ERR_MSG.REQUIRED }),
  maCv: z.string().nonempty({ error: ERR_MSG.REQUIRED }),
  maCn: z.string().nonempty({ error: ERR_MSG.REQUIRED }),
});

const FormEmployee: React.FC<Props> = ({ selected }) => {
  const router = useRouter();

  const chucVuList = useDebouncedAsyncList<Position>(
    async ({ signal, filterText }) => {
      const res = await api.get<IPaginated<Position>>(
        '/api/position',
        filterText ? { q: filterText } : {},
        { signal },
      );
      return { items: res.data };
    },
    selected ? selected.chucVu.tenCv : '',
  );

  const chiNhanhList = useDebouncedAsyncList<Branch>(
    async ({ signal, filterText }) => {
      const res = await api.get<IPaginated<Branch>>(
        '/api/branch',
        filterText ? { q: filterText } : {},
        { signal },
      );
      return { items: res.data };
    },
    selected ? selected.chiNhanh.tenCn : '',
  );

  const {
    control,
    resetField,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<z.infer<typeof ValidateSchema>>({
    defaultValues: {
      tenNv: selected ? selected.tenNv : '',
      sdt: selected?.sdt ?? '',
      email: selected ? selected.email : '',
      diaChi: selected?.diaChi ?? '',
      ngaySinh: selected?.ngaySinh ?? DateTime.now().toISODate(),
      gioiTinh: (selected?.gioiTinh as GioiTinh) ?? GioiTinh.Nam,
      maCv: selected?.chucVu.maCv ?? '',
      maCn: selected?.chiNhanh.maCn ?? '',
    },
    resolver: zodResolver(ValidateSchema),
  });

  const onSubmit: SubmitHandler<z.infer<typeof ValidateSchema>> = async (
    data,
  ) => {
    if (selected) {
      const dirtyOnly = pick(data, Object.keys(dirtyFields));

      try {
        await editEmployee(selected.maNv, dirtyOnly);
      } catch (e) {
        addToast({
          title: 'Sửa nhân viên thất bại',
          description: e.message,
          color: 'danger',
        });
        return;
      }
    } else {
      try {
        await addEmployee(data);
      } catch (e) {
        addToast({
          title: 'Thêm nhân viên thất bại',
          description: e.message,
          color: 'danger',
        });
        return;
      }
    }

    router.push('/employee');
  };

  return (
    <div className="-m-3 flex flex-1 flex-col gap-3 overflow-hidden p-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-foreground flex items-center gap-2 text-xl font-bold">
          <Link href="/employee" className="block cursor-pointer">
            <IconArrowLeft />
          </Link>
          {selected ? 'Sửa' : 'Thêm'} nhân viên
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
                    label="Mã nhân viên"
                    labelPlacement="outside"
                    isDisabled
                    value={selected?.maNv}
                  />
                )}

                <Controller
                  control={control}
                  name="tenNv"
                  render={({ field: { onChange, ...field } }) => (
                    <Input
                      label="Tên nhân viên"
                      labelPlacement="outside"
                      placeholder="Nhập tên"
                      {...field}
                      onValueChange={onChange}
                      isInvalid={!!errors.tenNv}
                      errorMessage={errors.tenNv?.message}
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

                <Controller
                  control={control}
                  name="gioiTinh"
                  render={({ field: { onChange, value } }) => (
                    <Select
                      label="Giới tính"
                      labelPlacement="outside"
                      placeholder="Chọn giới tính"
                      selectedKeys={[value]}
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
              </div>

              <div className="flex gap-3">
                <Controller
                  control={control}
                  name="maCv"
                  render={({ field: { onChange, value } }) => (
                    <Autocomplete
                      className="@max-3xl:w-[calc(50%_-_calc(var(--spacing)_*_1.5))] @max-lg:w-full"
                      label="Chức vụ"
                      labelPlacement="outside"
                      placeholder="Chọn chức vụ"
                      selectedKey={value}
                      inputValue={chucVuList.inputValue}
                      isLoading={chucVuList.isLoading}
                      items={chucVuList.items}
                      onInputChange={chucVuList.triggerFilter}
                      onSelectionChange={(key) => {
                        if (key && `${key}` !== `${value}`) {
                          onChange(key);
                          const item = chucVuList.items.find(
                            (i) => `${i.maCv}` === `${key}`,
                          );
                          chucVuList.setInputValue(item?.tenCv ?? '');
                        }
                      }}
                      onClear={() => {
                        onChange('');
                        chucVuList.setInputValue('');
                      }}
                      onBlur={() => {
                        if (!value) {
                          chucVuList.setInputValue(
                            selected?.chucVu?.tenCv ?? '',
                          );
                          resetField('maCv');
                        }
                      }}
                      isInvalid={!!errors.maCv}
                      errorMessage={errors.maCv?.message}
                    >
                      {(item) => (
                        <AutocompleteItem
                          key={item.maCv}
                          className="capitalize"
                          endContent={
                            <span className="text-xs text-neutral-500">
                              {item.maCv}
                            </span>
                          }
                        >
                          {item.tenCv}
                        </AutocompleteItem>
                      )}
                    </Autocomplete>
                  )}
                />

                <Controller
                  control={control}
                  name="maCn"
                  render={({ field: { onChange, value } }) => (
                    <Autocomplete
                      className="@max-3xl:w-[calc(50%_-_calc(var(--spacing)_*_1.5))] @max-lg:w-full"
                      label="Chi nhánh"
                      labelPlacement="outside"
                      placeholder="Chọn chi nhánh"
                      selectedKey={value}
                      inputValue={chiNhanhList.inputValue}
                      isLoading={chiNhanhList.isLoading}
                      items={chiNhanhList.items}
                      onInputChange={chiNhanhList.triggerFilter}
                      onSelectionChange={(key) => {
                        if (key && `${key}` !== `${value}`) {
                          onChange(key);
                          const item = chiNhanhList.items.find(
                            (i) => `${i.maCn}` === `${key}`,
                          );
                          chiNhanhList.setInputValue(item?.tenCn ?? '');
                        }
                      }}
                      onClear={() => {
                        onChange('');
                        chiNhanhList.setInputValue('');
                      }}
                      onBlur={() => {
                        if (!value) {
                          chiNhanhList.setInputValue(
                            selected?.chiNhanh?.tenCn ?? '',
                          );
                          resetField('maCn');
                        }
                      }}
                      isInvalid={!!errors.maCn}
                      errorMessage={errors.maCn?.message}
                    >
                      {(item) => (
                        <AutocompleteItem
                          key={item.maCn}
                          className="capitalize"
                          endContent={
                            <span className="text-xs text-neutral-500">
                              {item.maCn}
                            </span>
                          }
                        >
                          {item.tenCn}
                        </AutocompleteItem>
                      )}
                    </Autocomplete>
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

export default FormEmployee;
