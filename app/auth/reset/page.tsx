'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LegacyInput as Input } from '@/components/ui/LegacyInput';
import { LegacyButton as Button } from '@/components/ui/LegacyButton';
import { createClient } from '@/lib/supabase/client';
import { AuthLayout } from '@/components/auth/AuthLayout';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    if (password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError('Не удалось обновить пароль. Попробуйте ещё раз.');
        setIsLoading(false);
        return;
      }

      setSuccess(true);

      // Redirect to dashboard after 2 seconds with recovery flag to bypass role check
      setTimeout(() => {
        router.push('/dashboard?from=recovery');
        router.refresh();
      }, 2000);
    } catch (err) {
      setError('Произошла ошибка. Попробуйте ещё раз.');
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout contentPadding="large">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-lime/20 rounded-full blur-xl" />
              <div className="relative w-20 h-20 bg-lime/10 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-lime" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="font-display text-2xl font-bold text-gray-900">Пароль обновлён!</h1>
            <p className="text-gray-600">
              Ваш пароль успешно изменён. Сейчас вы будете перенаправлены в личный кабинет.
            </p>
          </div>

          <Button onClick={() => router.push('/dashboard?from=recovery')} variant="default" className="w-full">
            Перейти в кабинет
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout contentPadding="large">
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-extrabold text-gray-900 mb-3">
          Новый пароль
        </h1>
        <p className="text-gray-600">
          Введите новый пароль для вашего аккаунта
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-semibold text-red-900 flex-1">{error}</p>
          </div>
        )}

        <Input
          label="Новый пароль"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          showPasswordToggle
          autoComplete="new-password"
        />

        <Input
          label="Повторите пароль"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isLoading}
          showPasswordToggle
          autoComplete="new-password"
        />

        <Button type="submit" isLoading={isLoading} className="w-full">
          {isLoading ? 'Обновляем...' : 'Обновить пароль'}
        </Button>

        <button
          type="button"
          onClick={() => router.push('/auth')}
          className="w-full text-sm text-gray-600 hover:text-gray-900 transition-colors"
          disabled={isLoading}
        >
          Вернуться ко входу
        </button>
      </form>
    </AuthLayout>
  );
}
