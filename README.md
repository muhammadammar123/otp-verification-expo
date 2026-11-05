# OTP Phone Number Verification (React Native / Expo)

Quiz 4: a React Native / Expo app that verifies a phone number with an **SMS one-time password (OTP)** sent through a third-party SMS / OTP API. It is not email-based.

## Features

1. Enter a phone number (country code + number).
2. Request an OTP. A 6-digit code is sent by **SMS**.
3. Enter the received OTP in a 6-box input. SMS autofill is supported.
4. Verify the OTP and see a **success ✅ or failure ❌** message.
5. Extras: resend OTP with a 30-second cooldown, change number, input validation, loading states and clear error messages for expired codes or too many attempts.

## Third-party SMS / OTP APIs supported

The provider is chosen with one line in `.env` (`EXPO_PUBLIC_OTP_PROVIDER`):

| Provider | API used | Free? | Works in Pakistan |
|----------|----------|-------|-------------------|
| **textbee.dev** (default) | `POST /api/v1/gateway/devices/{id}/send-sms` | Free plan, no card | ✅ sends from your own Android SIM |
| SMS Gateway for Android | `POST https://api.sms-gate.app/3rdparty/v1/messages` | Free, open source | ✅ sends from your own Android SIM |
| Infobip | 2FA API `/2fa/2/pin` + `/verify` | 60-day trial | depends on carrier routes |
| Vonage | Verify API | €2 trial credit | depends on carrier routes |
| Twilio | Verify API | Trial credit | depends on carrier routes |

With **textbee** / **SMS Gateway**, the app generates a random 6-digit OTP (`src/otpCode.js`) and sends it by SMS through the third-party API. It then verifies the code the user types. Each code expires after 5 minutes, allows at most 5 attempts and can be used only once. With **Infobip / Vonage / Twilio**, the provider generates and checks the code on its own servers.

## Tech stack

- React Native + Expo (runs in **Expo Go**)
- `fetch` calls to the provider REST APIs

## Project structure

```
App.js                     UI: phone screen → OTP screen → result screen
src/otpService.js          Chooses the provider from .env
src/otpCode.js             OTP generation, 5-minute expiry, attempt limit, one-time use
src/providers/textbee.js   textbee.dev SMS API
src/providers/smsgate.js   SMS Gateway for Android API
src/providers/infobip.js   Infobip 2FA API
src/providers/vonage.js    Vonage Verify API
src/providers/twilio.js    Twilio Verify API
.env.example               Template for API keys
```

## Flow

```
Phone screen ── sendOtp(+923001234567) ──▶ textbee API ──▶ Android gateway phone ──SMS──▶ 📱
OTP screen   ── checkOtp(token, code)  ──▶ verified? (correct, not expired, attempts left)
Result       ✅ "Verification Successful"  or  ❌ "Verification Failed"
```

## Setup (textbee.dev, free, no card)

1. Create an account at https://textbee.dev.
2. Install the **textbee** Android app (https://textbee.dev/download) on an Android phone with a SIM that has SMS balance.
3. In the textbee dashboard, click **Generate API key**. Register the phone in the app (scan the QR code or paste the key), then copy the **Device ID** from the dashboard.
4. Install and configure:
   ```bash
   npm install
   cp .env.example .env   # set EXPO_PUBLIC_TEXTBEE_API_KEY and EXPO_PUBLIC_TEXTBEE_DEVICE_ID
   ```
5. Run it and scan the QR code with **Expo Go**:
   ```bash
   npx expo start
   ```

The gateway phone can be the same phone you test on. It can send the OTP SMS to its own number.

**To use another provider,** set `EXPO_PUBLIC_OTP_PROVIDER` to `smsgate`, `infobip`, `vonage` or `twilio`, fill in that provider's keys and restart with `npx expo start -c`.

> **Security note:** For this assignment the API keys are loaded from a local, git-ignored `.env` file. In a production app, OTP generation and the API calls should run on a backend server so neither the keys nor the code are ever on the device.

## Screenshots / Recording

_Add your screenshots and screen recording here._
