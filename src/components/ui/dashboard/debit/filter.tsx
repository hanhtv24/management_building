import { Button, Form, Input } from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconSearch } from '@tabler/icons-react';
import { DateTime } from 'luxon';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

import { TFilter } from '@/types';

type Props = {
  filter: TFilter;
  setFilter: React.Dispatch<React.SetStateAction<TFilter>>;
};

const ValidateSchema = z.object({
  q: z.string().optional(),
});

const FilterDashboardDebit: React.FC<Props> = ({ filter, setFilter }) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { q: filter.q || '' },
    resolver: zodResolver(ValidateSchema),
  });

  const onSubmit: SubmitHandler<z.infer<typeof ValidateSchema>> = (data) => {
    const thoiGian = DateTime.fromJSDate(new Date())
      .startOf('month')
      .toISODate();

    setFilter((prev) => ({ ...prev, ...data, thoiGian, page: 1 }));
  };

  return (
    <div className="@container flex flex-col">
      <Form
        className="flex flex-row justify-end gap-3 @max-2xl:flex-wrap"
        onSubmit={
          Object.keys(errors).length > 0 ? undefined : handleSubmit(onSubmit)
        }
      >
        <div className="flex w-full gap-3 @max-lg:flex-wrap">
          <Controller
            control={control}
            name="q"
            render={({ field: { onChange, ...field } }) => (
              <Input
                label="Từ khoá"
                labelPlacement="outside"
                placeholder="Nhập Mã TK / Tên KH"
                startContent={<IconSearch className="h-4 w-4 text-gray-400" />}
                {...field}
                onValueChange={onChange}
              />
            )}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-small text-foreground invisible @max-2xl:hidden">
            A
          </label>
          <Button
            type="submit"
            isLoading={isSubmitting}
            isDisabled={isSubmitting || Object.keys(errors).length > 0}
          >
            Tìm kiếm
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default FilterDashboardDebit;
