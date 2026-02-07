'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';

function LogoMark() {
  return (
    <div className="w-10 h-10 rounded-lg bg-lime/10 border border-lime/30 flex items-center justify-center shadow-[0_0_20px_rgba(200,246,93,0.15)]">
      <span className="font-display font-bold text-lime text-xl">A</span>
    </div>
  );
}

export default function RoleSelectionPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'curator' | 'employee' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth');
        return;
      }

      // Check if user already has a role
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      const profile = profileData as { role: string | null } | null;

      if (profile && profile.role) {
        // Already has role, redirect to dashboard
        router.push('/dashboard');
        return;
      }

      setChecking(false);
    } catch (err) {
      console.error('Auth check error:', err);
      setChecking(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleContinue = async () => {
    if (!selectedRole) {
      setError('Пожалуйста, выберите роль');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth');
        return;
      }

      // Update profile via API
      const apiUrl = process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/api/profiles/ensure`
        : `${window.location.origin}/api/profiles/ensure`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email || null,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          role: selectedRole,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      // Success - redirect to dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      console.error('Role update error:', err);
      setError('Произошла ошибка. Попробуйте ещё раз.');
      setIsLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F7F9]">
        <div className="animate-spin h-8 w-8 border-4 border-lime border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7F9] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="glass-card rounded-2xl shadow-xl px-10 py-12">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <LogoMark />
          </div>

          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="font-display text-3xl font-extrabold text-gray-900 mb-3">
              Выберите вашу роль
            </h1>
            <p className="text-gray-600 text-lg">
              Это поможет настроить интерфейс под ваши задачи
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800 mb-6">
              {error}
            </div>
          )}

          {/* Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            <button
              type="button"
              onClick={() => setSelectedRole('curator')}
              disabled={isLoading}
              className={`p-8 border-2 rounded-2xl text-left transition-all ${
                selectedRole === 'curator'
                  ? 'border-lime bg-lime/5 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              } disabled:opacity-50`}
            >
              <div className="text-5xl mb-4">💼</div>
              <h3 className="font-display font-bold text-xl mb-2">Куратор</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Создавайте курсы на основе базы знаний компании и отслеживайте прогресс сотрудников
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('employee')}
              disabled={isLoading}
              className={`p-8 border-2 rounded-2xl text-left transition-all ${
                selectedRole === 'employee'
                  ? 'border-lime bg-lime/5 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              } disabled:opacity-50`}
            >
              <div className="text-5xl mb-4">👤</div>
              <h3 className="font-display font-bold text-xl mb-2">Сотрудник</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Проходите обучающие курсы и развивайте свои навыки с помощью ИИ-ассистента
              </p>
            </button>
          </div>

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            disabled={!selectedRole || isLoading}
            isLoading={isLoading}
            className="w-full"
          >
            {isLoading ? 'Сохраняем...' : 'Продолжить'}
          </Button>
        </div>
      </div>
    </div>
  );
}
