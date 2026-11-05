// SMS Gateway for Android (sms-gate.app) cloud API: https://docs.sms-gate.app
// Free and open source, no account email or card. SMS is sent from the SIM of an
// Android phone running the "SMS Gateway" app (Cloud Server mode).
import { createOtp, discardOtp, otpMessage, verifyOtp } from '../otpCode';

const USERNAME = process.env.EXPO_PUBLIC_SMSGATE_USERNAME;
const PASSWORD = process.env.EXPO_PUBLIC_SMSGATE_PASSWORD;

export async function sendOtp(phone) {
  if (!USERNAME || !PASSWORD) {
    throw new Error('SMS Gateway is not configured. Add EXPO_PUBLIC_SMSGATE_USERNAME and EXPO_PUBLIC_SMSGATE_PASSWORD to .env');
  }
  const { token, code } = createOtp(phone);
  const res = await fetch('https://api.sms-gate.app/3rdparty/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + btoa(`${USERNAME}:${PASSWORD}`),
    },
    body: JSON.stringify({ textMessage: { text: otpMessage(code) }, phoneNumbers: [phone] }),
  });
  if (!res.ok) {
    discardOtp(token);
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `SMS Gateway request failed (HTTP ${res.status})`);
  }
  return token;
}

export async function checkOtp(token, _phone, code) {
  return verifyOtp(token, code);
}
