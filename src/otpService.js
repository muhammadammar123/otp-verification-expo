// OTP service used by the UI.
//   sendOtp(phoneE164)              -> sessionInfo (id of this verification)
//   checkOtp(sessionInfo, phone, code) -> true (correct) / false (wrong code)
export { sendOtp, checkOtp } from './providers/firebase';

export const providerName = 'Firebase Phone Authentication';
