'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TopHeader } from './TopHeader';
import { MenuOverlay } from './MenuOverlay';

interface CuratorLayoutProps {
  children: React.ReactNode;
}

export function CuratorLayout({ children }: CuratorLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const handleCreateCourse = useCallback(() => {
    router.push('/curator/courses?new=1');
  }, [router]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F7F8F6] relative">
      <TopHeader
        onMenuToggle={() => setMenuOpen((v) => !v)}
        menuOpen={menuOpen}
      />

      {menuOpen && (
        <MenuOverlay
          onClose={() => setMenuOpen(false)}
          onCreateCourse={handleCreateCourse}
        />
      )}

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
