/**
 * Email verification page
 */

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
    // Get email from localStorage
    const storedEmail = localStorage.getItem('verify_email');
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      // If no email, redirect to auth page
      router.push('/auth');
    }
  }, [router]);

  useEffect(() => {
    // Countdown timer
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

      if (error) {
        alert('Failed to resend email. Please try again.');
      } else {
        setResendSuccess(true);
        setCountdown(60); // Reset countdown
      }
    } catch (err) {
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleChangeEmail = () => {
    localStorage.removeItem('verify_email');
    router.push(`/auth?tab=signup&email=${encodeURIComponent(email)}`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          {/* Logo */}
          <div className="flex justify-center">
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

          {/* Heading */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">
              Check your email
            </h1>
            <p className="text-gray-600">
              We sent a verification link to
            </p>
            <p className="font-medium text-gray-900">{email}</p>
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
            <p>
              Click the link in the email to verify your account and get started.
              The link will expire in 24 hours.
            </p>
          </div>

          {/* Success Message */}
          {resendSuccess && (
            <div className="bg-green-50 border border-green-500 rounded-lg p-4 flex items-center gap-3">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-green-900">Verification email sent successfully!</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleResend}
              disabled={countdown > 0 || isResending}
              variant="primary"
              isLoading={isResending}
              className="w-full"
            >
              {isResending
                ? 'Resending...'
                : countdown > 0
                ? `Resend in ${formatTime(countdown)}`
                : 'Resend verification email'}
            </Button>

            <button
              onClick={handleChangeEmail}
              className="w-full text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Change email address
            </button>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500">
            <p>
              Didn&apos;t receive the email? Check your spam folder or{' '}
              <button
                onClick={() => router.push('/auth')}
                className="text-[#C8F65D] hover:underline font-medium"
              >
                go back
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
