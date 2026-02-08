/**
 * Sign out button component
 */

'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LegacyButton as Button } from '@/components/ui/LegacyButton';
import { useState } from 'react';

export function SignOutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth');
    router.refresh();
  };

  return (
    <Button
      onClick={handleSignOut}
      variant="secondary"
      isLoading={isLoading}
      className="text-sm"
    >
      Выйти
    </Button>
  );
}
