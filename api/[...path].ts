import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();

app.use(express.json());

let currentAppsScriptUrl = process.env.APPS_SCRIPT_URL || '';

app.get('/api/status', async (_req: Request, res: Response) => {
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
        message:
          data?.message ||
          'Google Apps Script is reachable and operational.',
        spreadsheetName: data?.spreadsheetName,
        sheets: data?.sheets,
      });
    }

    return res.json({
      configured: true,
      connected: false,
      message: `Google Apps Script returned HTTP status ${gasRes.status}`,
    });
  } catch (err: any) {
    return res.json({
      configured: true,
      connected: false,
      message: `Failed to connect to Google Apps Script: ${err.message}`,
    });
  }
});

app.post('/api/configure-url', (req: Request, res: Response) => {
  const { url } = req.body;

  if (
    !url ||
    typeof url !== 'string' ||
    !url.startsWith('https://script.google.com/')
  ) {
    return res.status(400).json({
      success: false,
      error:
        'Invalid URL. Must be a valid Google Apps Script Web App URL starting with https://script.google.com/',
    });
  }

  currentAppsScriptUrl = url.trim();

  try {
    const envPath = path.resolve(process.cwd(), '.env');
    let content = '';

    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, 'utf8');

      if (content.includes('APPS_SCRIPT_URL=')) {
        content = content.replace(
          /APPS_SCRIPT_URL=.*(\r?\n|$)/g,
          `APPS_SCRIPT_URL="${currentAppsScriptUrl}"$1`,
        );
      } else {
        content += `\nAPPS_SCRIPT_URL="${currentAppsScriptUrl}"\n`;
      }
    } else {
      content = `APPS_SCRIPT_URL="${currentAppsScriptUrl}"\n`;
    }

    fs.writeFileSync(envPath, content, 'utf8');
  } catch {
    // Vercel/serverless filesystem may be read-only.
  }

  return res.json({
    success: true,
    message: 'Google Apps Script URL updated successfully.',
  });
});

async function forwardToAppsScript(
  payload: Record<string, any>,
  res: Response,
) {
  if (!currentAppsScriptUrl) {
    return res.status(503).json({
      success: false,
      error:
        'Google Apps Script Web App URL is not configured. Please set APPS_SCRIPT_URL.',
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

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
        error:
          'Unable to connect to DairyPulse. Please check your connection and try again.',
        details: text.slice(0, 300),
      });
    }

    return res.status(gasRes.ok ? 200 : 400).json(data);
  } catch (err: any) {
    return res.status(502).json({
      success: false,
      error:
        'Unable to connect to DairyPulse. Please check your connection and try again.',
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

