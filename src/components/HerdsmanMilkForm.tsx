import React, { useEffect, useState } from 'react';
import { MilkRecord } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export const HerdsmanMilkForm: React.FC = () => {
  const { user, farm } = useAuth();

  // Today's date default (YYYY-MM-DD)
  const getTodayString = () => new Date().toISOString().slice(0, 10);

  const [date, setDate] = useState<string>(getTodayString());
  const [morningLitres, setMorningLitres] = useState<string>('');
  const [eveningLitres, setEveningLitres] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [recentRecords, setRecentRecords] = useState<MilkRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState<boolean>(true);

  // Load recent records
  const loadRecords = async () => {
    try {
      setIsLoadingRecords(true);
      const records = await api.getMilkRecords();
      setRecentRecords(records.slice(0, 10)); // recent 10 records
    } catch {
      // Non-fatal on background load
    } finally {
      setIsLoadingRecords(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSuccessMessage(null);
    setErrorMessage(null);

    const m = parseFloat(morningLitres) || 0;
    const ev = parseFloat(eveningLitres) || 0;

    if (m === 0 && ev === 0) {
      setErrorMessage('Please enter morning or evening litres (or both).');
      return;
    }

    if (m < 0 || ev < 0) {
      setErrorMessage('Litres cannot be negative.');
      return;
    }

    setIsSaving(true);

    try {
      const savedRecord = await api.createMilkRecord({
        date,
        morningLitres: m,
        eveningLitres: ev,
        notes: notes.trim(),
      });

      setSuccessMessage(`Milk record saved. Total: ${savedRecord.totalLitres} L`);
      setMorningLitres('');
      setEveningLitres('');
      setNotes('');
      // Reload recent records so the herdsman immediately sees confirmation
      await loadRecords();
    } catch (err: any) {
      setErrorMessage(err.message || 'Milk record could not be saved. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 sm:py-10">
      {/* Greetings & Farm context */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
          Record Today's Milk
        </h1>
        <p className="text-sm text-stone-600 mt-1">
          {farm?.name} • Logged in as <strong className="text-stone-800">{user?.name}</strong>
        </p>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-3 text-emerald-900">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold text-sm">{successMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3 text-red-900">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="font-semibold text-sm">{errorMessage}</span>
        </div>
      )}

      {/* Clean, large mobile-friendly entry card */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 sm:p-7 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Date */}
          <div>
            <label htmlFor="milkDate" className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Date
            </label>
            <input
              id="milkDate"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-12 px-3 text-base border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b4332] bg-stone-50/50"
            />
          </div>

          {/* Morning Milk */}
          <div>
            <label htmlFor="morningLitres" className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Morning Milk (Litres)
            </label>
            <div className="relative">
              <input
                id="morningLitres"
                type="number"
                step="0.5"
                min="0"
                placeholder="0.0"
                value={morningLitres}
                onChange={(e) => setMorningLitres(e.target.value)}
                className="w-full h-14 px-4 text-xl font-semibold border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 font-medium">L</span>
            </div>
          </div>

          {/* Evening Milk */}
          <div>
            <label htmlFor="eveningLitres" className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Evening Milk (Litres)
            </label>
            <div className="relative">
              <input
                id="eveningLitres"
                type="number"
                step="0.5"
                min="0"
                placeholder="0.0"
                value={eveningLitres}
                onChange={(e) => setEveningLitres(e.target.value)}
                className="w-full h-14 px-4 text-xl font-semibold border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 font-medium">L</span>
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label htmlFor="notes" className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Notes (optional)
            </label>
            <input
              id="notes"
              type="text"
              placeholder="e.g. Morning milking delayed 30 mins"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-11 px-3 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
            />
          </div>

          {/* Calculated Preview */}
          {((parseFloat(morningLitres) || 0) > 0 || (parseFloat(eveningLitres) || 0) > 0) && (
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex justify-between items-center text-sm font-medium text-stone-800">
              <span>Calculated Total:</span>
              <span className="text-base font-bold text-[#1b4332]">
                {(parseFloat(morningLitres) || 0) + (parseFloat(eveningLitres) || 0)} L
              </span>
            </div>
          )}

          {/* Save Button */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full h-14 rounded-lg bg-[#1b4332] text-white font-bold text-lg hover:bg-[#2d6a4f] active:bg-[#143225] transition-colors disabled:opacity-50 shadow-xs cursor-pointer disabled:cursor-not-allowed mt-2"
          >
            {isSaving ? 'Saving...' : 'SAVE MILK'}
          </button>
        </form>
      </div>

      {/* Herdsman's Recent Milk Entries */}
      <div className="mt-10">
        <h2 className="text-base font-bold text-stone-900 tracking-tight mb-3">
          Your Recent Milk Entries
        </h2>

        {isLoadingRecords ? (
          <p className="text-xs text-stone-500 py-3">Loading recent records...</p>
        ) : recentRecords.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-lg p-6 text-center text-sm text-stone-500">
            No milk records yet. Enter today's milk above.
          </div>
        ) : (
          <div className="bg-white border border-stone-200 rounded-lg divide-y divide-stone-100 overflow-hidden">
            {recentRecords.map((rec) => (
              <div key={rec.id} className="p-3.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-stone-900 text-sm">
                    {rec.date ? new Date(rec.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown date'}
                  </div>
                  <div className="text-xs text-stone-500 mt-0.5">
                    Morning: {rec.morningLitres} L • Evening: {rec.eveningLitres} L
                    {rec.notes ? ` • "${rec.notes}"` : ''}
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block text-base font-bold text-[#1b4332]">
                    {rec.totalLitres} L
                  </span>
                  <div className="text-[10px] text-stone-400">Total</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
