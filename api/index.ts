import express, { Request, Response } from 'express';

const app = express();

app.use(express.json());

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || '';

app.get('/api/status', async (_req: Request, res: Response) => {
  if (!APPS_SCRIPT_URL) {
    return res.json({
      configured: false,
      connected: false,
      message: 'APPS_SCRIPT_URL is not configured in Vercel.',
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const gasRes = await fetch(APPS_SCRIPT_URL, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const text = await gasRes.text();

    let data: any = null;

    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }

    if (!gasRes.ok) {
      return res.json({
        configured: true,
        connected: false,
        message: `Google Apps Script returned HTTP ${gasRes.status}.`,
        details: text.slice(0, 300),
      });
    }

    return res.json({
      configured: true,
      connected: true,
      message:
        data?.message ||
        'Google Apps Script is reachable and operational.',
      spreadsheetName: data?.spreadsheetName,
      sheets: data?.sheets,
    });
  } catch (error: any) {
    return res.json({
      configured: true,
      connected: false,
      message:
        error?.name === 'AbortError'
          ? 'Google Apps Script connection timed out.'
          : `Failed to connect to Google Apps Script: ${error?.message || 'Unknown error'}`,
    });
  }
});

app.post('/api/configure-url', (_req: Request, res: Response) => {
  return res.status(400).json({
    success: false,
    error:
      'APPS_SCRIPT_URL must be configured in Vercel Environment Variables.',
  });
});

app.post('/api/action', async (req: Request, res: Response) => {
  if (!APPS_SCRIPT_URL) {
    return res.status(503).json({
      success: false,
      error: 'APPS_SCRIPT_URL is not configured in Vercel.',
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const gasRes = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const text = await gasRes.text();

    let data: any;

    try {
      data = JSON.parse(text);
    } catch {
      return res.status(502).json({
        success: false,
        error:
          'Google Apps Script returned an invalid response.',
        details: text.slice(0, 300),
      });
    }

    return res.status(gasRes.ok ? 200 : 400).json(data);
  } catch (error: any) {
    return res.status(502).json({
      success: false,
      error:
        error?.name === 'AbortError'
          ? 'Google Apps Script request timed out.'
          : 'Unable to connect to Google Apps Script.',
      details: error?.message,
    });
  }
});

export default app;
