'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, LogOut, Mail, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function ProfilePage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-5 h-5 border-2 border-lime border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-8 py-8 max-w-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Профиль</h1>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Avatar area */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-lime/10 text-lime shrink-0">
            <User size={22} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">
              {user?.user_metadata?.full_name ?? 'Куратор'}
            </p>
            <p className="text-sm text-gray-400 truncate">{user?.email ?? '—'}</p>
          </div>
        </div>

        {/* Fields */}
        <div className="flex flex-col divide-y divide-gray-50">
          <ProfileRow
            icon={<Mail size={15} className="text-gray-400" />}
            label="Email"
            value={user?.email ?? '—'}
          />
          <ProfileRow
            icon={<Shield size={15} className="text-gray-400" />}
            label="Роль"
            value="Куратор"
          />
        </div>

        {/* Sign out */}
        <div className="px-6 py-4 bg-gray-50/60">
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            <LogOut size={15} />
            {signingOut ? 'Выход...' : 'Выйти из аккаунта'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-6 py-3.5">
      <span className="shrink-0">{icon}</span>
      <span className="text-sm text-gray-400 w-24 shrink-0">{label}</span>
      <span className="text-sm text-gray-800 font-medium truncate">{value}</span>
    </div>
  );
}
