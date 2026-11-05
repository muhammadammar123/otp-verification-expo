// Infobip 2FA (OTP) API: https://www.infobip.com/docs/api/channels/sms/2fa
// Free 60-day trial, no credit card. SMS goes to the number you verified at sign-up.
//
// On first use the app finds or creates a 2FA "application" and "message template"
// in your Infobip account, so you only need the API key and base URL.

const BASE_URL = (process.env.EXPO_PUBLIC_INFOBIP_BASE_URL || '')
  .replace(/^https?:\/\//, '')
  .replace(/\/+$/, '');
const API_KEY = process.env.EXPO_PUBLIC_INFOBIP_API_KEY;
const APP_NAME = 'OTP Verification Expo';

let cached = null; // { applicationId, messageId }

async function api(method, path, body) {
  if (!BASE_URL || !API_KEY) {
    throw new Error('Infobip is not configured. Add EXPO_PUBLIC_INFOBIP_BASE_URL and EXPO_PUBLIC_INFOBIP_API_KEY to .env');
  }
  const res = await fetch(`https://${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `App ${API_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      data?.requestError?.serviceException?.text ||
      data?.requestError?.serviceException?.messageId ||
      `Infobip request failed (HTTP ${res.status})`;
    throw new Error(msg);
  }
  return data;
}

async function setup() {
  if (cached) return cached;

  // 1. 2FA application (reuse if it already exists)
  const apps = await api('GET', '/2fa/2/applications');
  let app = (Array.isArray(apps) ? apps : []).find((a) => a.name === APP_NAME);
  if (!app) {
    app = await api('POST', '/2fa/2/applications', {
      name: APP_NAME,
      enabled: true,
      configuration: {
        pinAttempts: 5,
        allowMultiplePinVerificationsPerPhoneNumber: true,
        pinTimeToLive: '10m',
        verifyPinLimit: '2/1s',
        sendPinPerApplicationLimit: '100/1d',
        sendPinPerPhoneNumberLimit: '10/1d',
      },
    });
  }

  // 2. Message template containing the {{pin}} placeholder
  const templates = await api('GET', `/2fa/2/applications/${app.applicationId}/messages`);
  let tpl = Array.isArray(templates) && templates[0];
  if (!tpl) {
    tpl = await api('POST', `/2fa/2/applications/${app.applicationId}/messages`, {
      pinType: 'NUMERIC',
      pinLength: 6,
      messageText: 'Your verification code is {{pin}}. It expires in 10 minutes.',
    });
  }

  cached = { applicationId: app.applicationId, messageId: tpl.messageId };
  return cached;
}

export async function sendOtp(phone) {
  const { applicationId, messageId } = await setup();
  const data = await api('POST', '/2fa/2/pin', {
    applicationId,
    messageId,
    to: phone.replace(/^\+/, ''), // Infobip wants 923001234567 (no "+")
  });
  if (data.smsStatus && data.smsStatus !== 'MESSAGE_SENT') {
    throw new Error(`SMS not sent (${data.smsStatus}). Is this the number you verified on Infobip?`);
  }
  return data.pinId; // used to verify the code later
}

export async function checkOtp(pinId, _phone, code) {
  const data = await api('POST', `/2fa/2/pin/${pinId}/verify`, { pin: code });
  if (data.verified) return true;
  if (data.pinError === 'TTL_EXPIRED') throw new Error('This code has expired. Please request a new OTP.');
  if (data.pinError === 'NO_MORE_PIN_ATTEMPTS') throw new Error('Too many wrong attempts. Please request a new OTP.');
  return false; // WRONG_PIN
}
