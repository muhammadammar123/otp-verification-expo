// Twilio Verify API: https://www.twilio.com/docs/verify/api
// Free trial credit, no credit card. SMS goes to verified caller IDs only.

const ACCOUNT_SID = process.env.EXPO_PUBLIC_TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.EXPO_PUBLIC_TWILIO_AUTH_TOKEN;
const SERVICE_SID = process.env.EXPO_PUBLIC_TWILIO_VERIFY_SERVICE_SID;

async function post(path, params) {
  if (!ACCOUNT_SID || !AUTH_TOKEN || !SERVICE_SID) {
    throw new Error('Twilio is not configured. Add the EXPO_PUBLIC_TWILIO_* values to .env');
  }
  const res = await fetch(`https://verify.twilio.com/v2/Services/${SERVICE_SID}${path}`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(`${ACCOUNT_SID}:${AUTH_TOKEN}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&'),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 404 && path === '/VerificationCheck') {
      throw new Error('This code has expired or was already used. Please request a new OTP.');
    }
    throw new Error(data.message || `Twilio request failed (HTTP ${res.status})`);
  }
  return data;
}

export async function sendOtp(phone) {
  await post('/Verifications', { To: phone, Channel: 'sms' });
  return phone;
}

export async function checkOtp(_token, phone, code) {
  const data = await post('/VerificationCheck', { To: phone, Code: code });
  return data.status === 'approved';
}
