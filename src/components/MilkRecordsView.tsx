import React, { useEffect, useMemo, useState } from 'react';
import { MilkRecord, Cow } from '../types';
import { api } from '../services/api';
import { PlusCircle, RefreshCw, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { formatLocalDate, getLocalDateKey, getTodayDateKey, getWeekday } from '../dateUtils';

type CowEntry = { morning: string; evening: string };
type DaySummary = { date: string; morning: number; evening: number; total: number; cows: Record<string, number>; unassigned: number };

export const MilkRecordsView: React.FC = () => {
  const [records, setRecords] = useState<MilkRecord[]>([]);
  const [cows, setCows] = useState<Cow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [date, setDate] = useState(getTodayDateKey);
  const [entries, setEntries] = useState<Record<string, CowEntry>>({});
  const [farmEntry, setFarmEntry] = useState<CowEntry>({ morning: '', evening: '' });
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const [nextRecords, nextCows] = await Promise.all([api.getMilkRecords(), api.getCows()]);
      setRecords(nextRecords);
      setCows(nextCows);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Unable to load milk records.' });
    } finally { setIsLoading(false); }
  };

  useEffect(() => { void fetchRecords(); }, []);

  const dailyTotals = useMemo(() => Object.values(entries).reduce((sum, entry) => ({
    morning: sum.morning + (Number(entry.morning) || 0),
    evening: sum.evening + (Number(entry.evening) || 0),
  }), { morning: 0, evening: 0 }), [entries]);

  const summaries = useMemo(() => {
    const byDate: Record<string, DaySummary> = {};
    records.forEach(record => {
      const key = getLocalDateKey(record.date);
      if (!key) return;
      const day = byDate[key] || (byDate[key] = { date: key, morning: 0, evening: 0, total: 0, cows: {}, unassigned: 0 });
      const morning = Number(record.morningLitres) || 0;
      const evening = Number(record.eveningLitres) || 0;
      const total = Number(record.totalLitres) || morning + evening;
      day.morning += morning;
      day.evening += evening;
      day.total += total;
      if (record.cowId) day.cows[record.cowId] = (day.cows[record.cowId] || 0) + total;
      else day.unassigned += total;
    });
    return Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date));
  }, [records]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    const rows = cows.length ? cows.map(cow => ({
      cowId: cow.id,
      name: cow.name,
      morning: Number(entries[cow.id]?.morning) || 0,
      evening: Number(entries[cow.id]?.evening) || 0,
    })) : [{ cowId: '', name: 'Farm total', morning: Number(farmEntry.morning) || 0, evening: Number(farmEntry.evening) || 0 }];
    if (rows.some(row => !Number.isFinite(row.morning) || !Number.isFinite(row.evening) || row.morning < 0 || row.evening < 0)) {
      setFeedback({ type: 'error', message: 'Enter valid, non-negative litres for each cow.' });
      return;
    }
    const filled = rows.filter(row => row.morning > 0 || row.evening > 0);
    if (!filled.length) {
      setFeedback({ type: 'error', message: 'Enter morning or evening litres for at least one cow.' });
      return;
    }

    setIsSaving(true);
    let savedCount = 0;
    try {
      for (const row of filled) {
        await api.createMilkRecord({ date, morningLitres: row.morning, eveningLitres: row.evening, notes: notes.trim(), cowId: row.cowId || undefined });
        savedCount++;
      }
      const total = filled.reduce((sum, row) => sum + row.morning + row.evening, 0);
      setFeedback({ type: 'success', message: `Saved ${savedCount} cow record${savedCount === 1 ? '' : 's'} for ${formatLocalDate(date)} (${total.toLocaleString()} L total).` });
      setEntries({}); setFarmEntry({ morning: '', evening: '' }); setNotes(''); setShowAddForm(false);
      await fetchRecords();
    } catch (err: any) {
      setFeedback({ type: 'error', message: savedCount ? `${savedCount} record${savedCount === 1 ? '' : 's'} saved before an error: ${err.message || 'Unable to save the remaining cows.'} Refresh the records to see what was saved.` : err.message || 'Milk record could not be saved. Please try again.' });
      if (savedCount) await fetchRecords();
    } finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this milk record? This cannot be undone.')) return;
    try { await api.deleteRecord('milk', id); setFeedback({ type: 'success', message: 'Milk record deleted.' }); await fetchRecords(); }
    catch (err: any) { setFeedback({ type: 'error', message: err.message || 'Unable to delete milk record.' }); }
  };

  return <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-200 gap-3">
      <div><h1 className="text-2xl font-bold text-stone-900 tracking-tight">Milk Records</h1><p className="text-xs sm:text-sm text-stone-500 mt-0.5">Enter each cow’s morning and evening milk, then review daily totals.</p></div>
      <div className="flex items-center space-x-2">
        <button type="button" onClick={() => void fetchRecords()} disabled={isLoading} className="inline-flex items-center text-xs font-semibold text-stone-700 bg-white border border-stone-300 rounded px-3 py-2 hover:bg-stone-50 disabled:opacity-50"><RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />Refresh</button>
        <button type="button" onClick={() => { setShowAddForm(!showAddForm); setFeedback(null); }} className="inline-flex items-center text-xs font-semibold bg-[#1b4332] text-white px-3.5 py-2 rounded hover:bg-[#2d6a4f]"><PlusCircle className="w-3.5 h-3.5 mr-1.5" />{showAddForm ? 'Cancel' : 'Record Milk'}</button>
      </div>
    </div>
    {feedback && <div className={`mt-4 p-3 rounded-lg border text-xs sm:text-sm flex items-center space-x-2 ${feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
      {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}<span>{feedback.message}</span>
    </div>}

    {showAddForm && <div className="mt-6 bg-stone-50 border border-stone-300 rounded-lg p-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3"><div><h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider">Daily Milk Collection</h2><p className="text-xs text-stone-500 mt-1">Fill in litres for each milking. Leave a field blank if none was collected.</p></div><label className="text-xs font-bold text-stone-700 sm:ml-auto">Date<input type="date" required value={date} onChange={e => setDate(e.target.value)} className="mt-1 block h-10 px-3 text-sm border border-stone-300 rounded bg-white" /></label></div>
        <div className="overflow-x-auto rounded border border-stone-200 bg-white">
          <table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-stone-100 text-stone-600 text-xs uppercase"><tr><th className="p-3">Cow</th><th className="p-3">Morning (L)</th><th className="p-3">Evening (L)</th><th className="p-3 text-[#1b4332]">Cow total</th></tr></thead>
            <tbody className="divide-y divide-stone-100">
              {cows.length ? cows.map(cow => {
                const entry = entries[cow.id] || { morning: '', evening: '' };
                return <tr key={cow.id}><td className="p-3 font-semibold">{cow.name}{cow.tag ? <span className="ml-1 text-xs text-stone-500">({cow.tag})</span> : null}</td>
                  {(['morning', 'evening'] as const).map(period => <td key={period} className="p-2"><input type="number" min="0" step="any" aria-label={`${cow.name} ${period} litres`} value={entry[period]} onChange={e => setEntries(current => ({ ...current, [cow.id]: { ...(current[cow.id] || { morning: '', evening: '' }), [period]: e.target.value } }))} className="w-32 h-9 px-2 border border-stone-300 rounded" placeholder="0" /></td>)}
                  <td className="p-3 font-bold text-[#1b4332]">{((Number(entry.morning) || 0) + (Number(entry.evening) || 0)).toLocaleString()} L</td></tr>;
              }) : <tr><td className="p-3 font-semibold">Farm total</td>{(['morning', 'evening'] as const).map(period => <td key={period} className="p-2"><input type="number" min="0" step="any" aria-label={`${period} farm litres`} value={farmEntry[period]} onChange={e => setFarmEntry(current => ({ ...current, [period]: e.target.value }))} className="w-32 h-9 px-2 border border-stone-300 rounded" placeholder="0" /></td>)}<td className="p-3 font-bold text-[#1b4332]">{((Number(farmEntry.morning) || 0) + (Number(farmEntry.evening) || 0)).toLocaleString()} L</td></tr>}
            </tbody>
            <tfoot className="bg-emerald-50 font-bold text-stone-800"><tr><td className="p-3">Farm totals</td><td className="p-3">{(cows.length ? dailyTotals.morning : Number(farmEntry.morning) || 0).toLocaleString()} L</td><td className="p-3">{(cows.length ? dailyTotals.evening : Number(farmEntry.evening) || 0).toLocaleString()} L</td><td className="p-3 text-[#1b4332]">{((cows.length ? dailyTotals.morning + dailyTotals.evening : (Number(farmEntry.morning) || 0) + (Number(farmEntry.evening) || 0))).toLocaleString()} L</td></tr></tfoot>
          </table>
        </div>
        <label className="block text-xs font-bold text-stone-700">Notes (optional)<input type="text" placeholder="Optional notes for this collection" value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 w-full h-10 px-3 text-sm border border-stone-300 rounded bg-white" /></label>
        <div className="flex justify-end"><button type="submit" disabled={isSaving} className="bg-[#1b4332] text-white px-5 py-2.5 rounded text-xs font-bold hover:bg-[#2d6a4f] disabled:opacity-50">{isSaving ? 'Saving records…' : 'Save Daily Records'}</button></div>
      </form>
    </div>}

    <div className="mt-8"><h2 className="text-base font-bold text-stone-900 mb-3">Daily collection history</h2>
      {isLoading ? <div className="py-12 text-center text-sm text-stone-500">Loading milk records...</div> : summaries.length === 0 ? <div className="bg-white border border-stone-200 rounded-lg p-10 text-center text-sm text-stone-500">No milk records yet.</div> : <div className="bg-white border border-stone-200 rounded-lg overflow-x-auto shadow-xs">
        <table className="w-full text-left text-xs sm:text-sm"><thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[11px]"><tr><th className="py-3 px-3">Date</th><th className="py-3 px-3">Day</th><th className="py-3 px-3">Morning</th><th className="py-3 px-3">Evening</th>{cows.map(cow => <th key={cow.id} className="py-3 px-3">{cow.name}</th>)}{summaries.some(day => day.unassigned > 0) && <th className="py-3 px-3">Unassigned</th>}<th className="py-3 px-3 text-[#1b4332]">Total (L)</th><th className="py-3 px-3">Actions</th></tr></thead>
          <tbody className="divide-y divide-stone-100 text-stone-800">{summaries.map(day => <tr key={day.date} className="hover:bg-stone-50/70"><td className="py-3 px-3 font-semibold whitespace-nowrap">{formatLocalDate(day.date)}</td><td className="py-3 px-3">{getWeekday(day.date)}</td><td className="py-3 px-3 whitespace-nowrap">{day.morning.toLocaleString()} L</td><td className="py-3 px-3 whitespace-nowrap">{day.evening.toLocaleString()} L</td>{cows.map(cow => <td key={cow.id} className="py-3 px-3 whitespace-nowrap">{(day.cows[cow.id] || 0).toLocaleString()} L</td>)}{summaries.some(item => item.unassigned > 0) && <td className="py-3 px-3 whitespace-nowrap">{day.unassigned.toLocaleString()} L</td>}<td className="py-3 px-3 font-bold text-[#1b4332] whitespace-nowrap">{day.total.toLocaleString()} L</td><td className="py-3 px-3"><div className="flex gap-1">{records.filter(r => getLocalDateKey(r.date) === day.date).map(r => <button key={r.id} type="button" onClick={() => void handleDelete(r.id)} aria-label={`Delete ${r.cowId ? cows.find(c => c.id === r.cowId)?.name || 'cow' : 'farm'} record`} title={`Delete ${r.cowId ? cows.find(c => c.id === r.cowId)?.name || 'cow' : 'farm'} record`} className="text-red-700 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>)}</div></td></tr>)}</tbody>
        </table>
      </div>}
    </div>
  </div>;
};
