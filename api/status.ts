import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse
) {
  const url = process.env.APPS_SCRIPT_URL;

  if (!url) {
    return res.json({
      configured: false,
      connected: false,
      message: 'Google Apps Script is not configured.',
    });
  }

  try {
    const controller = new AbortController();
   const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data = await response.json().catch(() => null);

    if (response.ok) {
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
      message: `Google Apps Script returned HTTP status ${response.status}`,
    });
  } catch (error: any) {
    return res.json({
      configured: true,
      connected: false,
      message:
        'Failed to connect to Google Apps Script: ' +
        (error?.message || 'Unknown error'),
    });
  }
}
