// Vonage Verify API: https://developer.vonage.com/en/api/verify
// Free €2 trial credit, no credit card. SMS goes to the number registered on your account.

const API_KEY = process.env.EXPO_PUBLIC_VONAGE_API_KEY;
const API_SECRET = process.env.EXPO_PUBLIC_VONAGE_API_SECRET;

async function call(path, params) {
  if (!API_KEY || !API_SECRET) {
    throw new Error('Vonage is not configured. Add EXPO_PUBLIC_VONAGE_API_KEY and EXPO_PUBLIC_VONAGE_API_SECRET to .env');
  }
  const body = Object.entries({ api_key: API_KEY, api_secret: API_SECRET, ...params })
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  const res = await fetch(`https://api.nexmo.com${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  return res.json();
}

export async function sendOtp(phone) {
  const data = await call('/verify/json', {
    number: phone.replace(/^\+/, ''),
    brand: 'OTP App',
    code_length: 6,
    workflow_id: 6, // SMS only
  });
  if (data.status !== '0') {
    throw new Error(data.error_text || `Vonage error (status ${data.status})`);
  }
  return data.request_id;
}

export async function checkOtp(requestId, _phone, code) {
  const data = await call('/verify/check/json', { request_id: requestId, code });
  if (data.status === '0') return true;
  if (data.status === '16') return false; // wrong code
  if (data.status === '17') throw new Error('Too many wrong attempts. Please request a new OTP.');
  if (data.status === '6') throw new Error('This code has expired. Please request a new OTP.');
  throw new Error(data.error_text || `Vonage error (status ${data.status})`);
}
