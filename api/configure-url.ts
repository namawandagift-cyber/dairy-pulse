import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  const { url } = req.body || {};

  if (
    !url ||
    typeof url !== 'string' ||
    !url.startsWith('https://script.google.com/')
  ) {
    return res.status(400).json({
      success: false,
      error:
        'Invalid Google Apps Script Web App URL.',
    });
  }

  return res.json({
    success: true,
    message:
      'Google Apps Script URL is valid. Configure APPS_SCRIPT_URL in Vercel Environment Variables for production.',
  });
}