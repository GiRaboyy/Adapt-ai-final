'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

export default function VerifyPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    const storedEmail = localStorage.getItem('verify_email');
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      router.push('/auth');
    }
  }, [router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResend = async () => {
    if (countdown > 0 || !email) return;
    setIsResending(true);
    setResendSuccess(false);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (!error) {
        setResendSuccess(true);
        setCountdown(60);
      }
    } catch {
      // Silent fail
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Panel - Dark with glow */}
      <div className="hidden md:flex md:w-[45%] bg-[#0B0F0C] relative overflow-hidden p-8">
        <div className="relative z-10 flex flex-col justify-between h-full">
          <Logo variant="black" size="lg" />
          
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Обучайте сотрудников<br />быстрее с Adapt
            </h1>
            <p className="text-gray-400 text-lg">
              ИИ-курсы на основе базы знаний вашей компании
            </p>
          </div>

          <div />
        </div>

        {/* Lime glow effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#C8F65D] opacity-10 blur-[120px] rounded-full"></div>
        </div>
      </div>

      {/* Right Panel - Verify Email */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="md:hidden flex justify-center">
            <Logo variant="lime" size="lg" />
          </div>

          {/* Mail Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-[#C8F65D] bg-opacity-10 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-[#C8F65D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Проверьте почту</h1>
            <p className="text-gray-600">Мы отправили ссылку для подтверждения на:</p>
            <p className="font-medium text-gray-900">{email}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
            Перейдите по ссылке в письме — и вы сразу попадёте в личный кабинет.
          </div>

          {resendSuccess && (
            <div className="bg-green-50 border border-green-500 rounded-lg p-4 flex items-center gap-3">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-green-900">Письмо отправлено!</p>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleResend}
              disabled={countdown > 0 || isResending}
              variant="primary"
              isLoading={isResending}
              className="w-full"
            >
              {isResending
                ? 'Отправляем...'
                : countdown > 0
                ? `Отправить ещё раз через ${formatTime(countdown)}`
                : 'Отправить ещё раз'}
            </Button>

            <button
              onClick={() => {
                localStorage.removeItem('verify_email');
                router.push('/auth');
              }}
              className="w-full text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Изменить email
            </button>
          </div>

          <p className="text-center text-sm text-gray-500">
            Не получили письмо? Проверьте папку «Спам».
          </p>
        </div>
      </div>
    </div>
  );
}
