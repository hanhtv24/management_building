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
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { KeyedMutator } from 'swr';
import { z } from 'zod';

import { useDebouncedAsyncList } from '@/hooks/use-debounced-async-list';
import { paymentMoney } from '@/lib/action/account';
import { ERR_MSG } from '@/lib/constants';
import api from '@/lib/utils/api';
import { Account, Employee, IPaginated } from '@/types';

type Props = {
  selected: Account;
  mutate: KeyedMutator<IPaginated<Account>>;
} & ReturnType<typeof useDisclosure>;

const ValidateSchema = z.object({
  maTkNguon: z.string().nonempty({ error: ERR_MSG.REQUIRED }),
  maTkDich: z.string().nonempty({ error: ERR_MSG.REQUIRED }),
  maNvxl: z.string().nonempty({ error: ERR_MSG.REQUIRED }),
  soTien: z.int({ error: ERR_MSG.REQUIRED }).min(1, {
    error: (val) => ERR_MSG.MIN(val.minimum as number),
  }),
  noiDung: z.string().nonempty({ error: ERR_MSG.REQUIRED }),
});

const PaymentModal: React.FC<Props> = ({
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

      const items = Array.from(
        new Map(
          [...res.data, selected.nhanVien].map((item) => [item.maNv, item]),
        ).values(),
      );

      return { items };
    },
    selected ? `${selected.nhanVien.tenNv}` : '',
  );

  const taiKhoanList = useDebouncedAsyncList<Account>(
    async ({ signal, filterText }) => {
      const res = await api.get<IPaginated<Account>>(
        '/api/account',
        {
          maTkNguon: selected.maTk,
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
    resetField,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<z.infer<typeof ValidateSchema>>({
    defaultValues: {
      maTkNguon: selected.maTk,
      maTkDich: '',
      maNvxl: selected.nhanVien.maNv,
      soTien: 1,
      noiDung: `Thanh toán từ tài khoản ${selected.maTk}`,
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
      await paymentMoney({ ...rest, ...numericFields });
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
              Thanh toán
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
                  name="maTkNguon"
                  render={({ field: { value } }) => (
                    <Input
                      label="Mã tài khoản nguồn"
                      labelPlacement="outside"
                      isDisabled
                      value={value}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="maTkDich"
                  render={({ field: { onChange, value } }) => (
                    <Autocomplete
                      allowsCustomValue
                      className="@max-3xl:w-[calc(50%_-_calc(var(--spacing)_*_1.5))] @max-lg:w-full"
                      label="Mã tài khoản đích"
                      labelPlacement="outside"
                      placeholder="Chọn mã tài khoản đích"
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
                      onBlur={(e) => {
                        if (!value) onChange(e.currentTarget.value);
                      }}
                      isInvalid={!!errors.maTkDich}
                      errorMessage={errors.maTkDich?.message}
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
                      onBlur={() => {
                        if (!value) {
                          nhanVienList.setInputValue(
                            selected?.nhanVien.tenNv ?? '',
                          );
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

                <Controller
                  control={control}
                  name="soTien"
                  render={({ field: { onChange, ...field } }) => (
                    <NumberInput
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
                  name="noiDung"
                  render={({ field: { onChange, ...field } }) => (
                    <Input
                      label="Nội dung"
                      labelPlacement="outside"
                      placeholder="Nhập nội dung"
                      {...field}
                      onChange={onChange}
                    />
                  )}
                />
              </ModalBody>
              <ModalFooter className="w-full justify-center">
                <Button onPress={onClose}>Hủy</Button>
                <Button
                  type="submit"
                  className="text-white"
                  color="primary"
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

export default PaymentModal;
