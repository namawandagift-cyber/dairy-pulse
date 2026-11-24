import React, { useEffect, useMemo, useState } from 'react';
import { Buyer, Sale } from '../types';
import { api } from '../services/api';
import { PlusCircle, RefreshCw, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';

type DailySales = { date: string; totalLitres: number; totalAmount: number; buyers: Record<string, { litres: number; amount: number }> };

export const SalesView: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // Form
  const [date, setDate] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [buyerId, setBuyerId] = useState<string>('');
  const [buyerName, setBuyerName] = useState<string>('');
  const [quantityLitres, setQuantityLitres] = useState<string>('');
  const [pricePerLitre, setPricePerLitre] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [salesData, buyersData] = await Promise.all([
        api.getSales(),
        api.getBuyers(),
      ]);
      setSales(salesData);
      setBuyers(buyersData);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Unable to load sales data.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const buyerColumns = useMemo(() => {
    const names = [...buyers.map(buyer => buyer.name), ...sales.map(sale => sale.buyerName)];
    return Array.from(new Set(names.map(name => name.trim()).filter(Boolean)));
  }, [buyers, sales]);

  const dailySales = useMemo(() => {
    const grouped: Record<string, DailySales> = {};
    sales.forEach(sale => {
      const day = sale.date?.slice(0, 10) || '';
      if (!day) return;
      const summary = grouped[day] || (grouped[day] = { date: day, totalLitres: 0, totalAmount: 0, buyers: {} });
      const buyer = sale.buyerName.trim();
      const cell = summary.buyers[buyer] || (summary.buyers[buyer] = { litres: 0, amount: 0 });
      cell.litres += Number(sale.quantityLitres) || 0;
      cell.amount += Number(sale.totalAmount) || 0;
      summary.totalLitres += Number(sale.quantityLitres) || 0;
      summary.totalAmount += Number(sale.totalAmount) || 0;
    });
    return Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date));
  }, [sales]);

  const totalsByBuyer = useMemo(() => sales.reduce<Record<string, { litres: number; amount: number }>>((totals, sale) => {
    const name = sale.buyerName.trim();
    const total = totals[name] || (totals[name] = { litres: 0, amount: 0 });
    total.litres += Number(sale.quantityLitres) || 0;
    total.amount += Number(sale.totalAmount) || 0;
    return totals;
  }, {}), [sales]);
  const grandTotalLitres = dailySales.reduce((total, day) => total + day.totalLitres, 0);
  const grandTotalAmount = dailySales.reduce((total, day) => total + day.totalAmount, 0);

  const handleBuyerSelect = (bId: string) => {
    setBuyerId(bId);
    const b = buyers.find((x) => x.id === bId);
    if (b) {
      setBuyerName(b.name);
    }
  };

  const calculatedTotal = () => {
    const q = parseFloat(quantityLitres) || 0;
    const p = parseFloat(pricePerLitre) || 0;
    return Math.round(q * p);
  };

  const deleteSale = async (id: string) => {
    if (!window.confirm('Delete this sale record? This cannot be undone.')) return;
    try { await api.deleteRecord('sale', id); setFeedback({ type: 'success', message: 'Sale deleted.' }); await fetchData(); }
    catch (err: any) { setFeedback({ type: 'error', message: err.message || 'Unable to delete sale.' }); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const q = parseFloat(quantityLitres);
    const p = parseFloat(pricePerLitre);

    if (!buyerName.trim()) {
      setFeedback({ type: 'error', message: 'Buyer name is required.' });
      return;
    }

    if (isNaN(q) || q <= 0) {
      setFeedback({ type: 'error', message: 'Quantity in litres must be greater than 0.' });
      return;
    }

    if (isNaN(p) || p <= 0) {
      setFeedback({ type: 'error', message: 'Price per litre must be greater than 0.' });
      return;
    }

    setIsSaving(true);
    try {
      const sale = await api.createSale({
        buyerId: buyerId || undefined,
        buyerName: buyerName.trim(),
        date,
        quantityLitres: q,
        pricePerLitre: p,
      });

      setFeedback({
        type: 'success',
        message: `Sale recorded: ${sale.quantityLitres} L for UGX ${sale.totalAmount.toLocaleString()}`,
      });

      setQuantityLitres('');
      setPricePerLitre('');
      setBuyerId('');
      setBuyerName('');
      setShowAddForm(false);
      await fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to record sale.' });
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

  const weekday = (dateStr: string) => {
    const [year, month, day] = dateStr.slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString(undefined, { weekday: 'short' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-200 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Sales</h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Milk sales and revenue records saved to Google Sheets
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={fetchData}
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
            {showAddForm ? 'Cancel' : 'Record Sale'}
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

      {/* Add Sale Form */}
      {showAddForm && (
        <div className="mt-6 bg-stone-50 border border-stone-300 rounded-lg p-5">
          <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-4">
            Record Milk Sale
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Select Existing Buyer or Type New
                </label>
                {buyers.length > 0 ? (
                  <div className="space-y-1.5">
                    <select
                      value={buyerId}
                      onChange={(e) => handleBuyerSelect(e.target.value)}
                      className="w-full h-10 px-3 text-sm border border-stone-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                    >
                      <option value="">-- Choose registered buyer --</option>
                      {buyers.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} {b.phone ? `(${b.phone})` : ''}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Or enter buyer name manually"
                      value={buyerName}
                      onChange={(e) => {
                        setBuyerName(e.target.value);
                        setBuyerId('');
                      }}
                      className="w-full h-9 px-3 text-xs border border-stone-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="Buyer Name (e.g. John Dairy Cooperatives)"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full h-10 px-3 text-sm border border-stone-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Quantity (Litres)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  placeholder="e.g. 50"
                  value={quantityLitres}
                  onChange={(e) => setQuantityLitres(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-stone-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Price per Litre (UGX)</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  required
                  placeholder="e.g. 1400"
                  value={pricePerLitre}
                  onChange={(e) => setPricePerLitre(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-stone-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-stone-200 mt-2">
              <span className="text-xs text-stone-600 font-medium">
                Total Amount:{' '}
                <strong className="text-stone-900 text-sm">
                  UGX {calculatedTotal().toLocaleString()}
                </strong>
              </span>

              <button
                type="submit"
                disabled={isSaving}
                className="bg-[#1b4332] text-white px-5 py-2 rounded text-xs font-bold hover:bg-[#2d6a4f] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? 'Saving...' : 'Save Sale Record'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Daily sales register */}
      <div className="mt-8">
        <div className="mb-3"><h2 className="text-base font-bold text-stone-900">Daily sales register</h2><p className="text-xs text-stone-500 mt-1">Daily litres and revenue, broken down by buyer.</p></div>
        {isLoading ? (
          <div className="py-12 text-center text-sm text-stone-500">Loading sales records...</div>
        ) : dailySales.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-lg p-10 text-center text-sm text-stone-500">
            No sales recorded yet. Click "Record Sale" to add your first transaction.
          </div>
        ) : (
          <div className="bg-white border border-stone-200 rounded-lg overflow-x-auto shadow-xs">
            <table className="w-full min-w-max text-left text-sm">
              <thead className="bg-[#416f96] border-b border-[#315b7d] text-white font-semibold text-xs sm:text-sm"><tr>
                <th className="py-3 px-4">Date</th><th className="py-3 px-4">Day</th>
                {buyerColumns.map(name => <th key={name} className="py-3 px-4 text-right">{name}</th>)}
                <th className="py-3 px-4 text-right">Total (Litres)</th><th className="py-3 px-4 text-right">Total Sales (UGX)</th>
              </tr></thead>
              <tbody className="divide-y divide-stone-200 text-stone-900">{dailySales.map((day, index) => <tr key={day.date} className={index % 2 ? 'bg-slate-100' : 'bg-white'}>
                <td className="py-2.5 px-4 font-medium whitespace-nowrap">{formatDate(day.date)}</td><td className="py-2.5 px-4 text-center">{weekday(day.date)}</td>
                {buyerColumns.map(name => { const cell = day.buyers[name]; return <td key={name} className="py-2.5 px-4 text-right whitespace-nowrap">{cell ? <><span className="font-medium">{cell.litres.toLocaleString()} L</span><span className="block text-xs text-stone-500">UGX {Math.round(cell.amount).toLocaleString()}</span></> : '—'}</td>; })}
                <td className="py-2.5 px-4 text-right font-bold whitespace-nowrap">{day.totalLitres.toLocaleString()}</td><td className="py-2.5 px-4 text-right font-bold whitespace-nowrap">UGX {Math.round(day.totalAmount).toLocaleString()}</td>
              </tr>)}</tbody>
              <tfoot className="bg-[#d9e2f3] border-t border-stone-300 font-bold text-stone-900"><tr>
                <td className="py-3 px-4">Total</td><td></td>{buyerColumns.map(name => <td key={name} className="py-3 px-4 text-right whitespace-nowrap"><span>{(totalsByBuyer[name]?.litres || 0).toLocaleString()} L</span><span className="block text-xs font-medium">UGX {Math.round(totalsByBuyer[name]?.amount || 0).toLocaleString()}</span></td>)}
                <td className="py-3 px-4 text-right">{grandTotalLitres.toLocaleString()}</td><td className="py-3 px-4 text-right whitespace-nowrap">UGX {Math.round(grandTotalAmount).toLocaleString()}</td>
              </tr></tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Individual sale details retain price and delete controls */}
      {!isLoading && sales.length > 0 && <div className="mt-8"><h2 className="text-base font-bold text-stone-900 mb-3">Sale details</h2><div className="bg-white border border-stone-200 rounded-lg overflow-x-auto shadow-xs">
        <table className="w-full text-left text-xs sm:text-sm"><thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[11px]"><tr><th className="py-3 px-4">Date</th><th className="py-3 px-4">Buyer</th><th className="py-3 px-4">Quantity</th><th className="py-3 px-4">Price/Litre</th><th className="py-3 px-4">Total Amount</th><th className="py-3 px-4">Recorded By</th><th className="py-3 px-4">Action</th></tr></thead>
          <tbody className="divide-y divide-stone-100 text-stone-800">{sales.map(sale => <tr key={sale.id} className="hover:bg-stone-50/70"><td className="py-3 px-4 font-semibold whitespace-nowrap">{formatDate(sale.date)}</td><td className="py-3 px-4 font-medium whitespace-nowrap">{sale.buyerName}</td><td className="py-3 px-4 whitespace-nowrap">{sale.quantityLitres} L</td><td className="py-3 px-4 whitespace-nowrap">UGX {Math.round(sale.pricePerLitre).toLocaleString()}</td><td className="py-3 px-4 font-bold whitespace-nowrap">UGX {Math.round(sale.totalAmount).toLocaleString()}</td><td className="py-3 px-4 text-stone-500 whitespace-nowrap">{sale.recordedBy || '—'}</td><td className="py-3 px-4"><button type="button" onClick={() => void deleteSale(sale.id)} aria-label={`Delete sale to ${sale.buyerName}`} className="text-red-700"><Trash2 className="w-4 h-4" /></button></td></tr>)}</tbody>
        </table>
      </div></div>}
    </div>
  );
};
