'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { Button } from '@/components/ui/Button';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { createClient } from '@/lib/supabase/client';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [prefillEmail, setPrefillEmail] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check for error and tab in URL
  const errorParam = searchParams.get('error');
  const tabParam = searchParams.get('tab');

  useEffect(() => {
    if (tabParam === 'signup') {
      setActiveTab('signup');
    }
  }, [tabParam]);

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

  const handleSignupSuccess = (email: string) => {
    localStorage.setItem('verify_email', email);
    router.push('/auth/verify');
  };

  const handleSwitchToLogin = (email: string) => {
    setPrefillEmail(email);
    setActiveTab('login');
  };

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-lime border-t-transparent rounded-full" />
        </div>
      </AuthLayout>
    );
  }

  // Already logged in view
  if (isLoggedIn) {
    return (
      <AuthLayout>
        <div className="glass-card rounded-2xl shadow-xl p-10 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-lime/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-lime" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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

  return (
    <AuthLayout maxWidth="max-w-[480px]">
      <div className="glass-card rounded-2xl shadow-xl px-8 py-7 space-y-6">
        {/* Error Message */}
        {errorParam && (
          <div className="bg-[#FFF1F2] border-2 border-[#FCA5A5] rounded-xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#111827] mb-1">Не удалось войти</p>
              {errorParam.includes('redirect_uri') || errorParam.includes('mismatch') ? (
                <p className="text-sm text-[#111827]">Проверьте настройки Google OAuth. В Google Cloud Console добавьте Redirect URI вашего Supabase проекта.</p>
              ) : (
                <p className="text-sm text-[#111827]">{decodeURIComponent(errorParam)}</p>
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
