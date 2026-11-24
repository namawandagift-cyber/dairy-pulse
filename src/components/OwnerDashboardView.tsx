import React, { useEffect, useMemo, useState } from 'react';
import { DashboardSummary } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, PlusCircle } from 'lucide-react';
import { formatLocalDate, getLocalDateKey } from '../dateUtils';

interface OwnerDashboardViewProps {
  onNavigate: (tab: string) => void;
}

export const OwnerDashboardView: React.FC<OwnerDashboardViewProps> = ({ onNavigate }) => {
  const { user, farm } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getDashboardSummary();
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load dashboard data from Google Sheets.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const recentMilkDays = useMemo(() => {
    const days: Record<string, { date: string; morning: number; evening: number }> = {};
    (summary?.recentMilkRecords || []).filter(record => record.cowId).forEach(record => {
      const date = getLocalDateKey(record.date);
      if (!date) return;
      const day = days[date] || (days[date] = { date, morning: 0, evening: 0 });
      day.morning += Number(record.morningLitres) || 0;
      day.evening += Number(record.eveningLitres) || 0;
    });
    return Object.values(days).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  }, [summary]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatCurrency = (val: number) => {
    return `UGX ${Math.round(val).toLocaleString()}`;
  };

  const formatDate = (dateStr: string) => formatLocalDate(dateStr);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-200 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            {getGreeting()}, {user?.name || 'Owner'}
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            {farm?.name} {farm?.location ? `• ${farm.location}` : ''}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={fetchSummary}
            disabled={isLoading}
            className="inline-flex items-center text-xs font-semibold text-stone-700 bg-white border border-stone-300 rounded px-3 py-1.5 hover:bg-stone-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-900 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchSummary}
            className="text-xs font-bold underline ml-3 shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && !summary ? (
        <div className="py-16 text-center text-stone-500 text-sm">
          Loading farm update from Google Sheets...
        </div>
      ) : (
        <>
          {/* Today's Farm Update */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-stone-900 tracking-tight uppercase text-xs">
                Today's Farm Update
              </h2>
              <span className="text-xs text-stone-500 font-medium">
                {new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {/* Milk Collected */}
              <div className="bg-white border border-stone-200 rounded-lg p-4">
                <div className="text-xs font-medium text-stone-500">Milk Collected</div>
                <div className="text-2xl sm:text-3xl font-bold text-[#1b4332] mt-1">
                  {summary ? `${summary.todayMilk} L` : '0 L'}
                </div>
                <div className="text-[11px] text-stone-400 mt-1">
                  Total Farm: {summary ? `${summary.totalMilk} L` : '0 L'}
                </div>
              </div>

              {/* Milk Sold */}
              <div className="bg-white border border-stone-200 rounded-lg p-4">
                <div className="text-xs font-medium text-stone-500">Milk Sold</div>
                <div className="text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
                  {summary ? `${summary.milkSold} L` : '0 L'}
                </div>
                <div className="text-[11px] text-stone-400 mt-1">All time sales</div>
              </div>

              {/* Sales */}
              <div className="bg-white border border-stone-200 rounded-lg p-4">
                <div className="text-xs font-medium text-stone-500">Sales</div>
                <div className="text-xl sm:text-2xl font-bold text-stone-900 mt-1 truncate">
                  {summary ? formatCurrency(summary.salesTotal) : 'UGX 0'}
                </div>
                <div className="text-[11px] text-stone-400 mt-1">Total revenue</div>
              </div>

            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate('sales')}
              className="inline-flex items-center text-xs font-semibold bg-stone-100 text-stone-800 border border-stone-300 px-3.5 py-2 rounded-md hover:bg-stone-200 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1.5 text-stone-600" />
              Record Sale
            </button>
          </div>

          <div className="mt-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-stone-900 tracking-tight">Recent milk sales</h2>
              <button type="button" onClick={() => onNavigate('sales')} className="text-xs font-semibold text-[#1b4332] hover:underline">View all sales →</button>
            </div>
            {!summary?.recentSales?.length ? (
              <div className="bg-white border border-stone-200 rounded-lg p-6 text-center text-sm text-stone-500">No milk sales recorded yet.</div>
            ) : (
              <div className="bg-white border border-stone-200 rounded-lg divide-y divide-stone-100 overflow-hidden">
                {summary.recentSales.slice(0, 5).map((sale) => (
                  <div key={sale.id} className="p-4 flex items-center justify-between gap-4">
                    <div><div className="font-semibold text-stone-900 text-sm">{sale.buyerName}</div><div className="text-xs text-stone-500 mt-0.5">{formatDate(sale.date)} · {sale.quantityLitres} L</div></div>
                    <div className="font-bold text-[#1b4332] text-sm whitespace-nowrap">{formatCurrency(sale.totalAmount)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Milk Records */}
          <div className="mt-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-stone-900 tracking-tight">
                Recent Milk Records
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('milk')}
                className="text-xs font-semibold text-[#1b4332] hover:underline"
              >
                View all records →
              </button>
            </div>

            {recentMilkDays.length === 0 ? (
              <div className="bg-white border border-stone-200 rounded-lg p-8 text-center text-sm text-stone-500">
                No cow milk records yet. Add daily production from Cow Production.
              </div>
            ) : (
              <div className="bg-white border border-stone-200 rounded-lg divide-y divide-stone-100 overflow-hidden">
                {recentMilkDays.map((day) => (
                  <div key={day.date} className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                    <div className="font-semibold text-stone-900">{formatDate(day.date)}</div>
                    <div className="text-stone-600">Morning: {day.morning.toLocaleString()} L</div>
                    <div className="text-stone-600">Evening: {day.evening.toLocaleString()} L</div>
                    <div className="font-bold text-[#1b4332]">Total: {(day.morning + day.evening).toLocaleString()} L</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
