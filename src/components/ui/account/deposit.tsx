import { Button, useDisclosure } from '@heroui/react';
import { IconCreditCardRefund } from '@tabler/icons-react';
import { KeyedMutator } from 'swr';

import { Account, IPaginated } from '@/types';

import DepositModal from './modal/deposit';

type Props = {
  selected: Account;
  mutate: KeyedMutator<IPaginated<Account>>;
};

const Deposit: React.FC<Props> = ({ selected, mutate }) => {
  const disclosure = useDisclosure();

  return (
    <>
      <Button
        className="flex items-center gap-1 px-2 text-white"
        color="success"
        onPress={disclosure.onOpen}
        startContent={<IconCreditCardRefund className="h-4 w-4" />}
      >
        Gửi tiền
      </Button>

      {disclosure.isOpen && (
        <DepositModal selected={selected} mutate={mutate} {...disclosure} />
      )}
    </>
  );
};

export default Deposit;
