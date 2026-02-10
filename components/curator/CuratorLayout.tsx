'use client';

import { Sidebar } from './Sidebar';

interface CuratorLayoutProps {
  children: React.ReactNode;
}

export function CuratorLayout({ children }: CuratorLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F7F9]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
