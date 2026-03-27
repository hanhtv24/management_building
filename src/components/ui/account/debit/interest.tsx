import { useState } from 'react';

import { Button, addToast } from '@heroui/react';
import { IconMoneybagEdit } from '@tabler/icons-react';
import { KeyedMutator } from 'swr';

import { calcInterestDebit } from '@/lib/action/account';
import { Debit, IPaginated } from '@/types';

type Props = {
  selected: Debit;
  mutate: KeyedMutator<IPaginated<Debit>>;
};

const InterestDebit: React.FC<Props> = ({ selected, mutate }) => {
  const [loading, setLoading] = useState(false);

  const onCalcInterest = async () => {
    try {
      setLoading(true);
      await calcInterestDebit(selected.maTk, selected.thoiGian);
      mutate();
    } catch (error) {
      addToast({
        title: 'Tính lãi tín dụng thất bại',
        description: error.message,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
    </>
  );
};

export default InterestDebit;
