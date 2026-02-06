/**
 * Authentication page with login and signup
 */

'use client';

import { useState, useEffect } from 'react';
import { Logo } from '@/components/ui/Logo';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (verifyEmail && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, verifyEmail]);

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

  // Email verification view (shown inline)
  if (verifyEmail) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row">
        {/* Left Panel - Decorative */}
        <div className="hidden md:flex md:w-[45%] bg-[#0A0A0A] relative overflow-hidden p-8">
          <div className="relative z-10 flex flex-col justify-between">
            <Logo variant="black" size="lg" />
            <div className="space-y-6">
              <h1 className="text-4xl font-bold text-white leading-tight">
                Train employees<br />faster with Adapt
              </h1>
              <p className="text-gray-400 text-lg">
                AI-powered training courses that adapt to your company&apos;s knowledge
              </p>
            </div>
          </div>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#C8F65D] rounded-3xl blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#C8F65D] rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
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
              <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
              <p className="text-gray-600">We sent a verification link to</p>
              <p className="font-medium text-gray-900">{verifyEmail}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
              Click the link in the email to verify your account. The link expires in 24 hours.
            </div>

            {resendSuccess && (
              <div className="bg-green-50 border border-green-500 rounded-lg p-4 flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-green-900">Email sent successfully!</p>
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleResendEmail}
                disabled={countdown > 0 || isResending}
                variant="primary"
                isLoading={isResending}
                className="w-full"
              >
                {isResending ? 'Resending...' : countdown > 0 ? `Resend in ${formatTime(countdown)}` : 'Resend email'}
              </Button>
              <button
                onClick={() => { setVerifyEmail(null); setActiveTab('signup'); }}
                className="w-full text-sm text-gray-600 hover:text-gray-900"
              >
                Change email address
              </button>
            </div>

            <p className="text-center text-sm text-gray-500">
              Didn&apos;t receive the email? Check your spam folder.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Panel - Decorative */}
      <div className="hidden md:flex md:w-[45%] bg-[#0A0A0A] relative overflow-hidden p-8">
        <div className="relative z-10 flex flex-col justify-between">
          <Logo variant="black" size="lg" />
          
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Train employees<br />faster with Adapt
            </h1>
            <p className="text-gray-400 text-lg">
              AI-powered training courses that adapt to your company&apos;s knowledge
            </p>
          </div>
        </div>

        {/* Abstract Shapes */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#C8F65D] rounded-3xl blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#C8F65D] rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="md:hidden flex justify-center">
            <Logo variant="lime" size="lg" />
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('login')}
              className={`pb-3 px-1 font-semibold transition-colors relative ${
                activeTab === 'login'
                  ? 'text-black'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Login
              {activeTab === 'login' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C8F65D]"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('signup')}
              className={`pb-3 px-1 font-semibold transition-colors relative ${
                activeTab === 'signup'
                  ? 'text-black'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Sign up
              {activeTab === 'signup' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C8F65D]"></div>
              )}
            </button>
          </div>

          {/* Form Content */}
          <div className="space-y-6">
            {activeTab === 'login' ? (
              <LoginForm />
            ) : (
              <SignupForm onSignupSuccess={(email) => { setVerifyEmail(email); setCountdown(60); }} />
            )}

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Google Button */}
            <GoogleButton />
          </div>
        </div>
      </div>
    </div>
  );
}
