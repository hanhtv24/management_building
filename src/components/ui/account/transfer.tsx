import { Button, useDisclosure } from '@heroui/react';
import { IconTransfer } from '@tabler/icons-react';
import { KeyedMutator } from 'swr';

import { Account, IPaginated } from '@/types';

import TransferModal from './modal/transfer';

type Props = {
  selected: Account;
  mutate: KeyedMutator<IPaginated<Account>>;
};

const Transfer: React.FC<Props> = ({ selected, mutate }) => {
  const disclosure = useDisclosure();

  return (
    <>
      <Button
        className="flex items-center gap-1 px-2 text-white"
        color="secondary"
        onPress={disclosure.onOpen}
        startContent={<IconTransfer className="h-4 w-4" />}
      >
        Chuyển tiền
      </Button>

      {disclosure.isOpen && (
        <TransferModal selected={selected} mutate={mutate} {...disclosure} />
      )}
    </>
  );
};

export default Transfer;
