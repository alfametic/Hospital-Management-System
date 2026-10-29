const QRCode = require('qrcode');

/**
 * Resolves the client application base URL.
 * Supports environment variables, reverse proxies, and local development.
 */
const getBaseUrl = (customUrl = null) => {
  // 1. Explicitly passed parameter (e.g. from req.headers.origin or caller)
  if (customUrl && typeof customUrl === 'string' && customUrl.trim()) {
    return customUrl.trim().replace(/\/$/, '');
  }
  // 2. Configurable FRONTEND_URL environment variable
  if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.trim()) {
    return process.env.FRONTEND_URL.trim().replace(/\/$/, '');
  }
  // 3. Backward-compatible CLIENT_URL environment variable
  if (process.env.CLIENT_URL && process.env.CLIENT_URL.trim()) {
    return process.env.CLIENT_URL.trim().replace(/\/$/, '');
  }
  // 4. Default Vite development port
  return 'http://localhost:3000';
};

/**
 * Generates an opaque QR Code Data URL for patient identification.
 * IMPORTANT SECURITY POLICY:
 * - When scanned with a standard smartphone camera, it opens the hospital's
 *   dedicated Patient Verification page instead of triggering a web search query.
 * - When scanned with the Doctor Portal in-app scanner, the opaque code is parsed
 *   to securely load the authorized clinical EMR chart.
 * - This QR payload contains ONLY the verification URL with the opaque patient code.
 * - It contains NO medical records, diagnoses, prescriptions, or private health details.
 *
 * @param {string} patientCode - Opaque identifier (e.g. PAT-2026-A101)
 * @param {string} [baseUrl] - Optional host URL for deployed application
 * @returns {Promise<string>} Base64 Data URL string
 */
const generatePatientQRCode = async (patientCode, baseUrl = null) => {
  try {
    const host = getBaseUrl(baseUrl);
    const cleanCode = (patientCode || '').trim().toUpperCase();

    // Verification URL format ensures standard phone camera apps recognize it
    // as an actionable web link rather than generic search text.
    const qrPayload = `${host}/verify-patient?code=${encodeURIComponent(cleanCode)}`;

    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 2,
      width: 320,
      color: {
        dark: '#0d3b66',
        light: '#ffffff'
      }
    });
    return qrDataUrl;
  } catch (err) {
    console.error('QR code generation error:', err);
    throw err;
  }
};

module.exports = {
  generatePatientQRCode,
  getBaseUrl
};
