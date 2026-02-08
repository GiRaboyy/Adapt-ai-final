'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { AuthLayout } from '@/components/auth/AuthLayout';

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
      <AuthLayout
        brandTitle="Последний шаг"
        brandSubtitle="Выберите роль — и мы настроим интерфейс под ваши задачи."
        contentPadding="large"
      >
        <div className="text-center">
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
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      brandTitle="Последний шаг"
      brandSubtitle="Выберите роль — и мы настроим интерфейс под ваши задачи."
      contentMaxWidth="lg"
      contentPadding="large"
    >
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
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3 mb-6">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-sm font-semibold text-red-900 flex-1">{error}</p>
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
    </AuthLayout>
  );
}
