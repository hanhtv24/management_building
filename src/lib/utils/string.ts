import { customAlphabet } from 'nanoid';

import '@/db/schema';

export const genAlphabet = customAlphabet(
  'useandom26T198340PX75pxJACKVERYMINDBUSHWOLFGQZbfghjklqvwyzrict',
  8,
);

export const genOtp = customAlphabet('0123456789', 6);
