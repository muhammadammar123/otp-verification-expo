// textbee.dev SMS gateway API: https://textbee.dev/docs
// Free plan, no credit card. SMS is sent from the SIM of an Android phone running
// the textbee app, so it works with local Pakistani numbers (Jazz, Zong, Telenor, Ufone).
import { createOtp, discardOtp, otpMessage, verifyOtp } from '../otpCode';

const API_KEY = process.env.EXPO_PUBLIC_TEXTBEE_API_KEY;
const DEVICE_ID = process.env.EXPO_PUBLIC_TEXTBEE_DEVICE_ID;

export async function sendOtp(phone) {
  if (!API_KEY || !DEVICE_ID) {
    throw new Error('textbee is not configured. Add EXPO_PUBLIC_TEXTBEE_API_KEY and EXPO_PUBLIC_TEXTBEE_DEVICE_ID to .env');
  }
  const { token, code } = createOtp(phone);
  const res = await fetch(`https://api.textbee.dev/api/v1/gateway/devices/${DEVICE_ID}/send-sms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
    body: JSON.stringify({ recipients: [phone], message: otpMessage(code) }),
  });
  if (!res.ok) {
    discardOtp(token);
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || data.error || `textbee request failed (HTTP ${res.status})`);
  }
  return token;
}

export async function checkOtp(token, _phone, code) {
  return verifyOtp(token, code);
}
