import { Button, Form, Select, SelectItem } from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { DateTime } from 'luxon';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

import { ERR_MSG } from '@/lib/constants';
import { TFilter } from '@/types';

type Props = {
  filter: TFilter;
  setFilter: React.Dispatch<React.SetStateAction<TFilter>>;
};

const ValidateSchema = z.object({
  thang: z
    .string()
    .nonempty({ error: ERR_MSG.REQUIRED })
    .transform((val) => (!val ? undefined : Number(val)))
    .refine((val) => !val || (val >= 1 && val <= 12), {
      error: ERR_MSG.RANGE(1, 12),
    }),
  nam: z
    .string()
    .nonempty({ error: ERR_MSG.REQUIRED })
    .transform((val) => (!val ? undefined : Number(val)))
    .refine((val) => !val || (val >= 1970 && val <= new Date().getFullYear()), {
      error: ERR_MSG.RANGE(1970, new Date().getFullYear()),
    }),
});

const FilterDashboardInterest: React.FC<Props> = ({ filter, setFilter }) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      thang: filter.thoiGian
        ? `${DateTime.fromISO(filter.thoiGian).month}`
        : `${DateTime.now().month}`,
      nam: filter.thoiGian
        ? `${DateTime.fromISO(filter.thoiGian).year}`
        : `${DateTime.now().year}`,
    },
    resolver: zodResolver(ValidateSchema),
  });

  const onSubmit: SubmitHandler<z.infer<typeof ValidateSchema>> = ({
    thang,
    nam,
    ...data
  }) => {
    let thoiGian = '';

    if (nam && thang) {
      thoiGian = DateTime.fromJSDate(new Date(+nam, +thang - 1, 1)).toFormat(
        'yyyy-MM-dd',
      );
    }

    setFilter((prev) => ({ ...prev, ...data, thoiGian, page: 1 }));
  };

  return (
    <Form
      className="flex flex-1 gap-3"
      onSubmit={
        Object.keys(errors).length > 0 ? undefined : handleSubmit(onSubmit)
      }
    >
      <Controller
        control={control}
        name="thang"
        render={({ field: { onChange, value } }) => (
          <Select
            label="Tháng"
            labelPlacement="outside"
            placeholder="Chọn tháng"
            selectedKeys={[value]}
            items={Array.from({ length: 12 }, (_, i) => i + 1).map((m) => ({
              key: `${m}`,
              label: `${m}`,
            }))}
            onChange={(e) => {
              const key = e.target.value;
              if (key && `${key}` !== `${value}`) onChange(key);
            }}
            isInvalid={!!errors.thang}
            errorMessage={errors.thang?.message}
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
        name="nam"
        render={({ field: { onChange, value } }) => (
          <Select
            label="Năm"
            labelPlacement="outside"
            placeholder="Chọn năm"
            selectedKeys={[value]}
            items={Array.from(
              { length: 10 },
              (_, i) => new Date().getFullYear() - i,
            ).map((m) => ({
              key: `${m}`,
              label: `${m}`,
            }))}
            onChange={(e) => {
              const key = e.target.value;
              if (key && `${key}` !== `${value}`) onChange(key);
            }}
            isInvalid={!!errors.nam}
            errorMessage={errors.nam?.message}
          >
            {(item) => (
              <SelectItem key={item.key} className="capitalize">
                {item.label}
              </SelectItem>
            )}
          </Select>
        )}
      />

      <Button
        type="submit"
        isLoading={isSubmitting}
        isDisabled={isSubmitting || Object.keys(errors).length > 0}
      >
        Tìm kiếm
      </Button>
    </Form>
  );
};

export default FilterDashboardInterest;
