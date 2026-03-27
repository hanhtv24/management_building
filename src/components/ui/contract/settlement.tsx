'use client';

import React, { useMemo, useState } from 'react';

import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Form,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  NumberInput,
  addToast,
  useDisclosure,
} from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconMoneybag, IconMoneybagEdit } from '@tabler/icons-react';
import BigNumber from 'bignumber.js';
import { DateTime } from 'luxon';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { KeyedMutator } from 'swr';
import z from 'zod';

import { useDebouncedAsyncList } from '@/hooks/use-debounced-async-list';
import { calcInterest, settlement } from '@/lib/action/contract';
import { ERR_MSG } from '@/lib/constants';
import api from '@/lib/utils/api';
import { Account, Contract, IPaginated } from '@/types';

type Props = { selected: Contract; mutate: KeyedMutator<Contract> };

const SettlementContract: React.FC<Props> = ({ selected, mutate }) => {
  const disclosure = useDisclosure();
  const [loading, setLoading] = useState(false);

  const loaiHd = useMemo(
    () => (selected.loaiHd.tenLhd === 'Gửi' ? 'gui' : 'vay'),
    [selected],
  );

  const onCalcInterest = async () => {
    try {
      setLoading(true);
      await calcInterest(selected.maHd);
      mutate();
    } catch (error) {
      addToast({
        title: 'Tính lãi thất bại',
        description: error.message,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSettlement = async (
    maHd: string,
    maNvxl: string,
    soTien?: string,
    maTkNguon?: string,
  ) => {
    try {
      setLoading(true);
      if (loaiHd === 'gui') {
        await settlement(maHd, loaiHd, maNvxl);
      } else {
        await settlement(maHd, loaiHd, maNvxl, soTien, maTkNguon);
      }

      mutate();
    } catch (error) {
      addToast({
        title: 'Tất toán thất bại',
        description: error.message,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  if (selected.trangThai.tenTt === 'Kết thúc HD') {
    return;
  }

  return (
    <>
      {!selected.ngayTinhLai ||
      !DateTime.fromJSDate(new Date(selected.ngayTinhLai)).hasSame(
        DateTime.now(),
        'day',
      ) ? (
        <Button
          className="flex items-center gap-1 px-2 text-white"
          color="primary"
          isLoading={loading}
          isDisabled={loading}
          onPress={onCalcInterest}
          startContent={!loading && <IconMoneybagEdit className="h-4 w-4" />}
        >
          Tính lãi
        </Button>
      ) : (
        <>
          <Button
            className="flex items-center gap-1 px-2 text-white"
            color="success"
            isLoading={loading}
            isDisabled={loading}
            onPress={
              loaiHd === 'gui'
                ? async () =>
                    await onSettlement(selected.maHd, selected.nhanVien.maNv)
                : disclosure.onOpen
            }
            startContent={!loading && <IconMoneybag className="h-4 w-4" />}
          >
            Tất toán
          </Button>

          {loaiHd === 'vay' && (
            <ModalSettlement
              selected={selected}
              onSettlement={onSettlement}
              {...disclosure}
            />
          )}
        </>
      )}
    </>
  );
};

type ModalSettlementProps = {
  selected: Contract;
  onSettlement: (
    maHd: string,
    maNvxl: string,
    soTien?: string,
    maTkNguon?: string,
  ) => Promise<void>;
} & ReturnType<typeof useDisclosure>;

const ValidateSchema = z
  .object({
    hinhThuc: z.enum(['tienMat', 'taiKhoan'], {
      error: (val) => ERR_MSG.ENUM(val.values),
    }),
    soTien: z.int({ error: ERR_MSG.REQUIRED }).min(1, {
      error: (val) => ERR_MSG.MIN(val.minimum as number),
    }),
    maTkNguon: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.hinhThuc === 'taiKhoan') {
      if (!data.maTkNguon?.trim()) {
        ctx.addIssue({
          path: ['maTkNguon'],
          code: 'custom',
          message: ERR_MSG.REQUIRED,
        });
      }
    }
  });

const ModalSettlement: React.FC<ModalSettlementProps> = ({
  selected,
  onSettlement,
  isOpen,
  onOpenChange,
}) => {
  const taiKhoanList = useDebouncedAsyncList<Account>(
    async ({ signal, filterText }) => {
      const res = await api.get<IPaginated<Account>>(
        '/api/account',
        {
          maKh: selected.khachHang.maKh,
          tenLtk: ['Debit', 'Saving', 'Loan'],
          ...(filterText ? { q: filterText } : {}),
        },
        { signal },
      );
      return { items: res.data };
    },
  );

  const {
    control,
    watch,
    trigger,
    handleSubmit,
    formState: { errors, isSubmitting, submitCount },
  } = useForm<z.infer<typeof ValidateSchema>>({
    defaultValues: {
      hinhThuc: 'tienMat',
      soTien: new BigNumber(selected.soTienGoc)
        .plus(selected.soTienLai)
        .toNumber(),
      maTkNguon: '',
    },
    resolver: zodResolver(ValidateSchema),
  });

  const onSubmit: SubmitHandler<z.infer<typeof ValidateSchema>> = async (
    data,
  ) => {
    const numericKeys = ['soTien'] as const;

    const numericFields: Record<(typeof numericKeys)[number], string> =
      Object.fromEntries(
        numericKeys.map((key) => [key, String(data[key])]),
      ) as Record<(typeof numericKeys)[number], string>;

    try {
      await onSettlement(
        selected.maHd,
        selected.nhanVien.maNv,
        numericFields.soTien,
        data.maTkNguon,
      );
    } catch (e) {
      addToast({
        title: 'Tất toán thất bại',
        description: e.message,
        color: 'danger',
      });
      return;
    }

    onOpenChange();
  };

  const hinhThuc = watch('hinhThuc');

  return (
    <Modal
      size="lg"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={false}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Tất toán hợp đồng
            </ModalHeader>
            <Form
              className="flex flex-1 flex-col items-center gap-2"
              onSubmit={
                Object.keys(errors).length < 1
                  ? handleSubmit(onSubmit)
                  : undefined
              }
            >
              <ModalBody className="w-full">
                <Controller
                  control={control}
                  name="hinhThuc"
                  render={({ field: { onChange, value } }) => (
                    <Autocomplete
                      isClearable={false}
                      label="Hình thức"
                      labelPlacement="outside"
                      placeholder="Chọn hình thức"
                      defaultSelectedKey={value}
                      items={[
                        { key: 'tienMat', label: 'Tiền mặt' },
                        { key: 'taiKhoan', label: 'Tài khoản' },
                      ]}
                      onSelectionChange={(key) => {
                        if (key && `${key}` !== `${value}`) onChange(key);
                        if (submitCount) trigger();
                      }}
                      isInvalid={!!errors.hinhThuc}
                      errorMessage={errors.hinhThuc?.message}
                    >
                      {(item) => (
                        <AutocompleteItem key={item.key} className="capitalize">
                          {item.label}
                        </AutocompleteItem>
                      )}
                    </Autocomplete>
                  )}
                />

                {hinhThuc === 'taiKhoan' && (
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
                )}

                <Controller
                  control={control}
                  name="soTien"
                  render={({ field: { onChange, ...field } }) => (
                    <NumberInput
                      hideStepper
                      minValue={0}
                      step={1}
                      label="Số tiền thanh toán"
                      labelPlacement="outside"
                      placeholder="Nhập số tiền thanh toán"
                      {...field}
                      onValueChange={onChange}
                      isInvalid={!!errors.soTien}
                      errorMessage={errors.soTien?.message}
                    />
                  )}
                />
              </ModalBody>
              <ModalFooter className="w-full justify-center">
                <Button onPress={onClose}>Hủy</Button>
                <Button
                  type="submit"
                  className="text-white"
                  color="success"
                  isLoading={isSubmitting}
                  isDisabled={isSubmitting || Object.keys(errors).length > 0}
                >
                  Tất toán
                </Button>
              </ModalFooter>
            </Form>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default SettlementContract;
