import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Link as LinkIcon } from 'lucide-react';

export const ConnectionBanner: React.FC = () => {
  const [status, setStatus] = useState<{ configured: boolean; connected: boolean; message?: string; sheets?: string[] } | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const check = async () => {
    const res = await api.checkStatus();
    setStatus(res);
  };

  useEffect(() => {
    check();
  }, []);

  const handleSaveUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setSaving(true);
    setFeedback(null);
    try {
      const res = await api.setAppsScriptUrl(urlInput.trim());
      if (res.success) {
        setFeedback('URL saved. Testing connection...');
        await check();
      } else {
        setFeedback(res.error || 'Failed to save URL.');
      }
    } catch {
      setFeedback('Failed to update URL.');
    } finally {
      setSaving(false);
    }
  };

  // If status is connected and not toggled open, show nothing to keep UI clean
  if (status?.connected && !showConfig) {
    return null;
  }

  return (
    <div className={`border-b text-xs sm:text-sm ${status?.connected ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
      <div className="max-w-6xl mx-auto px-4 py-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            {status?.connected ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span className="font-medium">
              {status?.connected
                ? 'Connected to Google Sheets via Google Apps Script'
                : 'Google Apps Script Web App not connected'}
            </span>
          </div>

          <div className="flex items-center space-x-3 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="inline-flex items-center text-xs font-semibold underline underline-offset-2 hover:opacity-80"
            >
              <LinkIcon className="w-3.5 h-3.5 mr-1" />
              {showConfig ? 'Hide connection settings' : 'Configure Google Apps Script URL'}
              {showConfig ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
            </button>
          </div>
        </div>

        {showConfig && (
          <div className="mt-3 pt-3 border-t border-amber-200/60 bg-white/70 p-3 rounded space-y-2">
            <p className="text-xs text-stone-600 leading-relaxed">
              DairyPulse stores all data in Google Sheets using a Google Apps Script Web App. Follow the instructions in{' '}
              <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800 font-mono">google-apps-script/README.md</code>{' '}
              to deploy your script as a Web App (access set to <strong>Anyone</strong>), then paste your deployment URL below:
            </p>

            <form onSubmit={handleSaveUrl} className="flex flex-col sm:flex-row gap-2 pt-1">
              <input
                type="url"
                required
                placeholder="https://script.google.com/macros/s/.../exec"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 text-xs sm:text-sm px-3 py-1.5 border border-stone-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
              />
              <button
                type="submit"
                disabled={saving}
                className="bg-[#1b4332] text-white px-4 py-1.5 rounded text-xs font-semibold hover:bg-[#2d6a4f] disabled:opacity-50 whitespace-nowrap"
              >
                {saving ? 'Testing...' : 'Save & Connect'}
              </button>
            </form>

            {feedback && <p className="text-xs font-medium text-stone-700">{feedback}</p>}
          </div>
        )}
      </div>
    </div>
  );
};
