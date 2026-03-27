import { Button, useDisclosure } from '@heroui/react';
import { IconCreditCardPay } from '@tabler/icons-react';
import { KeyedMutator } from 'swr';

import { Account, IPaginated } from '@/types';

import WithdrawModal from './modal/withdraw';

type Props = {
  selected: Account;
  mutate: KeyedMutator<IPaginated<Account>>;
};

const Withdraw: React.FC<Props> = ({ selected, mutate }) => {
  const disclosure = useDisclosure();

  return (
    <>
      <Button
        className="flex items-center gap-1 px-2 text-white"
        color="danger"
        onPress={disclosure.onOpen}
        startContent={<IconCreditCardPay className="h-4 w-4" />}
      >
        Rút tiền
      </Button>

      {disclosure.isOpen && (
        <WithdrawModal selected={selected} mutate={mutate} {...disclosure} />
      )}
    </>
  );
};

export default Withdraw;
