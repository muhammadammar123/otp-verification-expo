// Firebase Authentication – Phone sign-in, via the Identity Toolkit REST API
// Docs: https://cloud.google.com/identity-platform/docs/reference/rest/v1/accounts
//
//   1. accounts:sendVerificationCode   -> Firebase creates the OTP and returns a sessionInfo
//   2. accounts:signInWithPhoneNumber  -> Firebase checks the code for that sessionInfo
//
// Works on the free Spark plan (no card) with "Phone numbers for testing" set in the
// Firebase Console. On the Blaze plan the same code sends a real SMS.

const API_KEY = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
const BASE = 'https://identitytoolkit.googleapis.com/v1/accounts';

const MESSAGES = {
  INVALID_PHONE_NUMBER: 'That phone number is not valid.',
  TOO_MANY_ATTEMPTS_TRY_LATER: 'Too many attempts. Please wait a few minutes and try again.',
  QUOTA_EXCEEDED: 'SMS quota exceeded for this Firebase project.',
  OPERATION_NOT_ALLOWED:
    'Phone sign-in is disabled. Firebase Console → Authentication → Sign-in method → Phone → Enable.',
  BILLING_NOT_ENABLED:
    'Real SMS needs the Blaze plan. Use a number listed under "Phone numbers for testing" in Firebase.',
  SESSION_EXPIRED: 'This code has expired. Please request a new OTP.',
  INVALID_SESSION_INFO: 'This code has expired. Please request a new OTP.',
  MISSING_RECAPTCHA_TOKEN:
    'Firebase wants a reCAPTCHA check for this number. Use a number from "Phone numbers for testing".',
  INVALID_APP_CREDENTIAL:
    'Firebase rejected the app check for this number. Use a number from "Phone numbers for testing".',
};

function friendly(raw) {
  const code = String(raw || '').split(' ')[0].split(':')[0];
  if (/region/i.test(raw) || code === 'SMS_REGION_NOT_ALLOWED')
    return 'Pakistan is blocked. Firebase Console → Authentication → Settings → SMS region policy → allow Pakistan.';
  if (/API key not valid/i.test(raw)) return 'Firebase API key is not valid. Check EXPO_PUBLIC_FIREBASE_API_KEY in .env.';
  return MESSAGES[code] || raw || 'Firebase request failed.';
}

async function call(endpoint, body) {
  if (!API_KEY) {
    throw new Error('Firebase is not configured. Add EXPO_PUBLIC_FIREBASE_API_KEY to .env');
  }
  const res = await fetch(`${BASE}:${endpoint}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(friendly(data?.error?.message));
    err.code = String(data?.error?.message || '').split(' ')[0];
    throw err;
  }
  return data;
}

export async function sendOtp(phone) {
  const data = await call('sendVerificationCode', {
    phoneNumber: phone,
    // Test numbers skip the reCAPTCHA check, so a placeholder token is enough.
    recaptchaToken: 'expo-test-number',
  });
  return data.sessionInfo;
}

export async function checkOtp(sessionInfo, _phone, code) {
  try {
    await call('signInWithPhoneNumber', { sessionInfo, code });
    return true;
  } catch (e) {
    if (e.code === 'INVALID_CODE') return false; // wrong OTP -> failure screen
    throw e;
  }
}
