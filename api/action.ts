import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  const url = process.env.APPS_SCRIPT_URL;

  if (!url) {
    return res.status(503).json({
      success: false,
      error: 'Google Apps Script is not configured.',
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const gasResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const text = await gasResponse.text();

    let data: any;

    try {
      data = JSON.parse(text);
    } catch {
      return res.status(502).json({
        success: false,
        error: 'Google Apps Script returned an invalid response.',
      });
    }

    return res.status(gasResponse.ok ? 200 : 400).json(data);
  } catch (error: any) {
    return res.status(502).json({
      success: false,
      error: 'Unable to connect to DairyPulse.',
      details: error?.message || 'Unknown error',
    });
  }
}
