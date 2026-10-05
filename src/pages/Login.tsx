import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle } from 'lucide-react';

interface LoginProps {
  onSwitchToRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSwitchToRegister }) => {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter your email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Logo */}
        <div className="w-12 h-12 rounded-lg bg-[#1b4332] text-white flex items-center justify-center font-bold text-xl mx-auto shadow-xs">
          DP
        </div>
        <h1 className="mt-4 text-3xl font-extrabold text-stone-900 tracking-tight">
          DAIRYPULSE
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          Sign in to your farm management account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xs border border-stone-200 rounded-xl sm:px-10">
          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2.5 text-red-900 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="loginEmail" className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Email Address
              </label>
              <input
                id="loginEmail"
                type="email"
                required
                autoComplete="email"
                placeholder="name@farm.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 px-3 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
              />
            </div>

            <div>
              <label htmlFor="loginPassword" className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Password
              </label>
              <input
                id="loginPassword"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-3 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-lg bg-[#1b4332] text-white font-bold text-sm hover:bg-[#2d6a4f] active:bg-[#143225] transition-colors disabled:opacity-50 shadow-xs cursor-pointer disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? 'Logging in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-stone-100 text-center">
            <p className="text-xs text-stone-600">
              New farm owner?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="font-bold text-[#1b4332] hover:underline underline-offset-2 ml-1"
              >
                Register your farm
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
