// Picks the SMS OTP provider from .env (EXPO_PUBLIC_OTP_PROVIDER).
// All providers expose the same two functions:
//   sendOtp(phoneE164)              -> token (id of this verification)
//   checkOtp(token, phone, code)    -> true (correct) / false (wrong code)
import * as infobip from './providers/infobip';
import * as vonage from './providers/vonage';
import * as twilio from './providers/twilio';

const PROVIDERS = { infobip, vonage, twilio };
const NAMES = { infobip: 'Infobip 2FA', vonage: 'Vonage Verify', twilio: 'Twilio Verify' };

export const providerKey = (process.env.EXPO_PUBLIC_OTP_PROVIDER || 'infobip').toLowerCase();
export const providerName = NAMES[providerKey] || providerKey;

function provider() {
  const p = PROVIDERS[providerKey];
  if (!p) throw new Error(`Unknown EXPO_PUBLIC_OTP_PROVIDER "${providerKey}". Use infobip, vonage or twilio.`);
  return p;
}

export const sendOtp = (phone) => provider().sendOtp(phone);
export const checkOtp = (token, phone, code) => provider().checkOtp(token, phone, code);
