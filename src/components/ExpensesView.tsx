import React, { useEffect, useState } from 'react';
import { Expense } from '../types';
import { api } from '../services/api';
import { PlusCircle, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

const COMMON_CATEGORIES = [
  'Feed & Forage',
  'Veterinary & Medicines',
  'Labor & Wages',
  'Equipment & Maintenance',
  'Transport & Fuel',
  'Utilities & Water',
  'Cleaning & Sanitization',
  'Other',
];

export const ExpensesView: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // Form
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<string>(COMMON_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const data = await api.getExpenses();
      setExpenses(data);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Unable to load expenses.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const chosenCategory = category === 'Other' && customCategory.trim() ? customCategory.trim() : category;
    const amt = parseFloat(amount);

    if (isNaN(amt) || amt <= 0) {
      setFeedback({ type: 'error', message: 'Amount must be greater than 0.' });
      return;
    }

    setIsSaving(true);
    try {
      const saved = await api.createExpense({
        date,
        category: chosenCategory,
        amount: amt,
        description: description.trim(),
      });

      setFeedback({
        type: 'success',
        message: `Expense saved: UGX ${saved.amount.toLocaleString()} for ${saved.category}`,
      });

      setAmount('');
      setDescription('');
      setCustomCategory('');
      setShowAddForm(false);
      await fetchExpenses();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save expense.' });
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

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + (parseFloat(String(e.amount)) || 0), 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-200 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Expenses</h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Farm operation expenses persisted in Google Sheets
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={fetchExpenses}
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
            {showAddForm ? 'Cancel' : 'Record Expense'}
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
            Record Farm Expense
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
                <label className="block text-xs font-bold text-stone-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-stone-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                >
                  {COMMON_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Amount (UGX)</label>
                <input
                  type="number"
                  step="500"
                  min="1"
                  required
                  placeholder="e.g. 35000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-stone-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                />
              </div>
            </div>

            {category === 'Other' && (
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Specify Category</label>
                <input
                  type="text"
                  required
                  placeholder="Enter custom category"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-stone-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Description (optional)</label>
              <input
                type="text"
                placeholder="e.g. Bought 2 bags of dairy meal feed from supplier"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-10 px-3 text-sm border border-stone-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-[#1b4332] text-white px-5 py-2 rounded text-xs font-bold hover:bg-[#2d6a4f] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? 'Saving...' : 'Save Expense'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary Stat */}
      {!isLoading && expenses.length > 0 && (
        <div className="mt-6 p-4 bg-white border border-stone-200 rounded-lg flex items-center justify-between">
          <span className="text-xs font-medium text-stone-500">Total Recorded Expenses:</span>
          <span className="text-lg font-bold text-stone-900">
            UGX {Math.round(totalExpenseAmount).toLocaleString()}
          </span>
        </div>
      )}

      {/* Expenses Table */}
      <div className="mt-6">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-stone-500">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-lg p-10 text-center text-sm text-stone-500">
            No expenses recorded yet. Click "Record Expense" to add one.
          </div>
        ) : (
          <div className="bg-white border border-stone-200 rounded-lg overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold whitespace-nowrap">{formatDate(e.date)}</td>
                    <td className="py-3 px-4 font-medium whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-stone-100 font-semibold text-stone-700">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-stone-900 whitespace-nowrap">
                      UGX {Math.round(e.amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-stone-500 max-w-xs truncate">{e.description || '—'}</td>
                    <td className="py-3 px-4 text-stone-500 whitespace-nowrap">{e.recordedBy || '—'}</td>
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
