import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { UserPlus, RefreshCw, AlertCircle, CheckCircle2, ShieldCheck, UserCheck } from 'lucide-react';

export const FarmTeamView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // Form
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await api.getFarmUsers();
      setUsers(data);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Unable to load farm users.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!name.trim() || !email.trim()) {
      setFeedback({ type: 'error', message: 'Name and email are required.' });
      return;
    }

    if (password.length < 6) {
      setFeedback({ type: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }

    setIsSaving(true);
    try {
      const newUser = await api.createHerdsman({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: password,
      });

      setFeedback({
        type: 'success',
        message: `Herdsman account created for ${newUser.name}. They can now log in using ${newUser.email}.`,
      });

      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setShowAddForm(false);
      await fetchUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create herdsman account.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-200 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Farm Team & Herdsmen</h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Manage who has access to record milk or view records for this farm
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={fetchUsers}
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
            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
            {showAddForm ? 'Cancel' : 'Add Herdsman'}
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

      {/* Add Herdsman Form */}
      {showAddForm && (
        <div className="mt-6 bg-stone-50 border border-stone-300 rounded-lg p-5">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
              Create Herdsman Account
            </h2>
            <p className="text-xs text-stone-600 mt-1">
              Herdsmen have a dedicated, simplified screen to record morning and evening milk. They will not see sales or expense records.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Peter Mukasa"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-stone-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Email (used to log in)</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. peter@farm.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-stone-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Phone Number (optional)</label>
                <input
                  type="tel"
                  placeholder="+256 700 000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-stone-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Temporary Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-stone-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-[#1b4332] text-white px-5 py-2 rounded text-xs font-bold hover:bg-[#2d6a4f] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? 'Creating...' : 'Create Herdsman Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <div className="mt-8">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-stone-500">Loading team members...</div>
        ) : users.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-lg p-10 text-center text-sm text-stone-500">
            No team members found.
          </div>
        ) : (
          <div className="bg-white border border-stone-200 rounded-lg divide-y divide-stone-100 overflow-hidden shadow-xs">
            {users.map((u) => (
              <div key={u.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-9 h-9 rounded flex items-center justify-center font-bold text-xs ${
                      u.role === 'OWNER'
                        ? 'bg-[#1b4332] text-white'
                        : 'bg-stone-100 text-stone-700 border border-stone-200'
                    }`}
                  >
                    {u.role === 'OWNER' ? (
                      <ShieldCheck className="w-5 h-5 text-white" />
                    ) : (
                      <UserCheck className="w-5 h-5 text-stone-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-stone-900 text-sm flex items-center space-x-2">
                      <span>{u.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                          u.role === 'OWNER'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      {u.email} {u.phone ? `• ${u.phone}` : ''}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                    {u.status || 'ACTIVE'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
