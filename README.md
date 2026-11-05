# OTP Phone Number Verification (React Native / Expo + Firebase)

Quiz 4: a React Native / Expo app that verifies a phone number with an SMS one-time password (OTP) using **Firebase Authentication (Phone)**.

## Features

1. Enter a phone number (country code + number).
2. Request an OTP. Firebase sends a 6-digit code by **SMS**.
3. Enter the received OTP in a 6-box input. SMS autofill is supported.
4. Verify the OTP and see a **success ✅ or failure ❌** message.
5. Extras: resend OTP with a 30-second cooldown, change number, input validation, loading states and friendly Firebase error messages.

## Tech stack

- React Native + Expo (runs in **Expo Go**, no native build needed)
- Firebase Authentication: `signInWithPhoneNumber` + `RecaptchaVerifier`
- `react-native-webview` hosts Firebase's reCAPTCHA check. Firebase requires it before sending an SMS.

## Project structure

```
App.js                      UI: phone screen → OTP screen → result screen
src/FirebasePhoneAuth.js    Firebase phone auth (sendOtp / confirmOtp) via WebView + reCAPTCHA
src/firebaseConfig.js       Reads Firebase config from .env
.env.example                Template for the Firebase config
```

## How it works

```
[Send OTP]  App ──sendOtp(phone)──▶ WebView (Firebase JS SDK)
                                      RecaptchaVerifier ✔
                                      auth.signInWithPhoneNumber(phone) ──▶ Firebase ──SMS──▶ 📱
[Verify]    App ──confirmOtp(code)─▶ confirmationResult.confirm(code)
                                      ✔ success  → "Verification Successful"
                                      ✖ auth/invalid-verification-code → "Verification Failed"
```

## Setup

1. **Firebase project**
   - Go to https://console.firebase.google.com and create a project.
   - **Authentication → Get started → Sign-in method → Phone → Enable**.
   - **Project settings → General → Your apps → Add app → Web (`</>`)** and copy the config values.
   - Sending real SMS requires the **Blaze (pay-as-you-go)** plan.
   - Optional for testing: **Authentication → Sign-in method → Phone → Phone numbers for testing**. Add a test number such as `+92 300 0000000` with code `123456`. No SMS is sent for test numbers.

2. **Install and configure**
   ```bash
   npm install
   cp .env.example .env    # then paste your Firebase values into .env
   ```

3. **Run**
   ```bash
   npx expo start
   ```
   Scan the QR code with the **Expo Go** app on your phone.

## Screenshots / Recording

_Add your screenshots and screen recording here._
