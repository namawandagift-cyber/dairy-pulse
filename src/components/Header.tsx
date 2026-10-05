import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon } from 'lucide-react';

interface HeaderProps {
  currentTab?: string;
  onTabChange?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onTabChange }) => {
  const { user, farm, logout } = useAuth();

  if (!user) return null;

  const isOwner = user.role === 'OWNER';

  return (
    <header className="border-b border-stone-200 bg-white sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Farm Branding */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-[#1b4332] text-white flex items-center justify-center font-bold tracking-wider text-sm shadow-xs">
              DP
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-stone-900 tracking-tight text-lg">DAIRYPULSE</span>
                <span className="text-xs px-2 py-0.5 rounded font-medium bg-[#1b4332]/10 text-[#1b4332]">
                  {user.role}
                </span>
              </div>
              {farm && (
                <p className="text-xs text-stone-500 font-medium truncate max-w-[200px] sm:max-w-xs">
                  {farm.name} {farm.location ? `• ${farm.location}` : ''}
                </p>
              )}
            </div>
          </div>

          {/* User profile & Logout */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-stone-700 text-sm">
              <UserIcon className="w-4 h-4 text-stone-500" />
              <span className="font-medium text-stone-900">{user.name}</span>
            </div>

            <button
              onClick={() => logout()}
              type="button"
              className="inline-flex items-center text-xs font-medium text-stone-600 hover:text-stone-900 border border-stone-300 rounded px-2.5 py-1.5 hover:bg-stone-50 transition-colors"
              title="Sign out of DairyPulse"
            >
              <LogOut className="w-3.5 h-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Navigation tabs for OWNER */}
        {isOwner && onTabChange && (
          <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 border-t border-stone-100 text-sm no-scrollbar">
            <button
              type="button"
              onClick={() => onTabChange('dashboard')}
              className={`px-3 py-1.5 rounded font-medium whitespace-nowrap text-xs sm:text-sm transition-colors ${
                currentTab === 'dashboard'
                  ? 'bg-[#1b4332] text-white'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => onTabChange('milk')}
              className={`px-3 py-1.5 rounded font-medium whitespace-nowrap text-xs sm:text-sm transition-colors ${
                currentTab === 'milk'
                  ? 'bg-[#1b4332] text-white'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              Milk Records
            </button>
            <button
              type="button"
              onClick={() => onTabChange('sales')}
              className={`px-3 py-1.5 rounded font-medium whitespace-nowrap text-xs sm:text-sm transition-colors ${
                currentTab === 'sales'
                  ? 'bg-[#1b4332] text-white'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              Sales
            </button>
            <button
              type="button"
              onClick={() => onTabChange('expenses')}
              className={`px-3 py-1.5 rounded font-medium whitespace-nowrap text-xs sm:text-sm transition-colors ${
                currentTab === 'expenses'
                  ? 'bg-[#1b4332] text-white'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              Expenses
            </button>
            <button
              type="button"
              onClick={() => onTabChange('buyers')}
              className={`px-3 py-1.5 rounded font-medium whitespace-nowrap text-xs sm:text-sm transition-colors ${
                currentTab === 'buyers'
                  ? 'bg-[#1b4332] text-white'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              Buyers
            </button>
            <button
              type="button"
              onClick={() => onTabChange('team')}
              className={`px-3 py-1.5 rounded font-medium whitespace-nowrap text-xs sm:text-sm transition-colors ${
                currentTab === 'team'
                  ? 'bg-[#1b4332] text-white'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              Herdsmen
            </button>
            <button
              type="button"
              onClick={() => onTabChange('farm')}
              className={`px-3 py-1.5 rounded font-medium whitespace-nowrap text-xs sm:text-sm transition-colors ${
                currentTab === 'farm'
                  ? 'bg-[#1b4332] text-white'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              Farm Details
            </button>
          </nav>
        )}
      </div>
    </header>
  );
};
