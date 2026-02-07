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
  const [noSession, setNoSession] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // No session - show message instead of redirect
        setNoSession(true);
        setChecking(false);
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
        router.replace('/dashboard');
        return;
      }

      setChecking(false);
    } catch (err) {
      console.error('Auth check error:', err);
      setNoSession(true);
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
        setNoSession(true);
        setIsLoading(false);
        return;
      }

      // Update profile role directly via Supabase
      // Profile should already exist from callback, just update role
      const { error: updateError } = await (supabase
        .from('profiles') as ReturnType<typeof supabase.from>)
        .update({ role: selectedRole })
        .eq('id', user.id);

      if (updateError) {
        console.error('Role update error:', updateError);
        setError('Не удалось сохранить роль. Попробуйте ещё раз.');
        setIsLoading(false);
        return;
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

  // Loading state
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F7F9]">
        <div className="animate-spin h-8 w-8 border-4 border-lime border-t-transparent rounded-full" />
      </div>
    );
  }

  // No session - show friendly message
  if (noSession) {
    return (
      <div className="min-h-screen bg-[#F6F7F9] flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="glass-card rounded-2xl shadow-xl px-10 py-12 text-center">
            <div className="flex justify-center mb-6">
              <LogoMark />
            </div>

            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h1 className="font-display text-2xl font-bold text-gray-900 mb-3">
              Сессия не найдена
            </h1>
            <p className="text-gray-600 mb-8">
              Для выбора роли необходимо войти в систему
            </p>

            <Button onClick={() => router.push('/auth')} variant="primary" className="w-full">
              Войти в систему
            </Button>
          </div>
        </div>
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
