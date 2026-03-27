import { Button, useDisclosure } from '@heroui/react';
import { IconCreditCardPay } from '@tabler/icons-react';
import { KeyedMutator } from 'swr';

import { Debit, IPaginated } from '@/types';

import PaymentDebitModal from './modal/payment';

type Props = {
  selected: Debit;
  mutate: KeyedMutator<IPaginated<Debit>>;
};

const PaymentDebit: React.FC<Props> = ({ selected, mutate }) => {
  const disclosure = useDisclosure();

  return (
    <>
      <Button
        className="flex items-center gap-1 px-2 text-white"
        color="warning"
        onPress={disclosure.onOpen}
        startContent={<IconCreditCardPay className="h-4 w-4" />}
      >
        Thanh toán nợ
      </Button>

      {disclosure.isOpen && (
        <PaymentDebitModal
          selected={selected}
          mutate={mutate}
          {...disclosure}
        />
      )}
    </>
  );
};

export default PaymentDebit;
