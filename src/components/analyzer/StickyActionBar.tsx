'use client';
import React, { ReactNode } from 'react';

export function StickyActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 bg-white/90 backdrop-blur border-t px-6 py-3">
      <div className="flex justify-end gap-3">{children}</div>
    </div>
  );
}
