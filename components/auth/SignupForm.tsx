/**
 * Signup form component with role selection
 */

'use client';

import { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/lib/types';

interface SignupFormProps {
  onSignupSuccess?: (email: string) => void;
}

export function SignupForm({ onSignupSuccess }: SignupFormProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!fullName || !email || !password || !confirmPassword || !role) {
      setError('Please fill in all fields and select a role');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('An account with this email already exists. Please login.');
        } else {
          setError(signUpError.message);
        }
        setIsLoading(false);
        return;
      }

      // Success - notify parent
      if (onSignupSuccess) {
        onSignupSuccess(email);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-500 rounded-lg p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-gray-900">{error}</p>
          </div>
        </div>
      )}

      <Input
        label="Full Name"
        type="text"
        placeholder="John Doe"
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

      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isLoading}
        showPasswordToggle
        autoComplete="new-password"
      />

      <Input
        label="Confirm Password"
        type="password"
        placeholder="••••••••"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        disabled={isLoading}
        showPasswordToggle
        autoComplete="new-password"
      />

      {/* Role Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-3">
          Select Your Role
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setRole('curator')}
            disabled={isLoading}
            className={`p-6 border-2 rounded-xl text-left transition-all ${
              role === 'curator'
                ? 'border-[#C8F65D] bg-[#C8F65D] bg-opacity-5'
                : 'border-gray-200 hover:border-gray-600'
            } disabled:opacity-50`}
          >
            <div className="text-4xl mb-3">💼</div>
            <h3 className="font-semibold text-lg mb-1">Curator</h3>
            <p className="text-sm text-gray-600">
              Manage courses and track progress
            </p>
          </button>

          <button
            type="button"
            onClick={() => setRole('employee')}
            disabled={isLoading}
            className={`p-6 border-2 rounded-xl text-left transition-all ${
              role === 'employee'
                ? 'border-[#C8F65D] bg-[#C8F65D] bg-opacity-5'
                : 'border-gray-200 hover:border-gray-600'
            } disabled:opacity-50`}
          >
            <div className="text-4xl mb-3">👤</div>
            <h3 className="font-semibold text-lg mb-1">Employee</h3>
            <p className="text-sm text-gray-600">
              Complete training courses
            </p>
          </button>
        </div>
      </div>

      <Button type="submit" isLoading={isLoading} className="w-full">
        {isLoading ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  );
}
