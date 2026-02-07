'use client';

import { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { createClient } from '@/lib/supabase/client';

interface SignupFormProps {
  onSignupSuccess?: (email: string) => void;
  onAlreadyExists?: (email: string, needsVerification: boolean) => void;
  switchToLogin?: (email: string) => void;
}

export function SignupForm({ onSignupSuccess, switchToLogin }: SignupFormProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResendOption, setShowResendOption] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Заполните все поля');
      return;
    }

    if (!validateEmail(email)) {
      setError('Введите корректный email');
      return;
    }

    if (password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        // Handle "user already registered" errors
        if (
          signUpError.message.includes('already registered') ||
          signUpError.message.includes('already exists') ||
          signUpError.message.includes('User already registered')
        ) {
          setError('Аккаунт с таким email уже существует.');
          setShowResendOption(true);
        } else {
          setError(signUpError.message);
        }
        setIsLoading(false);
        return;
      }

      // Check if user was created or already exists
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        // User exists but email not confirmed
        setError('Аккаунт с таким email уже существует.');
        setShowResendOption(true);
        setIsLoading(false);
        return;
      }

      // Success - notify parent
      if (onSignupSuccess) {
        onSignupSuccess(email);
      }
    } catch (err) {
      setError('Произошла ошибка. Попробуйте ещё раз.');
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (resendError) {
        setError(resendError.message);
      } else {
        // Success - show verify screen
        if (onSignupSuccess) {
          onSignupSuccess(email);
        }
      }
    } catch (err) {
      setError('Не удалось отправить письмо.');
    }
    setIsLoading(false);
  };

  const handleSwitchToLogin = () => {
    if (switchToLogin) {
      switchToLogin(email);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-500 rounded-lg p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-gray-900">{error}</p>
            {showResendOption && (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleSwitchToLogin}
                  className="text-sm font-medium text-lime hover:text-lime-dark transition-colors"
                >
                  Перейти ко входу
                </button>
                <span className="text-gray-400">•</span>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isLoading}
                  className="text-sm font-medium text-lime hover:text-lime-dark transition-colors disabled:opacity-50"
                >
                  Отправить письмо ещё раз
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <Input
        label="Имя"
        type="text"
        placeholder="Иван Иванов"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        disabled={isLoading}
        autoComplete="name"
      />

      <Input
        label="Email"
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
        autoComplete="email"
      />

      {/* Two-column password fields for desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Пароль"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          showPasswordToggle
          autoComplete="new-password"
        />

        <Input
          label="Повторите пароль"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isLoading}
          showPasswordToggle
          autoComplete="new-password"
        />
      </div>

      <Button type="submit" isLoading={isLoading} className="w-full mt-6">
        {isLoading ? 'Создаём аккаунт...' : 'Создать аккаунт'}
      </Button>
    </form>
  );
}
