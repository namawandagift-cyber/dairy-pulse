import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { AlertCircle, CheckCircle2, Building2 } from 'lucide-react';

export const FarmSettingsView: React.FC = () => {
  const { farm, refreshFarm } = useAuth();

  const [name, setName] = useState(farm?.name || '');
  const [location, setLocation] = useState(farm?.location || '');
  const [phone, setPhone] = useState(farm?.phone || '');
  const [description, setDescription] = useState(farm?.description || '');

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!name.trim()) {
      setFeedback({ type: 'error', message: 'Farm name is required.' });
      return;
    }

    if (!location.trim()) {
      setFeedback({ type: 'error', message: 'Farm location is required.' });
      return;
    }

    setIsSaving(true);
    try {
      await api.updateFarmDetails({
        name: name.trim(),
        location: location.trim(),
        phone: phone.trim(),
        description: description.trim(),
      });
      await refreshFarm();
      setFeedback({ type: 'success', message: 'Farm details updated successfully.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update farm details.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
      <div className="pb-6 border-b border-stone-200">
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Farm Details</h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
          General farm profile and location information
        </p>
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

      <form onSubmit={handleSubmit} className="mt-6 bg-white border border-stone-200 rounded-xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center space-x-3 pb-3 border-b border-stone-100">
          <div className="w-10 h-10 rounded bg-[#1b4332]/10 text-[#1b4332] flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-stone-900 text-sm">Farm Information</div>
            <div className="text-xs text-stone-400">ID: {farm?.id || '—'}</div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1">Farm Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-10 px-3 text-sm border border-stone-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1">Farm Location / Region</label>
          <input
            type="text"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full h-10 px-3 text-sm border border-stone-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1">Farm Phone (optional)</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full h-10 px-3 text-sm border border-stone-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1">Description (optional)</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 text-sm border border-stone-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-[#1b4332] text-white px-5 py-2.5 rounded text-xs font-bold hover:bg-[#2d6a4f] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? 'Saving...' : 'Update Farm Details'}
          </button>
        </div>
      </form>
    </div>
  );
};
