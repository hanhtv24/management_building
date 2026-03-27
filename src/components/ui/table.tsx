'use client';

import { usePathname } from 'next/navigation';
import { Dispatch, ReactNode, SetStateAction, useState } from 'react';

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Selection,
  addToast,
  useDisclosure,
} from '@heroui/react';
import { omitBy } from 'lodash';
import useSWR, { KeyedMutator } from 'swr';

import { INIT_FILTER, INIT_META } from '@/lib/constants';
import { IPaginated, TFilter, TTable } from '@/types';

type Props = {
  title: string;
  url: string;

  isAllowRemove?: boolean;
  onRemove?: (id: string) => Promise<void>;

  renderAction?: (
    args: {
      pathname: string;
      data: IPaginated['data'];
      selectedKeys: Selection;
      mutate: KeyedMutator<IPaginated>;
    } & Pick<ReturnType<typeof useDisclosure>, 'onOpen'>,
  ) => ReactNode;
  renderFilter?: (args: {
    filter: TFilter;
    setFilter: Dispatch<SetStateAction<TFilter>>;
  }) => ReactNode;
  renderContent?: (args: TTable) => ReactNode;
};

const TablePage: React.FC<Props> = ({
  title,
  url,
  isAllowRemove = false,
  onRemove: onRemoveProps,
  renderAction,
  renderFilter,
  renderContent,
}) => {
  const pathname = usePathname();

  const [filter, setFilter] = useState<TFilter>(INIT_FILTER);
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const {
    data = { data: [], meta: INIT_META },
    isLoading,
    mutate,
  } = useSWR<IPaginated>([url, omitBy(filter, (value) => !value)]);

  const onRemove = async (id: string) => {
    if (!onRemoveProps) {
      addToast({
        title: 'Xóa thất bại',
        description: 'Không tìm thấy hàm xóa bản ghi',
        color: 'danger',
      });
      return;
    }

    try {
      await onRemoveProps(id);
    } catch (e) {
      addToast({
        title: 'Xóa thất bại',
        description: e.message,
        color: 'danger',
      });
      return;
    }

    if (filter.page > 1) {
      setFilter((prev) => ({ ...prev, page: prev.page - 1 }));
    } else {
      mutate();
      setSelectedKeys(new Set());
    }
  };

  return (
    <div className="-m-3 grid flex-1 grid-rows-[auto_1fr] gap-3 overflow-hidden p-3">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h1 className="text-foreground text-3xl font-bold">{title}</h1>
            {/* <p className="text-zinc-400">
              Manage your data records with full CRUD operations
            </p> */}
          </div>

          {/* <Button className="bg-default/60 flex items-center gap-2">
            <IconFilter className="h-4 w-4" />
            Xuất dữ liệu
          </Button> */}

          <div className="flex gap-2">
            {renderAction?.({
              pathname,
              data: data.data,
              selectedKeys,
              mutate,
              onOpen,
            })}
          </div>
        </div>

        {/* Filters */}
        {renderFilter?.({
          filter,
          setFilter: (value) => {
            setFilter(value);
            setSelectedKeys(new Set());
          },
        })}
      </div>

      {renderContent?.({
        isLoading,
        data,
        filter,
        setFilter,
        selectedKeys,
        setSelectedKeys,
      })}

      {isAllowRemove && (
        <Modal
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          isDismissable={false}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  Xoá {title.toLowerCase()}
                </ModalHeader>
                <ModalBody className="text-center">
                  <p>
                    Bạn có chắc chắn muốn xoá {title.toLowerCase()}{' '}
                    {selectedKeys !== 'all' ? (
                      <b>{Array.from(selectedKeys).join(', ')}</b>
                    ) : (
                      'đã chọn'
                    )}
                    ?
                  </p>
                </ModalBody>
                <ModalFooter className="justify-center">
                  <Button onPress={onClose}>Hủy</Button>
                  <Button
                    color="danger"
                    onPress={() => {
                      if (selectedKeys !== 'all') {
                        onRemove(String(Array.from(selectedKeys)[0]));
                      }

                      onClose();
                    }}
                  >
                    Xoá
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      )}
    </div>
  );
};

export default TablePage;
