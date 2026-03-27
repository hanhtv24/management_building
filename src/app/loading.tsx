'use client';

import { Spinner } from '@heroui/react';

export default function Loading() {
  return (
    <div className="text-foreground flex h-screen items-center justify-center">
      <Spinner color="current" />
    </div>
  );
}
