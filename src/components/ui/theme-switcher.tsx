'use client';

import { FC, useEffect, useState } from 'react';

import { Switch } from '@heroui/react';
import { IconMoon, IconSun } from '@tabler/icons-react';

import useSystemTheme from '@/hooks/use-system-theme';

type Props = { showLabel?: boolean };

const ThemeSwitcher: FC<Props> = ({ showLabel }) => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useSystemTheme();

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <Switch
      isSelected={theme === 'light'}
      onValueChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      color="success"
      startContent={<IconSun />}
      endContent={<IconMoon />}
    >
      {showLabel && 'Theme'}
    </Switch>
  );
};

export default ThemeSwitcher;
