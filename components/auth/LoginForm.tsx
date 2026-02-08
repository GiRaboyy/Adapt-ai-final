'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { createClient } from '@/lib/supabase/client';

interface LoginFormProps {
  prefillEmail?: string;
}

export function LoginForm({ prefillEmail = '' }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (prefillEmail) {
      setEmail(prefillEmail);
    }
  }, [prefillEmail]);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email || !password) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    if (!validateEmail(email)) {
      setError('Пожалуйста, введите корректный email');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Email not confirmed')) {
          setError('Подтвердите email перед входом');
        } else {
          setError('Неверный email или пароль');
        }
        setIsLoading(false);
        return;
      }

      // Check if user has a role via server API (bypasses RLS)
      const roleRes = await fetch('/api/profile/role');
      const { role } = await roleRes.json();

      if (!role) {
        router.push('/auth/role');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Произошла ошибка. Попробуйте ещё раз.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-[#FFF1F2] border-2 border-[#FCA5A5] rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#111827]">{error}</p>
          </div>
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

      <Input
        label="Пароль"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isLoading}
        showPasswordToggle
        autoComplete="current-password"
      />

      <div className="text-right">
        <button
          type="button"
          onClick={() => router.push('/auth/forgot')}
          className="text-sm text-gray-600 hover:text-gray-900"
          disabled={isLoading}
        >
          Забыли пароль?
        </button>
      </div>

      <Button type="submit" isLoading={isLoading} className="w-full">
        {isLoading ? 'Входим...' : 'Войти'}
      </Button>
    </form>
  );
}
