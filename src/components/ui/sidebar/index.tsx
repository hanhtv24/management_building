'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { createContext, useContext, useState } from 'react';

import {
  IconBuildingBank,
  IconChevronRight,
  IconMenu2,
  IconX,
} from '@tabler/icons-react';
import { AnimatePresence, motion } from 'motion/react';

import { cn } from '@/lib/utils/cn';

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
  children?: Links[];
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined,
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<'div'>)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <>
      <motion.div
        className={cn(
          'hidden w-60 shrink-0 overflow-auto p-3 md:flex md:flex-col',
          className,
        )}
        animate={{
          width: animate ? (open ? '15rem' : '3.75rem') : '15rem',
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        {children}
      </motion.div>
    </>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          'flex w-full flex-row items-center justify-between p-3 md:hidden',
        )}
        {...props}
      >
        <IconBuildingBank size={28} />
        <div className="z-20 flex w-full justify-end">
          <IconMenu2
            className="text-neutral-800 dark:text-neutral-200"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: 'easeInOut',
              }}
              className={cn(
                'fixed inset-0 z-[100] flex h-full w-full flex-col justify-between bg-white p-5 dark:bg-neutral-900',
                className,
              )}
            >
              <div
                className="absolute top-10 right-10 z-50 text-neutral-800 dark:text-neutral-200"
                onClick={() => setOpen(!open)}
              >
                <IconX />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
}) => {
  const pathname = usePathname();
  const { open, animate } = useSidebar();

  const [isExpanded, setIsExpanded] = useState(
    pathname === link.href || pathname.startsWith(link.href + '/'),
  );

  const hasSubItems = link.children && link.children.length > 0;

  if (hasSubItems) {
    return (
      <div className={cn('flex flex-col', className)} {...props}>
        <div
          className="group/sidebar flex cursor-pointer items-center justify-between gap-2 py-2"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            {link.icon}
            <motion.span
              animate={{
                display: animate
                  ? open
                    ? 'inline-block'
                    : 'none'
                  : 'inline-block',
                opacity: animate ? (open ? 1 : 0) : 1,
              }}
              className={cn(
                '!m-0 inline-block !p-0 text-sm whitespace-pre text-neutral-700 transition duration-150 group-hover/sidebar:translate-x-1 dark:text-neutral-200',
                isExpanded
                  ? 'translate-x-1 text-neutral-800 dark:text-neutral-200'
                  : '',
              )}
            >
              {link.label}
            </motion.span>
          </div>
          <motion.div
            animate={{
              display: animate
                ? open
                  ? 'inline-block'
                  : 'none'
                : 'inline-block',
              opacity: animate ? (open ? 1 : 0) : 1,
              rotate: isExpanded ? 90 : 0,
            }}
            className="text-neutral-500 dark:text-neutral-400"
          >
            <IconChevronRight size={16} />
          </motion.div>
        </div>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <motion.div
                animate={{
                  display: animate ? (open ? 'block' : 'none') : 'block',
                  opacity: animate ? (open ? 1 : 0) : 1,
                }}
                className="mt-1 ml-6 space-y-1"
              >
                {link.children?.map((e, i) => {
                  const href = `${link.href}${e.href}`;
                  return (
                    <Link
                      key={i}
                      href={href}
                      className={cn(
                        'flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-700',
                        pathname === href
                          ? 'bg-neutral-200 dark:bg-neutral-700'
                          : '',
                      )}
                    >
                      {e.icon}
                      <span className="text-sm text-neutral-600 dark:text-neutral-300">
                        {e.label}
                      </span>
                    </Link>
                  );
                })}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <Link
      href={link.href}
      className={cn(
        'group/sidebar flex items-center justify-start gap-2 py-2',
        className,
      )}
      {...props}
    >
      {link.icon}

      <motion.span
        animate={{
          display: animate ? (open ? 'inline-block' : 'none') : 'inline-block',
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="!m-0 inline-block !p-0 text-sm whitespace-pre text-neutral-700 transition duration-150 group-hover/sidebar:translate-x-1 dark:text-neutral-200"
      >
        {link.label}
      </motion.span>
    </Link>
  );
};
