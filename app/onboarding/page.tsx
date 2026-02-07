'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

export default function OnboardingPage() {
  const router = useRouter();
  const [role, setRole] = useState<'curator' | 'employee' | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!role) {
      setError('Пожалуйста, выберите роль');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth');
        return;
      }

      // Update profile via API (bypasses RLS)
      const response = await fetch(`/api/profiles/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      // Also update user metadata
      await supabase.auth.updateUser({
        data: { role },
      });

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      console.error('Error updating role:', err);
      setError('Не удалось сохранить роль. Попробуйте ещё раз.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Panel - Dark with glow */}
      <div className="hidden md:flex md:w-[45%] bg-[#0B0F0C] relative overflow-hidden p-8">
        <div className="relative z-10 flex flex-col justify-between h-full">
          <Logo variant="black" size="lg" />
          
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Обучайте сотрудников<br />быстрее с Adapt
            </h1>
            <p className="text-gray-400 text-lg">
              ИИ-курсы на основе базы знаний вашей компании
            </p>
          </div>

          <div />
        </div>

        {/* Lime glow effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#C8F65D] opacity-10 blur-[120px] rounded-full"></div>
        </div>
      </div>

      {/* Right Panel - Role Selection */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="md:hidden flex justify-center">
            <Logo variant="lime" size="lg" />
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Выберите вашу роль</h1>
            <p className="text-gray-600">Это поможет нам персонализировать ваш опыт</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-500 rounded-lg p-4 text-sm text-red-900">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <button
              type="button"
              onClick={() => setRole('curator')}
              disabled={isLoading}
              className={`p-6 border-2 rounded-xl text-left transition-all ${
                role === 'curator'
                  ? 'border-[#C8F65D] bg-[#C8F65D] bg-opacity-5'
                  : 'border-gray-200 hover:border-gray-400'
              } disabled:opacity-50`}
            >
              <div className="text-4xl mb-3">💼</div>
              <h3 className="font-semibold text-lg mb-1">Куратор</h3>
              <p className="text-sm text-gray-600">
                Создавайте курсы и отслеживайте прогресс сотрудников
              </p>
            </button>

            <button
              type="button"
              onClick={() => setRole('employee')}
              disabled={isLoading}
              className={`p-6 border-2 rounded-xl text-left transition-all ${
                role === 'employee'
                  ? 'border-[#C8F65D] bg-[#C8F65D] bg-opacity-5'
                  : 'border-gray-200 hover:border-gray-400'
              } disabled:opacity-50`}
            >
              <div className="text-4xl mb-3">👤</div>
              <h3 className="font-semibold text-lg mb-1">Сотрудник</h3>
              <p className="text-sm text-gray-600">
                Проходите обучающие курсы и развивайтесь
              </p>
            </button>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!role || isLoading}
            isLoading={isLoading}
            variant="primary"
            className="w-full"
          >
            {isLoading ? 'Сохраняем...' : 'Продолжить'}
          </Button>
        </div>
      </div>
    </div>
  );
}
