import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// In-memory or env-based APPS_SCRIPT_URL
let currentAppsScriptUrl = process.env.APPS_SCRIPT_URL || '';

/**
 * Status / Health Check Endpoint
 */
app.get('/api/status', async (req: Request, res: Response) => {
  if (!currentAppsScriptUrl) {
    return res.json({
      configured: false,
      connected: false,
      message: 'APPS_SCRIPT_URL is not configured.',
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const gasRes = await fetch(currentAppsScriptUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (gasRes.ok) {
      const data = await gasRes.json().catch(() => null);
      return res.json({
        configured: true,
        connected: true,
        message: data?.message || 'Google Apps Script is reachable and operational.',
        spreadsheetName: data?.spreadsheetName,
        sheets: data?.sheets,
      });
    } else {
      return res.json({
        configured: true,
        connected: false,
        message: `Google Apps Script returned HTTP status ${gasRes.status}`,
      });
    }
  } catch (err: any) {
    return res.json({
      configured: true,
      connected: false,
      message: `Failed to connect to Google Apps Script: ${err.message}`,
    });
  }
});

/**
 * Endpoint to configure Google Apps Script URL dynamically
 */
app.post('/api/configure-url', (req: Request, res: Response) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string' || !url.startsWith('https://script.google.com/')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid URL. Must be a valid Google Apps Script Web App URL starting with https://script.google.com/',
    });
  }

  currentAppsScriptUrl = url.trim();

  // Try updating .env file for persistence across server restarts
  try {
    const envPath = path.resolve(__dirname, '.env');
    let content = '';
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, 'utf8');
      if (content.includes('APPS_SCRIPT_URL=')) {
        content = content.replace(/APPS_SCRIPT_URL=.*(\r?\n|$)/g, `APPS_SCRIPT_URL="${currentAppsScriptUrl}"$1`);
      } else {
        content += `\nAPPS_SCRIPT_URL="${currentAppsScriptUrl}"\n`;
      }
    } else {
      content = `APPS_SCRIPT_URL="${currentAppsScriptUrl}"\n`;
    }
    fs.writeFileSync(envPath, content, 'utf8');
  } catch (e) {
    // Non-fatal if filesystem is read-only
  }

  return res.json({
    success: true,
    message: 'Google Apps Script URL updated successfully.',
  });
});

/**
 * Proxy dispatcher to Google Apps Script
 */
async function forwardToAppsScript(payload: Record<string, any>, res: Response) {
  if (!currentAppsScriptUrl) {
    return res.status(503).json({
      success: false,
      error: 'Google Apps Script Web App URL is not configured. Please set APPS_SCRIPT_URL.',
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

    const gasRes = await fetch(currentAppsScriptUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const text = await gasRes.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(502).json({
        success: false,
        error: 'Unable to connect to DairyPulse. Please check your connection and try again.',
        details: text.slice(0, 300),
      });
    }

    return res.status(gasRes.ok ? 200 : 400).json(data);
  } catch (err: any) {
    return res.status(502).json({
      success: false,
      error: 'Unable to connect to DairyPulse. Please check your connection and try again.',
      details: err.message,
    });
  }
}

app.post('/api/action', async (req: Request, res: Response) => {
  return forwardToAppsScript(req.body, res);
});

app.post('/api/:action', async (req: Request, res: Response) => {
  const payload = {
    ...req.body,
    action: req.params.action,
  };
  return forwardToAppsScript(payload, res);
});

/**
 * Start Server
 */
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DairyPulse server listening on port ${PORT}`);
  });
}

startServer();
