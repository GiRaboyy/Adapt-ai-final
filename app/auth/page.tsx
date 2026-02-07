'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

function LogoMark() {
  return (
    <div className="w-10 h-10 rounded-lg bg-lime/10 border border-lime/30 flex items-center justify-center shadow-[0_0_20px_rgba(200,246,93,0.15)]">
      <span className="font-display font-bold text-lime text-xl">A</span>
    </div>
  );
}

function LeftPanel() {
  return (
    <div className="hidden lg:flex lg:w-[48%] bg-dark-bg relative overflow-hidden p-10 noise-overlay">
      <div className="relative z-10 flex flex-col justify-between h-full">
        <LogoMark />
        
        <div className="space-y-6 max-w-lg">
          <h1 className="font-display text-5xl xl:text-6xl font-bold text-white leading-[1.1] tracking-tight">
            Обучайте<br />сотрудников<br />быстрее с Adapt
          </h1>
          <p className="text-gray-400 text-lg xl:text-xl leading-relaxed">
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
  );
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Check for error in URL
  const errorParam = searchParams.get('error');

  useEffect(() => {
    if (verifyEmail && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, verifyEmail]);

  const handleSignupSuccess = (email: string) => {
    localStorage.setItem('verify_email', email);
    router.push('/auth/verify');
  };

  const handleResendEmail = async () => {
    if (countdown > 0 || !verifyEmail) return;
    setIsResending(true);
    setResendSuccess(false);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: verifyEmail,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (!error) {
        setResendSuccess(true);
        setCountdown(60);
      }
    } catch {}
    setIsResending(false);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // Email verification view
  if (verifyEmail) {
    return (
      <div className="min-h-screen flex flex-col lg:flex-row">
        <LeftPanel />

        {/* Right Panel */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-[#F6F7F9]">
          <div className="w-full max-w-md">
            <div className="glass-card rounded-2xl shadow-xl p-8 space-y-6">
              <div className="lg:hidden flex justify-center mb-4">
                <LogoMark />
              </div>

              <div className="flex justify-center">
                <div className="w-16 h-16 bg-lime/10 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-lime" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              <div className="text-center space-y-2">
                <h1 className="font-display text-2xl font-bold text-gray-900">Проверьте почту</h1>
                <p className="text-gray-600">Мы отправили ссылку для подтверждения на:</p>
                <p className="font-medium text-gray-900">{verifyEmail}</p>
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
                <Button onClick={handleResendEmail} disabled={countdown > 0 || isResending} variant="primary" isLoading={isResending} className="w-full">
                  {isResending ? 'Отправляем...' : countdown > 0 ? `Отправить ещё раз через ${formatTime(countdown)}` : 'Отправить ещё раз'}
                </Button>
                <button onClick={() => { setVerifyEmail(null); setActiveTab('signup'); }} className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors">
                  Изменить email
                </button>
              </div>
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
        <div className="w-full max-w-[460px]">
          <div className="glass-card rounded-2xl shadow-xl p-8 lg:p-10 space-y-8">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center">
              <LogoMark />
            </div>

            {/* Error Message */}
            {errorParam && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
                <p className="font-medium mb-1">Не удалось войти</p>
                {errorParam.includes('redirect_uri') || errorParam.includes('mismatch') ? (
                  <p>Проверьте настройки Google OAuth. В Google Cloud Console добавьте Redirect URI вашего Supabase проекта.</p>
                ) : (
                  <p>{decodeURIComponent(errorParam)}</p>
                )}
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-8 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('login')}
                className={`pb-4 text-lg font-semibold transition-colors relative ${
                  activeTab === 'login' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Вход
                {activeTab === 'login' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-lime rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('signup')}
                className={`pb-4 text-lg font-semibold transition-colors relative ${
                  activeTab === 'signup' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Регистрация
                {activeTab === 'signup' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-lime rounded-full" />
                )}
              </button>
            </div>

            {/* Form */}
            <div className="space-y-6">
              {activeTab === 'login' ? (
                <LoginForm />
              ) : (
                <SignupForm onSignupSuccess={handleSignupSuccess} />
              )}

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-400">или</span>
                </div>
              </div>

              {/* Google */}
              <GoogleButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F7F9]">
      <div className="animate-spin h-8 w-8 border-4 border-lime border-t-transparent rounded-full" />
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthContent />
    </Suspense>
  );
}
