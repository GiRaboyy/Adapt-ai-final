'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

function LogoMark() {
  return (
    <div className="w-10 h-10 rounded-lg bg-lime/10 border border-lime/30 flex items-center justify-center shadow-[0_0_20px_rgba(200,246,93,0.15)]">
      <span className="font-display font-bold text-lime text-xl">A</span>
    </div>
  );
}

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
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Futuristic Dark */}
      <div className="hidden lg:flex lg:w-[48%] bg-dark-bg relative overflow-hidden p-10 noise-overlay">
        <div className="relative z-10 flex flex-col justify-between h-full">
          <LogoMark />
          
          <div className="space-y-6 max-w-lg">
            <h1 className="font-display text-5xl font-bold text-white leading-[1.1] tracking-tight">
              Обучайте<br />сотрудников<br />быстрее с Adapt
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              ИИ-курсы на основе базы знаний вашей компании
            </p>
          </div>

          <p className="text-gray-600 text-sm">
            Онбординг, аттестации и тренировки продаж — за часы, а не недели.
          </p>
        </div>

        {/* Animated gradient blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-lime/35 via-green-500/20 to-transparent animate-float" />
          <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-emerald-400/18 via-lime/12 to-transparent animate-float-slow" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-lime/5 blur-[100px]" />
        </div>
      </div>

      {/* Right Panel - Verify Email */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-[#F6F7F9]">
        <div className="w-full max-w-md">
          <div className="glass-card rounded-2xl shadow-xl p-8 lg:p-10 space-y-6">
            <div className="lg:hidden flex justify-center">
              <LogoMark />
            </div>

            {/* Mail Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-lime/10 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-lime" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <div className="text-center space-y-2">
              <h1 className="font-display text-2xl font-bold text-gray-900">Проверьте почту</h1>
              <p className="text-gray-600">Мы отправили ссылку для подтверждения на:</p>
              <p className="font-semibold text-gray-900">{email}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
              Перейдите по ссылке в письме — и вы сразу попадёте в личный кабинет.
            </div>

            {resendSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-green-800">Письмо отправлено!</p>
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
                className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Изменить email
              </button>
            </div>

            <p className="text-center text-sm text-gray-400">
              Не получили письмо? Проверьте папку «Спам».
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
