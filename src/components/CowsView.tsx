import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, PlusCircle, RefreshCw, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { Cow, MilkRecord } from '../types';

export const CowsView: React.FC = () => {
  const [cows, setCows] = useState<Cow[]>([]);
  const [records, setRecords] = useState<MilkRecord[]>([]);
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [breed, setBreed] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setBusy(true);
    try {
      const [nextCows, nextRecords] = await Promise.all([api.getCows(), api.getMilkRecords()]);
      setCows(nextCows);
      setRecords(nextRecords);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Unable to load cow records.' });
    } finally { setBusy(false); }
  };

  useEffect(() => { void refresh(); }, []);

  const totals = useMemo(() => records.reduce<Record<string, number>>((all, record) => {
    if (record.cowId) all[record.cowId] = (all[record.cowId] || 0) + Number(record.totalLitres || 0);
    return all;
  }, {}), [records]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setFeedback(null); setBusy(true);
    try {
      await api.createCow({ name: name.trim(), tag: tag.trim(), breed: breed.trim() });
      setName(''); setTag(''); setBreed('');
      setFeedback({ type: 'success', message: 'Cow registered.' });
      await refresh();
    } catch (err: any) { setFeedback({ type: 'error', message: err.message || 'Unable to register cow.' }); }
    finally { setBusy(false); }
  };

  const deleteCow = async (cow: Cow) => {
    if ((totals[cow.id] || 0) > 0) {
      setFeedback({ type: 'error', message: 'This cow has milk records. Keep the cow registered so its production history stays linked.' });
      return;
    }
    if (!window.confirm(`Delete ${cow.name}? This cannot be undone.`)) return;
    try { await api.deleteRecord('cow', cow.id); await refresh(); }
    catch (err: any) { setFeedback({ type: 'error', message: err.message || 'Unable to delete cow.' }); }
  };

  return <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
    <div className="flex items-center justify-between pb-6 border-b border-stone-200">
      <div><h1 className="text-2xl font-bold text-stone-900">Cows</h1><p className="text-sm text-stone-500 mt-1">Register your herd and track milk production by cow.</p></div>
      <button type="button" onClick={() => void refresh()} disabled={busy} className="inline-flex items-center text-xs font-semibold bg-white border border-stone-300 rounded px-3 py-2"><RefreshCw className={`w-4 h-4 mr-2 ${busy ? 'animate-spin' : ''}`} />Refresh</button>
    </div>
    {feedback && <div className={`mt-4 p-3 rounded-lg border text-sm flex items-center gap-2 ${feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'}`}>{feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}{feedback.message}</div>}
    <form onSubmit={submit} className="mt-6 p-5 bg-white border border-stone-200 rounded-lg grid sm:grid-cols-4 gap-3 items-end">
      <label className="text-xs font-semibold text-stone-700">Cow name<input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Daisy" className="mt-1 block w-full h-10 px-3 border border-stone-300 rounded text-sm" /></label>
      <label className="text-xs font-semibold text-stone-700">Tag / ID<input value={tag} onChange={e => setTag(e.target.value)} placeholder="Optional" className="mt-1 block w-full h-10 px-3 border border-stone-300 rounded text-sm" /></label>
      <label className="text-xs font-semibold text-stone-700">Breed<input value={breed} onChange={e => setBreed(e.target.value)} placeholder="Optional" className="mt-1 block w-full h-10 px-3 border border-stone-300 rounded text-sm" /></label>
      <button disabled={busy} className="h-10 inline-flex items-center justify-center rounded bg-[#1b4332] text-white text-sm font-semibold"><PlusCircle className="w-4 h-4 mr-2" />Register Cow</button>
    </form>
    <div className="mt-6 bg-white border border-stone-200 rounded-lg overflow-x-auto">
      <table className="w-full text-left text-sm"><thead className="bg-stone-50 text-stone-600 text-xs uppercase"><tr><th className="p-3">Cow</th><th className="p-3">Tag</th><th className="p-3">Breed</th><th className="p-3">Recorded milk</th><th className="p-3">Action</th></tr></thead>
        <tbody className="divide-y divide-stone-100">{cows.map(cow => <tr key={cow.id}><td className="p-3 font-semibold">{cow.name}</td><td className="p-3">{cow.tag || '—'}</td><td className="p-3">{cow.breed || '—'}</td><td className="p-3 font-bold text-[#1b4332]">{(totals[cow.id] || 0).toLocaleString()} L</td><td className="p-3"><button type="button" onClick={() => void deleteCow(cow)} aria-label={`Delete ${cow.name}`} className="text-red-700"><Trash2 className="w-4 h-4" /></button></td></tr>)}
          {cows.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-stone-500">No cows registered yet.</td></tr>}</tbody>
      </table>
    </div>
    <p className="mt-3 text-xs text-stone-500">Production totals include records linked to each cow. Older milk records remain intact and appear in farm totals.</p>
  </div>;
};
