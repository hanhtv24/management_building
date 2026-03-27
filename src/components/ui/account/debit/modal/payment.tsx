import React from 'react';

import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Form,
  Input,
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
import BigNumber from 'bignumber.js';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { KeyedMutator } from 'swr';
import { z } from 'zod';

import { useDebouncedAsyncList } from '@/hooks/use-debounced-async-list';
import { paymentDebit } from '@/lib/action/account';
import { ERR_MSG } from '@/lib/constants';
import api from '@/lib/utils/api';
import { Account, Debit, Employee, IPaginated } from '@/types';

type Props = {
  selected: Debit;
  mutate: KeyedMutator<IPaginated<Debit>>;
} & ReturnType<typeof useDisclosure>;

const ValidateSchema = z.object({
  maTkNo: z.string().nonempty({ error: ERR_MSG.REQUIRED }),
  maNvxl: z.string().nonempty({ error: ERR_MSG.REQUIRED }),
  soTien: z
    .int({ error: ERR_MSG.REQUIRED })
    .min(1, { error: (val) => ERR_MSG.MIN(val.minimum as number) }),
  maTkNguon: z.string().nonempty({ error: ERR_MSG.REQUIRED }).optional(),
});

const PaymentDebitModal: React.FC<Props> = ({
  selected,
  mutate,
  isOpen,
  onOpenChange,
}) => {
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

  const taiKhoanList = useDebouncedAsyncList<Account>(
    async ({ signal, filterText }) => {
      const res = await api.get<IPaginated<Account>>(
        '/api/account',
        {
          maKh: selected.maKh,
          tenLtk: ['Debit'],
          ...(filterText ? { q: filterText } : {}),
        },
        { signal },
      );
      return { items: res.data };
    },
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<z.infer<typeof ValidateSchema>>({
    defaultValues: {
      maTkNo: selected.maTk,
      maNvxl: '',
      soTien: new BigNumber(selected.soTienGoc)
        .plus(selected.soTienLai)
        .minus(selected.tienDaTra)
        .toNumber(),
      maTkNguon: undefined,
    },
    resolver: zodResolver(ValidateSchema),
  });

  const onSubmit: SubmitHandler<z.infer<typeof ValidateSchema>> = async (
    data,
  ) => {
    const { soTien, ...rest } = data;

    const numericKeys = ['soTien'] as const;

    const numericFields: Record<(typeof numericKeys)[number], string> =
      Object.fromEntries(
        numericKeys.map((key) => [key, String(data[key])]),
      ) as Record<(typeof numericKeys)[number], string>;

    try {
      await paymentDebit({ ...rest, ...numericFields });
    } catch (e) {
      addToast({
        title: 'Thanh toán thất bại',
        description: e.message,
        color: 'danger',
      });
      return;
    }

    mutate();
    onOpenChange();
  };

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
              Thanh toán nợ
            </ModalHeader>
            <Form
              className="flex flex-1 flex-col items-center gap-2"
              onSubmit={
                Object.keys(errors).length < 1 && isDirty
                  ? handleSubmit(onSubmit)
                  : undefined
              }
            >
              <ModalBody className="w-full">
                <Controller
                  control={control}
                  name="maTkNo"
                  render={({ field: { value } }) => (
                    <Input
                      label="Mã tài khoản nợ"
                      labelPlacement="outside"
                      isDisabled
                      value={value}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="maNvxl"
                  render={({ field: { onChange, value } }) => (
                    <Autocomplete
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

                <Controller
                  control={control}
                  name="soTien"
                  render={({ field: { onChange, ...field } }) => (
                    <NumberInput
                      isDisabled
                      hideStepper
                      minValue={0}
                      step={1}
                      label="Số tiền gửi"
                      labelPlacement="outside"
                      placeholder="Nhập số tiền gửi"
                      {...field}
                      onValueChange={onChange}
                      isInvalid={!!errors.soTien}
                      errorMessage={errors.soTien?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="maTkNguon"
                  render={({ field: { onChange, value } }) => (
                    <Autocomplete
                      className="@max-3xl:w-[calc(50%_-_calc(var(--spacing)_*_1.5))] @max-lg:w-full"
                      label="Mã tài khoản nguồn"
                      labelPlacement="outside"
                      placeholder="Chọn mã tài khoản nguồn"
                      selectedKey={value}
                      inputValue={taiKhoanList.inputValue}
                      isLoading={taiKhoanList.isLoading}
                      items={taiKhoanList.items}
                      onInputChange={taiKhoanList.triggerFilter}
                      onSelectionChange={(key) => {
                        if (key && `${key}` !== `${value || ''}`) {
                          onChange(key);
                          const item = taiKhoanList.items.find(
                            (i) => `${i.maTk}` === `${key}`,
                          );
                          taiKhoanList.setInputValue(item?.maTk ?? '');
                        }
                      }}
                      onClear={() => {
                        onChange(undefined);
                        taiKhoanList.setInputValue('');
                      }}
                      onBlur={(e) => {
                        if (!value && e.currentTarget.value.trim())
                          taiKhoanList.triggerFilter('');
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
                              {Number(item.soDu).toLocaleString('vi-VN')}
                            </span>
                          }
                        >
                          {item.maTk}
                        </AutocompleteItem>
                      )}
                    </Autocomplete>
                  )}
                />
              </ModalBody>
              <ModalFooter className="w-full justify-center">
                <Button onPress={onClose}>Hủy</Button>
                <Button
                  type="submit"
                  className="text-white"
                  color="warning"
                  isLoading={isSubmitting}
                  isDisabled={
                    isSubmitting || Object.keys(errors).length > 0 || !isDirty
                  }
                >
                  Thanh toán
                </Button>
              </ModalFooter>
            </Form>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default PaymentDebitModal;
