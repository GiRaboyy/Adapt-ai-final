/**
 * Authentication page with login and signup
 */

'use client';

import { useState } from 'react';
import { Logo } from '@/components/ui/Logo';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { GoogleButton } from '@/components/auth/GoogleButton';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

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
            {activeTab === 'login' ? <LoginForm /> : <SignupForm />}

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
