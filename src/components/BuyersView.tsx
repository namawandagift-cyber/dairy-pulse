import React, { useEffect, useState } from 'react';
import { Buyer } from '../types';
import { api } from '../services/api';
import { PlusCircle, RefreshCw, AlertCircle, CheckCircle2, Phone, MapPin } from 'lucide-react';

export const BuyersView: React.FC = () => {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // Form
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchBuyers = async () => {
    setIsLoading(true);
    try {
      const data = await api.getBuyers();
      setBuyers(data);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Unable to load buyers.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBuyers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!name.trim()) {
      setFeedback({ type: 'error', message: 'Buyer name is required.' });
      return;
    }

    setIsSaving(true);
    try {
      const saved = await api.createBuyer({
        name: name.trim(),
        phone: phone.trim(),
        location: location.trim(),
        notes: notes.trim(),
      });

      setFeedback({ type: 'success', message: `Buyer "${saved.name}" added successfully.` });
      setName('');
      setPhone('');
      setLocation('');
      setNotes('');
      setShowAddForm(false);
      await fetchBuyers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save buyer.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-200 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Milk Buyers</h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Registered milk off-takers and customers saved to Google Sheets
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={fetchBuyers}
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
            {showAddForm ? 'Cancel' : 'Add Buyer'}
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

      {/* Add Buyer Form */}
      {showAddForm && (
        <div className="mt-6 bg-stone-50 border border-stone-300 rounded-lg p-5">
          <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-4">
            Add New Buyer
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Buyer / Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kasangati Dairy Hub"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-stone-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+256 700 000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-stone-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Location / Town</label>
                <input
                  type="text"
                  placeholder="e.g. Gayaza Road"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-stone-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Notes (optional)</label>
              <input
                type="text"
                placeholder="e.g. Collects every morning at 7:30 AM"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-10 px-3 text-sm border border-stone-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-[#1b4332] text-white px-5 py-2 rounded text-xs font-bold hover:bg-[#2d6a4f] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? 'Saving...' : 'Save Buyer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Buyers List */}
      <div className="mt-8">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-stone-500">Loading buyers...</div>
        ) : buyers.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-lg p-10 text-center text-sm text-stone-500">
            No buyers added yet. Click "Add Buyer" to register regular milk buyers.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {buyers.map((b) => (
              <div key={b.id} className="bg-white border border-stone-200 rounded-lg p-4 shadow-xs">
                <div className="font-bold text-stone-900 text-sm">{b.name}</div>
                <div className="mt-2 space-y-1 text-xs text-stone-600">
                  {b.phone && (
                    <div className="flex items-center space-x-1.5">
                      <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{b.phone}</span>
                    </div>
                  )}
                  {b.location && (
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{b.location}</span>
                    </div>
                  )}
                  {b.notes && <div className="text-stone-500 pt-1 italic">"{b.notes}"</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
