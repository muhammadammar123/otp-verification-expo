// OTP generation + verification for SMS-gateway providers (textbee, SMS Gateway for Android).
// These gateways only deliver the SMS, so the app creates the 6-digit code,
// remembers it for 5 minutes and allows at most 5 attempts.
// (Infobip / Vonage / Twilio generate and check the code on their own servers.)

const TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const store = new Map(); // token -> { phone, code, expiresAt, attempts }

function randomDigits(n) {
  const bytes = new Uint8Array(n);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let i = 0; i < n; i++) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (b) => String(b % 10)).join('');
}

export function createOtp(phone) {
  const code = randomDigits(6);
  const token = `${Date.now()}-${randomDigits(6)}`;
  store.set(token, { phone, code, expiresAt: Date.now() + TTL_MS, attempts: 0 });
  return { token, code };
}

export function discardOtp(token) {
  store.delete(token);
}

export function verifyOtp(token, code) {
  const entry = store.get(token);
  if (!entry) throw new Error('No active code. Please request a new OTP.');
  if (Date.now() > entry.expiresAt) {
    store.delete(token);
    throw new Error('This code has expired. Please request a new OTP.');
  }
  if (entry.attempts >= MAX_ATTEMPTS) {
    store.delete(token);
    throw new Error('Too many wrong attempts. Please request a new OTP.');
  }
  entry.attempts += 1;
  if (code === entry.code) {
    store.delete(token); // one-time use
    return true;
  }
  return false;
}

export const otpMessage = (code) =>
  `Your verification code is ${code}. It expires in 5 minutes. Do not share it with anyone.`;
