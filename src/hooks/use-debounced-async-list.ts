/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from 'react';

import { AsyncListLoadOptions, useAsyncList } from '@react-stately/data';
import { debounce } from 'lodash';

export function useDebouncedAsyncList<T>(
  loader: (opts: AsyncListLoadOptions<T, string>) => Promise<{ items: T[] }>,
  initialFilterText = '',
  delay = 500,
) {
  const [inputValue, setInputValue] = useState(initialFilterText);

  const list = useAsyncList<T>({ load: loader });

  const debouncedFilter = useMemo(
    () =>
      debounce((text: string) => {
        list.setFilterText(text);
      }, delay),
    [],
  );

  useEffect(() => {
    return () => debouncedFilter.cancel();
  }, []);

  return {
    ...list,
    inputValue,
    setInputValue,
    triggerFilter: (val: string) => {
      setInputValue(val);
      if (list.filterText !== val.trim()) debouncedFilter(val.trim());
    },
  };
}
