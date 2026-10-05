import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Header } from './components/Header';
import { ConnectionBanner } from './components/ConnectionBanner';
import { HerdsmanMilkForm } from './components/HerdsmanMilkForm';
import { OwnerDashboardView } from './components/OwnerDashboardView';
import { MilkRecordsView } from './components/MilkRecordsView';
import { SalesView } from './components/SalesView';
import { ExpensesView } from './components/ExpensesView';
import { BuyersView } from './components/BuyersView';
import { FarmTeamView } from './components/FarmTeamView';
import { FarmSettingsView } from './components/FarmSettingsView';

const MainApp: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [authPage, setAuthPage] = useState<'login' | 'register'>('login');
  const [ownerTab, setOwnerTab] = useState<string>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-10 h-10 rounded bg-[#1b4332] text-white flex items-center justify-center font-bold text-sm mx-auto animate-pulse">
            DP
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-stone-600">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col justify-between">
        <div>
          <ConnectionBanner />
          {authPage === 'login' ? (
            <Login onSwitchToRegister={() => setAuthPage('register')} />
          ) : (
            <Register onSwitchToLogin={() => setAuthPage('login')} />
          )}
        </div>
        <footer className="py-4 text-center text-xs text-stone-400">
          DairyPulse V1 • Google Sheets Database
        </footer>
      </div>
    );
  }

  // HERDSMAN role
  if (user.role === 'HERDSMAN') {
    return (
      <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col justify-between">
        <div>
          <ConnectionBanner />
          <Header />
          <main>
            <HerdsmanMilkForm />
          </main>
        </div>
        <footer className="py-4 text-center text-xs text-stone-400">
          DairyPulse V1 • Herdsman Portal
        </footer>
      </div>
    );
  }

  // OWNER role
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col justify-between">
      <div>
        <ConnectionBanner />
        <Header currentTab={ownerTab} onTabChange={(tab) => setOwnerTab(tab)} />
        <main>
          {ownerTab === 'dashboard' && <OwnerDashboardView onNavigate={(tab) => setOwnerTab(tab)} />}
          {ownerTab === 'milk' && <MilkRecordsView />}
          {ownerTab === 'sales' && <SalesView />}
          {ownerTab === 'expenses' && <ExpensesView />}
          {ownerTab === 'buyers' && <BuyersView />}
          {ownerTab === 'team' && <FarmTeamView />}
          {ownerTab === 'farm' && <FarmSettingsView />}
        </main>
      </div>
      <footer className="py-6 text-center text-xs text-stone-400 border-t border-stone-200/60 mt-12">
        DairyPulse V1 • Farm Management & Google Sheets Persistence
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
