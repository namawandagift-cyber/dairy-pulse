import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, PlusCircle, RefreshCw, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { Cow, MilkRecord } from '../types';
import { getLocalDateKey, getTodayDateKey } from '../dateUtils';

const localDate = getTodayDateKey;

export const CowsView: React.FC = () => {
  const [cows, setCows] = useState<Cow[]>([]);
  const [records, setRecords] = useState<MilkRecord[]>([]);
  const [name, setName] = useState('');
  const [newCowMorning, setNewCowMorning] = useState('');
  const [newCowEvening, setNewCowEvening] = useState('');
  const [productionDate, setProductionDate] = useState(localDate);
  const [milkInputs, setMilkInputs] = useState<Record<string, { morning: string; evening: string }>>({});
  const [editingCowId, setEditingCowId] = useState<string | null>(null);
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

  const production = useMemo(() => records.reduce<Record<string, number>>((all, record) => {
    if (record.cowId) {
      const litres = Number(record.totalLitres || 0);
      all[record.cowId] = (all[record.cowId] || 0) + litres;
    }
    return all;
  }, {} as Record<string, number>), [records]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setFeedback(null);
    if (newCowMorning.trim() === '' || newCowEvening.trim() === '') {
      setFeedback({ type: 'error', message: 'Morning and evening litres are both required to register a cow.' });
      return;
    }
    const morning = Number(newCowMorning) || 0;
    const evening = Number(newCowEvening) || 0;
    if (!Number.isFinite(morning) || !Number.isFinite(evening) || morning < 0 || evening < 0) {
      setFeedback({ type: 'error', message: 'Enter valid, non-negative morning and evening litres.' });
      return;
    }
    if (morning === 0 && evening === 0) {
      setFeedback({ type: 'error', message: 'Enter milk for at least one milking. Either morning or evening can be 0 L.' });
      return;
    }
    setBusy(true);
    try {
      const cow = await api.createCow({ name: name.trim() });
      const hasMilk = morning > 0 || evening > 0;
      if (hasMilk) {
        try {
          const milk = await api.createMilkRecord({ date: productionDate, morningLitres: morning, eveningLitres: evening, cowId: cow.id });
          setFeedback({ type: 'success', message: `${cow.name} registered and ${milk.totalLitres} L of milk saved for ${productionDate}.` });
        } catch (err: any) {
          setFeedback({ type: 'error', message: `${cow.name} was registered, but its milk record could not be saved: ${err.message || 'Please enter the milk again in the cow list below.'}` });
        }
      } else {
        setFeedback({ type: 'success', message: `${cow.name} registered. You can record its milk in the table below.` });
      }
      setName(''); setNewCowMorning(''); setNewCowEvening('');
      await refresh();
    } catch (err: any) { setFeedback({ type: 'error', message: err.message || 'Unable to register cow.' }); }
    finally { setBusy(false); }
  };

  const saveCowMilk = async (cow: Cow) => {
    const entry = milkInputs[cow.id] || { morning: '', evening: '' };
    if (entry.morning.trim() === '' || entry.evening.trim() === '') {
      setFeedback({ type: 'error', message: `Enter both morning and evening litres for ${cow.name}. Use 0 if no milk was collected in one milking.` });
      return;
    }
    const morning = Number(entry.morning) || 0;
    const evening = Number(entry.evening) || 0;
    if (!Number.isFinite(morning) || !Number.isFinite(evening) || morning < 0 || evening < 0) {
      setFeedback({ type: 'error', message: 'Enter valid, non-negative litres.' });
      return;
    }
    if (morning === 0 && evening === 0) {
      setFeedback({ type: 'error', message: `Enter milk for at least one milking for ${cow.name}.` });
      return;
    }
    setBusy(true); setFeedback(null);
    try {
      const previousRecords = records.filter(record => record.cowId === cow.id && getLocalDateKey(record.date) === productionDate);
      const saved = await api.createMilkRecord({ date: productionDate, morningLitres: morning, eveningLitres: evening, cowId: cow.id });
      let previousRemoved = true;
      for (const previous of previousRecords) {
        try { await api.deleteRecord('milk', previous.id); }
        catch { previousRemoved = false; }
      }
      setMilkInputs(current => ({ ...current, [cow.id]: { morning: '', evening: '' } }));
      setEditingCowId(null);
      setFeedback({ type: previousRemoved
        ? 'success'
        : 'error', message: previousRemoved
          ? `${cow.name}: ${saved.morningLitres} L morning, ${saved.eveningLitres} L evening, ${saved.totalLitres} L total saved for ${productionDate}.`
          : `${cow.name}'s updated milk was saved, but an earlier record could not be replaced. Refresh and check the date totals.` });
      await refresh();
    } catch (err: any) { setFeedback({ type: 'error', message: err.message || `Unable to save ${cow.name}'s milk record.` }); }
    finally { setBusy(false); }
  };

  const deleteCow = async (cow: Cow) => {
    if ((production[cow.id] || 0) > 0) {
      setFeedback({ type: 'error', message: 'This cow has milk records. Keep the cow registered so its production history stays linked.' });
      return;
    }
    if (!window.confirm(`Delete ${cow.name}? This cannot be undone.`)) return;
    try { await api.deleteRecord('cow', cow.id); await refresh(); }
    catch (err: any) { setFeedback({ type: 'error', message: err.message || 'Unable to delete cow.' }); }
  };

  return <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
    <div className="flex items-center justify-between pb-6 border-b border-stone-200">
      <div><h1 className="text-2xl font-bold text-stone-900">Cow Production</h1><p className="text-sm text-stone-500 mt-1">Register cows by name and record each cow’s morning and evening milk.</p></div>
      <button type="button" onClick={() => void refresh()} disabled={busy} className="inline-flex items-center text-xs font-semibold bg-white border border-stone-300 rounded px-3 py-2"><RefreshCw className={`w-4 h-4 mr-2 ${busy ? 'animate-spin' : ''}`} />Refresh</button>
    </div>
    {feedback && <div className={`mt-4 p-3 rounded-lg border text-sm flex items-center gap-2 ${feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'}`}>{feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}{feedback.message}</div>}
    <form onSubmit={submit} className="mt-6 p-5 bg-white border border-stone-200 rounded-lg grid sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
      <label className="text-xs font-semibold text-stone-700">Cow name<input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Daisy" className="mt-1 block w-full h-10 px-3 border border-stone-300 rounded text-sm" /></label>
      <label className="text-xs font-semibold text-stone-700">Morning milk (L)<input required type="number" min="0" step="any" value={newCowMorning} onChange={e => setNewCowMorning(e.target.value)} placeholder="Enter litres" className="mt-1 block w-full h-10 px-3 border border-stone-300 rounded text-sm" /></label>
      <label className="text-xs font-semibold text-stone-700">Evening milk (L)<input required type="number" min="0" step="any" value={newCowEvening} onChange={e => setNewCowEvening(e.target.value)} placeholder="Enter litres" className="mt-1 block w-full h-10 px-3 border border-stone-300 rounded text-sm" /></label>
      <label className="text-xs font-semibold text-stone-700">Record date<input required type="date" value={productionDate} onChange={e => setProductionDate(e.target.value)} className="mt-1 block w-full h-10 px-3 border border-stone-300 rounded text-sm" /></label>
      <button disabled={busy} className="h-10 inline-flex items-center justify-center rounded bg-[#1b4332] text-white text-sm font-semibold disabled:opacity-50"><PlusCircle className="w-4 h-4 mr-2" />{busy ? 'Saving…' : 'Register & Save Milk'}</button>
      <p className="text-xs text-stone-500 sm:col-span-2 lg:col-span-5">Cow name, morning milk, and evening milk are required. Enter 0 L for a milking with no collection. This saves the cow and that day’s milk record.</p>
    </form>
    <div className="mt-6 mb-3"><h2 className="font-bold text-stone-900">Daily cow production</h2><p className="text-xs text-stone-500 mt-1">For each registered cow, enter both milkings for the selected date.</p></div>
    <div className="bg-white border border-stone-200 rounded-lg overflow-x-auto">
      <table className="w-full min-w-[580px] text-left text-sm"><thead className="bg-stone-50 text-stone-600 text-xs uppercase"><tr><th className="p-3">Cow</th><th className="p-3">Morning (L)</th><th className="p-3">Evening (L)</th><th className="p-3">Total (L)</th><th className="p-3">Action</th></tr></thead>
        <tbody className="divide-y divide-stone-100">{cows.map(cow => {
          const input = milkInputs[cow.id] || { morning: '', evening: '' };
          const dayRecords = records.filter(record => record.cowId === cow.id && getLocalDateKey(record.date) === productionDate);
          const savedMorning = dayRecords.reduce((total, record) => total + (Number(record.morningLitres) || 0), 0);
          const savedEvening = dayRecords.reduce((total, record) => total + (Number(record.eveningLitres) || 0), 0);
          const savedTotal = dayRecords.reduce((total, record) => total + (Number(record.totalLitres) || 0), 0);
          const isEditing = editingCowId === cow.id;
          return <tr key={cow.id}><td className="p-3 font-semibold">{cow.name}</td>
            {(['morning', 'evening'] as const).map(period => <td key={period} className="p-2">{isEditing
              ? <input type="number" min="0" step="any" aria-label={`${cow.name} ${period} litres`} value={input[period]} onChange={e => setMilkInputs(current => ({ ...current, [cow.id]: { ...(current[cow.id] || { morning: '', evening: '' }), [period]: e.target.value } }))} placeholder="Enter litres" className="w-24 h-9 px-2 border border-stone-300 rounded" />
              : <span>{dayRecords.length ? `${(period === 'morning' ? savedMorning : savedEvening).toLocaleString()} L` : '—'}</span>}</td>)}
            <td className="p-3 font-bold text-[#1b4332]">{isEditing ? `${((Number(input.morning) || 0) + (Number(input.evening) || 0)).toLocaleString()} L` : dayRecords.length ? `${savedTotal.toLocaleString()} L` : '—'}</td>
            <td className="p-2"><div className="flex items-center gap-2">{isEditing ? <><button type="button" disabled={busy} onClick={() => void saveCowMilk(cow)} className="px-3 py-2 rounded bg-[#1b4332] text-white text-xs font-semibold disabled:opacity-50">Save</button><button type="button" disabled={busy} onClick={() => { setEditingCowId(null); setMilkInputs(current => ({ ...current, [cow.id]: { morning: '', evening: '' } })); }} className="text-xs text-stone-600">Cancel</button></> : <button type="button" disabled={busy} onClick={() => { setMilkInputs(current => ({ ...current, [cow.id]: dayRecords.length ? { morning: String(savedMorning), evening: String(savedEvening) } : { morning: '', evening: '' } })); setEditingCowId(cow.id); }} className="px-3 py-2 rounded border border-stone-300 text-xs font-semibold disabled:opacity-50">{dayRecords.length ? 'Edit' : 'Record'}</button>}<button type="button" onClick={() => void deleteCow(cow)} aria-label={`Delete ${cow.name}`} className="text-red-700"><Trash2 className="w-4 h-4" /></button></div></td></tr>;
        })}
          {cows.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-stone-500">No cows registered yet. Enter a cow’s name and both milking amounts in the form above.</td></tr>}</tbody>
      </table>
    </div>
    <p className="mt-3 text-xs text-stone-500">Saved morning and evening litres appear in the cow’s row, and the total is calculated automatically. Use Edit at the end of the row to change that date’s figures.</p>
  </div>;
};
