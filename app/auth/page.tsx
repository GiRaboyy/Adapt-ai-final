'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { AuthLayout } from '@/components/auth/AuthLayout';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [prefillEmail, setPrefillEmail] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check for error in URL
  const errorParam = searchParams.get('error');

  // Check if user is already logged in
  const checkAuth = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsLoggedIn(true);
      }
    } catch (err) {
      console.error('Auth check error:', err);
    }
    setCheckingAuth(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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

  const handleSwitchToLogin = (email: string) => {
    setPrefillEmail(email);
    setActiveTab('login');
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

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F7F9]">
        <div className="animate-spin h-8 w-8 border-4 border-lime border-t-transparent rounded-full" />
      </div>
    );
  }

  // Already logged in view
  if (isLoggedIn) {
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
            <h1 className="font-display text-2xl font-bold text-gray-900">Вы уже вошли</h1>
            <p className="text-gray-600">Вы уже авторизованы в системе</p>
          </div>

          <Button onClick={() => router.push('/dashboard')} variant="primary" className="w-full">
            Перейти в кабинет
          </Button>
        </div>
      </AuthLayout>
    );
  }

  // Email verification view
  if (verifyEmail) {
    return (
      <AuthLayout>
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
          <p className="text-gray-600">Мы отправили ссылку для подтверждения на:</p>
          <p className="font-medium text-gray-900">{verifyEmail}</p>
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
          <Button onClick={handleResendEmail} disabled={countdown > 0 || isResending} variant="primary" isLoading={isResending} className="w-full">
            {isResending ? 'Отправляем...' : countdown > 0 ? `Отправить ещё раз через ${formatTime(countdown)}` : 'Отправить ещё раз'}
          </Button>
          <button onClick={() => { setVerifyEmail(null); setActiveTab('signup'); }} className="w-full text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Изменить email
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      {/* Error Message */}
      {errorParam && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-900 mb-1">Не удалось войти</p>
            {errorParam.includes('redirect_uri') || errorParam.includes('mismatch') ? (
              <p className="text-sm text-red-800">Проверьте настройки Google OAuth. В Google Cloud Console добавьте Redirect URI вашего Supabase проекта.</p>
            ) : (
              <p className="text-sm text-red-800">{decodeURIComponent(errorParam)}</p>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-8 border-b-2 border-gray-100">
        <button
          onClick={() => setActiveTab('login')}
          className={`pb-4 text-base font-bold transition-colors relative ${
            activeTab === 'login' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Вход
          {activeTab === 'login' && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-lime rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('signup')}
          className={`pb-4 text-base font-bold transition-colors relative ${
            activeTab === 'signup' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Регистрация
          {activeTab === 'signup' && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-lime rounded-full" />
          )}
        </button>
      </div>

      {/* Form */}
      <div className="space-y-5 pt-1">
        {activeTab === 'login' ? (
          <LoginForm prefillEmail={prefillEmail} />
        ) : (
          <SignupForm onSignupSuccess={handleSignupSuccess} switchToLogin={handleSwitchToLogin} />
        )}

        {/* Divider */}
        <div className="relative py-2">
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
    </AuthLayout>
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
