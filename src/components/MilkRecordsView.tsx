import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { MilkRecord } from '../types';
import { api } from '../services/api';
import { formatLocalDate, getLocalDateKey } from '../dateUtils';

type DailyMilk = { date: string; morning: number; evening: number; total: number };

export const MilkRecordsView: React.FC = () => {
  const [records, setRecords] = useState<MilkRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRecords = async () => {
    setIsLoading(true);
    setError('');
    try { setRecords(await api.getMilkRecords()); }
    catch (err: any) { setError(err.message || 'Unable to load milk records.'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { void fetchRecords(); }, []);

  const dailyMilk = useMemo(() => {
    const byDate: Record<string, DailyMilk> = {};
    records.filter(record => record.cowId).forEach(record => {
      const date = getLocalDateKey(record.date);
      if (!date) return;
      const day = byDate[date] || (byDate[date] = { date, morning: 0, evening: 0, total: 0 });
      day.morning += Number(record.morningLitres) || 0;
      day.evening += Number(record.eveningLitres) || 0;
    });
    return Object.values(byDate).map(day => ({ ...day, total: day.morning + day.evening }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [records]);

  return <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-200 gap-3">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Milk Records</h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">Daily milk collected from all registered cows.</p>
      </div>
      <button type="button" onClick={() => void fetchRecords()} disabled={isLoading} className="inline-flex items-center text-xs font-semibold text-stone-700 bg-white border border-stone-300 rounded px-3 py-2 hover:bg-stone-50 disabled:opacity-50">
        <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />Refresh
      </button>
    </div>

    {error && <div className="mt-4 p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-900">{error}</div>}
    <div className="mt-8">
      {isLoading ? <div className="py-12 text-center text-sm text-stone-500">Loading milk records...</div> : dailyMilk.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-lg p-10 text-center text-sm text-stone-500">No cow milk records yet. Record morning and evening milk on the Cow Production page.</div>
      ) : <div className="bg-white border border-stone-200 rounded-lg overflow-x-auto shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#416f96] border-b border-[#315b7d] text-white text-xs sm:text-sm uppercase"><tr>
            <th className="py-3 px-4">Date</th><th className="py-3 px-4 text-right">Morning (L)</th><th className="py-3 px-4 text-right">Evening (L)</th><th className="py-3 px-4 text-right">Total (L)</th>
          </tr></thead>
          <tbody className="divide-y divide-stone-200 text-stone-900">{dailyMilk.map((day, index) => <tr key={day.date} className={index % 2 ? 'bg-slate-100' : 'bg-white'}>
            <td className="py-3 px-4 font-medium whitespace-nowrap">{formatLocalDate(day.date)}</td>
            <td className="py-3 px-4 text-right whitespace-nowrap">{day.morning.toLocaleString()}</td>
            <td className="py-3 px-4 text-right whitespace-nowrap">{day.evening.toLocaleString()}</td>
            <td className="py-3 px-4 text-right font-bold text-[#1b4332] whitespace-nowrap">{day.total.toLocaleString()}</td>
          </tr>)}</tbody>
        </table>
      </div>}
    </div>
  </div>;
};
