'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LegacyInput as Input } from '@/components/ui/LegacyInput';
import { LegacyButton as Button } from '@/components/ui/LegacyButton';
import { createClient } from '@/lib/supabase/client';
import { AuthLayout } from '@/components/auth/AuthLayout';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Пожалуйста, введите email');
      return;
    }

    if (!validateEmail(email)) {
      setError('Пожалуйста, введите корректный email');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset`,
      });

      if (resetError) {
        setError('Не удалось отправить письмо. Попробуйте ещё раз.');
        setIsLoading(false);
        return;
      }

      setSuccess(true);
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
              <div className="relative w-20 h-20 bg-[#111827] rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-lime" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="font-display text-2xl font-bold text-gray-900">Проверьте почту</h1>
            <p className="text-gray-600">
              Мы отправили ссылку для сброса пароля на:
            </p>
            <p className="font-medium text-gray-900">{email}</p>
          </div>

          <Button onClick={() => router.push('/auth')} variant="default" className="w-full">
            Вернуться ко входу
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout contentPadding="large">
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-extrabold text-gray-900 mb-3">
          Забыли пароль?
        </h1>
        <p className="text-gray-600">
          Введите ваш email, и мы отправим ссылку для сброса пароля
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
          label="Email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          autoComplete="email"
        />

        <div className="space-y-3">
          <Button type="submit" isLoading={isLoading} className="w-full">
            {isLoading ? 'Отправляем...' : 'Отправить ссылку'}
          </Button>

          <button
            type="button"
            onClick={() => router.push('/auth')}
            className="w-full text-sm text-gray-600 hover:text-gray-900 transition-colors"
            disabled={isLoading}
          >
            Вернуться ко входу
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
