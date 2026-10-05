import type { VercelRequest, VercelResponse } from '@vercel/node';

const getAppsScriptUrl = () => {
  return process.env.APPS_SCRIPT_URL || '';
};

async function readResponse(response: Response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return {
      success: false,
      error: text || 'Invalid response from Apps Script'
    };
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const appsScriptUrl = getAppsScriptUrl();

  if (req.method === 'GET') {
    if (!appsScriptUrl) {
      return res.status(200).json({
        configured: false,
        connected: false,
        message: 'APPS_SCRIPT_URL is not configured in Vercel.'
      });
    }

    try {
      const response = await fetch(appsScriptUrl, {
        method: 'GET',
        redirect: 'follow'
      });

      const data = await readResponse(response);

      return res.status(200).json({
        configured: true,
        connected: response.ok,
        message: response.ok
          ? 'Google Apps Script connection is working.'
          : 'Google Apps Script returned an error.',
        ...data
      });
    } catch (error) {
      return res.status(200).json({
        configured: true,
        connected: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to connect to Google Apps Script.'
      });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const action = req.body?.action;

  if (!action) {
    return res.status(400).json({
      success: false,
      error: 'Missing action'
    });
  }

  if (action === 'configure-url') {
    return res.status(200).json({
      success: true,
      configured: Boolean(appsScriptUrl),
      message: appsScriptUrl
        ? 'APPS_SCRIPT_URL is configured.'
        : 'Set APPS_SCRIPT_URL in Vercel.'
    });
  }

  if (!appsScriptUrl) {
    return res.status(500).json({
      success: false,
      error:
        'APPS_SCRIPT_URL is not configured in Vercel. Add it under Project Settings → Environment Variables.'
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body),
      redirect: 'follow',
      signal: controller.signal
    });

    clearTimeout(timeout);

    const data = await readResponse(response);

    return res.status(response.ok ? 200 : response.status).json(data);
  } catch (error) {
    return res.status(502).json({
      success: false,
      error:
        error instanceof Error
          ? error.name === 'AbortError'
            ? 'Request to Google Apps Script timed out.'
            : error.message
          : 'Unable to reach Google Apps Script.'
    });
  }
}