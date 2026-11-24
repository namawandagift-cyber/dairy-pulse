import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { MilkRecord } from '../types';
import { api } from '../services/api';
import { formatLocalDate, getLocalDateKey, getTodayDateKey } from '../dateUtils';

type DailyMilk = { date: string; morning: number; evening: number; total: number };

export const MilkRecordsView: React.FC = () => {
  const [records, setRecords] = useState<MilkRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [date, setDate] = useState(getTodayDateKey);
  const [morning, setMorning] = useState('');
  const [evening, setEvening] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const allRecords = await api.getMilkRecords();
      setRecords(allRecords.filter(record => !record.cowId));
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Unable to load independent milk records.' });
    } finally { setIsLoading(false); }
  };

  useEffect(() => { void fetchRecords(); }, []);

  const dailyMilk = useMemo(() => {
    const byDate: Record<string, DailyMilk> = {};
    records.forEach(record => {
      const key = getLocalDateKey(record.date);
      if (!key) return;
      const day = byDate[key] || (byDate[key] = { date: key, morning: 0, evening: 0, total: 0 });
      day.morning += Number(record.morningLitres) || 0;
      day.evening += Number(record.eveningLitres) || 0;
    });
    return Object.values(byDate).map(day => ({ ...day, total: day.morning + day.evening }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [records]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    if (morning.trim() === '' || evening.trim() === '') {
      setFeedback({ type: 'error', message: 'Enter both morning and evening litres.' });
      return;
    }
    const morningLitres = Number(morning);
    const eveningLitres = Number(evening);
    if (!Number.isFinite(morningLitres) || !Number.isFinite(eveningLitres) || morningLitres < 0 || eveningLitres < 0) {
      setFeedback({ type: 'error', message: 'Enter valid, non-negative litres.' });
      return;
    }
    if (morningLitres === 0 && eveningLitres === 0) {
      setFeedback({ type: 'error', message: 'At least one of the morning or evening totals must be greater than 0.' });
      return;
    }

    setIsSaving(true);
    try {
      const saved = await api.createMilkRecord({ date, morningLitres, eveningLitres });
      setMorning('');
      setEvening('');
      setFeedback({ type: 'success', message: `${formatLocalDate(date)} saved: ${saved.totalLitres} L total.` });
      await fetchRecords();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Milk record could not be saved.' });
    } finally { setIsSaving(false); }
  };

  const liveTotal = (Number(morning) || 0) + (Number(evening) || 0);

  return <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-200 gap-3">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Milk Records</h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">Enter farm milk totals independently from cow production and sales.</p>
      </div>
      <button type="button" onClick={() => void fetchRecords()} disabled={isLoading} className="inline-flex items-center text-xs font-semibold text-stone-700 bg-white border border-stone-300 rounded px-3 py-2 hover:bg-stone-50 disabled:opacity-50">
        <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />Refresh
      </button>
    </div>

    {feedback && <div className={`mt-4 p-3 rounded-lg border text-xs sm:text-sm flex items-center gap-2 ${feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
      {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}{feedback.message}
    </div>}

    <form onSubmit={submit} className="mt-6 bg-white border border-stone-200 rounded-lg p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
      <label className="text-xs font-semibold text-stone-700">Date<input required type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full h-10 px-3 border border-stone-300 rounded text-sm" /></label>
      <label className="text-xs font-semibold text-stone-700">Morning total (L)<input required type="number" min="0" step="any" value={morning} onChange={e => setMorning(e.target.value)} placeholder="Enter morning litres" className="mt-1 block w-full h-10 px-3 border border-stone-300 rounded text-sm" /></label>
      <label className="text-xs font-semibold text-stone-700">Evening total (L)<input required type="number" min="0" step="any" value={evening} onChange={e => setEvening(e.target.value)} placeholder="Enter evening litres" className="mt-1 block w-full h-10 px-3 border border-stone-300 rounded text-sm" /></label>
      <div className="h-10 px-3 flex items-center justify-between rounded border border-emerald-200 bg-emerald-50 text-sm"><span className="text-xs font-semibold text-stone-700">Day total</span><strong className="text-[#1b4332]">{liveTotal.toLocaleString()} L</strong></div>
      <button type="submit" disabled={isSaving} className="h-10 inline-flex items-center justify-center rounded bg-[#1b4332] text-white text-sm font-semibold disabled:opacity-50">{isSaving ? 'Saving…' : 'Save Milk Record'}</button>
    </form>

    <div className="mt-8">
      {isLoading ? <div className="py-12 text-center text-sm text-stone-500">Loading milk records...</div> : dailyMilk.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-lg p-10 text-center text-sm text-stone-500">No independent milk records yet. Enter the morning and evening farm totals above.</div>
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
