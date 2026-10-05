import React, { useEffect, useState } from 'react';
import { Buyer, Sale } from '../types';
import { api } from '../services/api';
import { PlusCircle, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export const SalesView: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // Form
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
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
                  step="50"
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

      {/* Sales Table */}
      <div className="mt-8">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-stone-500">Loading sales records...</div>
        ) : sales.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-lg p-10 text-center text-sm text-stone-500">
            No sales recorded yet. Click "Record Sale" to add your first transaction.
          </div>
        ) : (
          <div className="bg-white border border-stone-200 rounded-lg overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Buyer</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Price/Litre</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold whitespace-nowrap">{formatDate(s.date)}</td>
                    <td className="py-3 px-4 font-medium whitespace-nowrap">{s.buyerName}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{s.quantityLitres} L</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      UGX {Math.round(s.pricePerLitre).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-stone-900 whitespace-nowrap">
                      UGX {Math.round(s.totalAmount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-stone-500 whitespace-nowrap">{s.recordedBy || '—'}</td>
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
