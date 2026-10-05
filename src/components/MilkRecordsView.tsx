import React, { useEffect, useState } from 'react';
import { MilkRecord } from '../types';
import { api } from '../services/api';
import { PlusCircle, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export const MilkRecordsView: React.FC = () => {
  const [records, setRecords] = useState<MilkRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // Form states
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [morningLitres, setMorningLitres] = useState<string>('');
  const [eveningLitres, setEveningLitres] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const data = await api.getMilkRecords();
      setRecords(data);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Unable to load milk records.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const m = parseFloat(morningLitres) || 0;
    const ev = parseFloat(eveningLitres) || 0;

    if (m === 0 && ev === 0) {
      setFeedback({ type: 'error', message: 'Please enter morning or evening litres (or both).' });
      return;
    }

    if (m < 0 || ev < 0) {
      setFeedback({ type: 'error', message: 'Litres cannot be negative.' });
      return;
    }

    setIsSaving(true);
    try {
      const saved = await api.createMilkRecord({
        date,
        morningLitres: m,
        eveningLitres: ev,
        notes: notes.trim(),
      });
      setFeedback({ type: 'success', message: `Milk record saved (${saved.totalLitres} L).` });
      setMorningLitres('');
      setEveningLitres('');
      setNotes('');
      setShowAddForm(false);
      await fetchRecords();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Milk record could not be saved. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.slice(0, 10).split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-200 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Milk Records</h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Farm-wide daily milk collection history persisted in Google Sheets
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={fetchRecords}
            disabled={isLoading}
            className="inline-flex items-center text-xs font-semibold text-stone-700 bg-white border border-stone-300 rounded px-3 py-2 hover:bg-stone-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAddForm(!showAddForm);
              setFeedback(null);
            }}
            className="inline-flex items-center text-xs font-semibold bg-[#1b4332] text-white px-3.5 py-2 rounded hover:bg-[#2d6a4f] transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
            {showAddForm ? 'Cancel' : 'Record Milk'}
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`mt-4 p-3 rounded-lg border text-xs sm:text-sm flex items-center space-x-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="mt-6 bg-stone-50 border border-stone-300 rounded-lg p-5">
          <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-4">
            Record Daily Milk
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-stone-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Morning (Litres)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="0.0"
                  value={morningLitres}
                  onChange={(e) => setMorningLitres(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-stone-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Evening (Litres)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="0.0"
                  value={eveningLitres}
                  onChange={(e) => setEveningLitres(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-stone-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Notes (optional)</label>
              <input
                type="text"
                placeholder="Optional notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-10 px-3 text-sm border border-stone-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-stone-600 font-medium">
                Total:{' '}
                <strong className="text-stone-900">
                  {(parseFloat(morningLitres) || 0) + (parseFloat(eveningLitres) || 0)} L
                </strong>
              </span>

              <button
                type="submit"
                disabled={isSaving}
                className="bg-[#1b4332] text-white px-5 py-2 rounded text-xs font-bold hover:bg-[#2d6a4f] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? 'Saving...' : 'Save Milk Record'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table of Records */}
      <div className="mt-8">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-stone-500">Loading milk records...</div>
        ) : records.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-lg p-10 text-center text-sm text-stone-500">
            No milk records yet.
          </div>
        ) : (
          <div className="bg-white border border-stone-200 rounded-lg overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Morning</th>
                  <th className="py-3 px-4">Evening</th>
                  <th className="py-3 px-4 text-[#1b4332]">Total</th>
                  <th className="py-3 px-4">Recorded By</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold whitespace-nowrap">{formatDate(r.date)}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{r.morningLitres} L</td>
                    <td className="py-3 px-4 whitespace-nowrap">{r.eveningLitres} L</td>
                    <td className="py-3 px-4 font-bold text-[#1b4332] whitespace-nowrap">
                      {r.totalLitres} L
                    </td>
                    <td className="py-3 px-4 text-stone-500 whitespace-nowrap">{r.recordedBy || '—'}</td>
                    <td className="py-3 px-4 text-stone-500 max-w-xs truncate">{r.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
