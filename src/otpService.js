// Picks the SMS OTP provider from .env (EXPO_PUBLIC_OTP_PROVIDER).
// All providers expose the same two functions:
//   sendOtp(phoneE164)              -> token (id of this verification)
//   checkOtp(token, phone, code)    -> true (correct) / false (wrong code)
import * as firebase from './providers/firebase';
import * as textbee from './providers/textbee';
import * as smsgate from './providers/smsgate';
import * as infobip from './providers/infobip';
import * as vonage from './providers/vonage';
import * as twilio from './providers/twilio';

const PROVIDERS = { firebase, textbee, smsgate, infobip, vonage, twilio };
const NAMES = {
  firebase: 'Firebase Phone Authentication',
  textbee: 'textbee.dev SMS API',
  smsgate: 'SMS Gateway for Android',
  infobip: 'Infobip 2FA',
  vonage: 'Vonage Verify',
  twilio: 'Twilio Verify',
};

export const providerKey = (process.env.EXPO_PUBLIC_OTP_PROVIDER || 'firebase').toLowerCase();
export const providerName = NAMES[providerKey] || providerKey;

function provider() {
  const p = PROVIDERS[providerKey];
  if (!p) throw new Error(`Unknown EXPO_PUBLIC_OTP_PROVIDER "${providerKey}". Use ${Object.keys(PROVIDERS).join(', ')}.`);
  return p;
}

export const sendOtp = (phone) => provider().sendOtp(phone);
export const checkOtp = (token, phone, code) => provider().checkOtp(token, phone, code);
