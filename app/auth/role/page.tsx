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

function LeftPanel() {
  return (
    <div className="hidden lg:flex lg:w-[48%] bg-dark-bg relative overflow-hidden noise-overlay">
      {/* Animated gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-lime/30 via-green-500/15 to-transparent animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-emerald-400/15 via-lime/10 to-transparent animate-float-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] rounded-full bg-lime/6 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col justify-between h-full p-12">
        {/* Logo at top left */}
        <div className="pt-4">
          <LogoMark />
        </div>
        
        {/* Text block centered vertically */}
        <div className="flex-1 flex items-center">
          <div className="space-y-6 max-w-xl">
            <h1 className="font-display text-[56px] xl:text-[68px] font-bold text-white leading-[1.1] tracking-[-0.03em]">
              Последний шаг
            </h1>
            <p className="text-gray-400 text-xl xl:text-[22px] leading-relaxed max-w-[500px]">
              Выберите роль — и мы настроим интерфейс под ваши задачи.
            </p>
          </div>
        </div>

        {/* Bottom spacing */}
        <div className="h-16" />
      </div>
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
  const [userId, setUserId] = useState<string | null>(null);

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

      setUserId(user.id);

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
      // Call Next.js API route to save role
      const response = await fetch('/api/profile/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole }),
      });

      // Check if we got HTML response (Vercel auth protection)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        console.error('Got HTML response - Vercel auth protection active');
        setError('Этот деплой защищён. Используйте production-домен.');
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Role save error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        
        // Show detailed error in console for debugging
        if (errorData.details) {
          console.error('Error details:', errorData.details);
        }
        if (errorData.code) {
          console.error('Error code:', errorData.code);
        }
        
        setError('Не удалось сохранить роль. Попробуйте ещё раз.');
        setIsLoading(false);
        return;
      }

      const result = await response.json();
      console.log('Role saved successfully:', result);

      // Success - redirect to dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      console.error('Unexpected error during role save:', err);
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
      <div className="min-h-screen flex flex-col lg:flex-row">
        <LeftPanel />
        
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-[#F6F7F9]">
          <div className="w-full max-w-md">
            <div className="glass-card rounded-2xl shadow-xl px-8 py-10 text-center">
              <div className="lg:hidden flex justify-center mb-6">
                <LogoMark />
              </div>

              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">
                Сессия не найдена
              </h1>
              <p className="text-gray-600 mb-7">
                Для выбора роли необходимо войти в систему
              </p>

              <Button onClick={() => router.push('/auth')} variant="primary" className="w-full">
                Войти в систему
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <LeftPanel />

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-[#F6F7F9]">
        <div className="w-full max-w-xl">
          <div className="glass-card rounded-2xl shadow-xl px-8 py-10">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-6">
              <LogoMark />
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">
                Выберите вашу роль
              </h1>
              <p className="text-gray-500 text-base">
                Это займёт 5 секунд
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 text-sm text-red-900 font-medium mb-6">
                {error}
              </div>
            )}

            {/* Role Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <button
                type="button"
                onClick={() => setSelectedRole('curator')}
                disabled={isLoading}
                className={`p-6 border-2 rounded-xl text-left transition-all min-h-[140px] flex flex-col ${
                  selectedRole === 'curator'
                    ? 'border-lime bg-lime/5 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                } disabled:opacity-50`}
              >
                <div className="text-4xl mb-3">💼</div>
                <h3 className="font-display font-bold text-lg mb-1.5">Куратор</h3>
                <p className="text-sm text-gray-600 leading-snug">
                  Создаёт курсы и смотрит прогресс
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('employee')}
                disabled={isLoading}
                className={`p-6 border-2 rounded-xl text-left transition-all min-h-[140px] flex flex-col ${
                  selectedRole === 'employee'
                    ? 'border-lime bg-lime/5 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                } disabled:opacity-50`}
              >
                <div className="text-4xl mb-3">👤</div>
                <h3 className="font-display font-bold text-lg mb-1.5">Сотрудник</h3>
                <p className="text-sm text-gray-600 leading-snug">
                  Проходит обучение и отвечает на вопросы
                </p>
              </button>
            </div>

            {/* Continue Button */}
            <Button
              onClick={handleContinue}
              disabled={!selectedRole || isLoading}
              isLoading={isLoading}
              className="w-full h-12"
            >
              {isLoading ? 'Сохраняем...' : 'Продолжить'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
