import { Button, useDisclosure } from '@heroui/react';
import { IconCreditCardPay } from '@tabler/icons-react';
import { KeyedMutator } from 'swr';

import { Account, IPaginated } from '@/types';

import PaymentModal from './modal/payment';

type Props = {
  selected: Account;
  mutate: KeyedMutator<IPaginated<Account>>;
};

const Payment: React.FC<Props> = ({ selected, mutate }) => {
  const disclosure = useDisclosure();

  return (
    <>
      <Button
        className="flex items-center gap-1 px-2 text-white"
        color="primary"
        onPress={disclosure.onOpen}
        startContent={<IconCreditCardPay className="h-4 w-4" />}
      >
        Thanh toán
      </Button>

      {disclosure.isOpen && (
        <PaymentModal selected={selected} mutate={mutate} {...disclosure} />
      )}
    </>
  );
};

export default Payment;
