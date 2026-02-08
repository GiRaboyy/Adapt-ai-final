'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { AuthLayout } from '@/components/auth/AuthLayout';

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
    <AuthLayout>
      {/* Mail Icon - Dark with lime halo */}
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

      <div className="text-center space-y-3">
        <h1 className="font-display text-2xl font-bold text-gray-900">Проверьте почту</h1>
        <p className="text-base text-gray-600 leading-relaxed">
          Мы отправили письмо на:
        </p>
        <p className="font-semibold text-lg text-gray-900">{email}</p>
      </div>

      {resendSuccess && (
        <div className="bg-[#ECFDF5] border-2 border-[#6EE7B7] rounded-xl p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-[#059669]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p className="text-sm font-semibold text-[#065F46]">Письмо отправлено!</p>
        </div>
      )}

      <div className="space-y-3">
        <Button
          onClick={handleResend}
          disabled={countdown > 0 || isResending}
          variant="primary"
          isLoading={isResending}
          className="w-full h-12 text-base font-bold"
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
          className="w-full text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors py-2"
        >
          Изменить email
        </button>
      </div>
    </AuthLayout>
  );
}
