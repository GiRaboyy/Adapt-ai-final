'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

function LogoMark() {
  return (
    <div className="w-10 h-10 rounded-lg bg-lime/10 border border-lime/30 flex items-center justify-center shadow-[0_0_20px_rgba(200,246,93,0.15)]">
      <span className="font-display font-bold text-lime text-xl">A</span>
    </div>
  );
}

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
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#F6F7F9]">
        <div className="w-full max-w-md">
          <div className="glass-card rounded-2xl shadow-xl p-10 text-center space-y-6">
            <div className="flex justify-center mb-4">
              <LogoMark />
            </div>

            <div className="flex justify-center">
              <div className="w-16 h-16 bg-lime/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-lime" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="font-display text-2xl font-bold text-gray-900">Проверьте почту</h1>
              <p className="text-gray-600">
                Мы отправили ссылку для сброса пароля на:
              </p>
              <p className="font-medium text-gray-900">{email}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
              Перейдите по ссылке в письме, чтобы задать новый пароль
            </div>

            <Button onClick={() => router.push('/auth')} variant="primary" className="w-full">
              Вернуться ко входу
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F6F7F9]">
      <div className="w-full max-w-md">
        <div className="glass-card rounded-2xl shadow-xl p-10">
          <div className="flex justify-center mb-6">
            <LogoMark />
          </div>

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
              <div className="bg-red-50 border border-red-500 rounded-lg p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-gray-900 flex-1">{error}</p>
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
        </div>
      </div>
    </div>
  );
}
