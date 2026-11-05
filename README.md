# OTP Phone Number Verification (React Native / Expo)

Quiz 4: a React Native / Expo app that verifies a phone number with an **SMS one-time password (OTP)** sent by a third-party OTP verification API. It is not email-based.

## Features

1. Enter a phone number (country code + number).
2. Request an OTP. A 6-digit code is sent by **SMS**.
3. Enter the received OTP in a 6-box input. SMS autofill is supported.
4. Verify the OTP and see a **success ✅ or failure ❌** message.
5. Extras: resend OTP with a 30-second cooldown, change number, input validation, loading states and clear error messages for expired codes or too many attempts.

## Third-party OTP APIs supported

The provider is chosen with one line in `.env` (`EXPO_PUBLIC_OTP_PROVIDER`):

| Provider | API used | Free trial (no credit card) |
|----------|----------|-----------------------------|
| **Infobip** (default) | 2FA API: `POST /2fa/2/pin` → `POST /2fa/2/pin/{pinId}/verify` | 60 days, free SMS to your verified number |
| **Vonage** | Verify API: `/verify/json` → `/verify/check/json` | €2 credit, SMS to your registered number |
| **Twilio** | Verify API: `/Verifications` → `/VerificationCheck` | Trial credit, SMS to verified numbers |

The provider generates the OTP, sends the SMS and checks the code. The app never sees or stores the real code.

## Tech stack

- React Native + Expo (runs in **Expo Go**)
- `fetch` calls to the provider REST APIs

## Project structure

```
App.js                     UI: phone screen → OTP screen → result screen
src/otpService.js          Chooses the provider from .env
src/providers/infobip.js   Infobip 2FA API (auto-creates 2FA application + template)
src/providers/vonage.js    Vonage Verify API
src/providers/twilio.js    Twilio Verify API
.env.example               Template for API keys
```

## Flow

```
Phone screen ── sendOtp(+923001234567) ──▶ Provider API ──SMS──▶ 📱
                     ◀── verification id ──
OTP screen   ── checkOtp(id, code) ──────▶ Provider API
                     ◀── verified: true / false ──
Result       ✅ "Verification Successful"  or  ❌ "Verification Failed"
```

## Setup (Infobip, free, no card)

1. Sign up at https://www.infobip.com/signup. You can use Google or GitHub. Verify your email and **your phone number**. During the trial, SMS can only be sent to this number.
2. On the portal homepage, copy your **API Base URL** (e.g. `abcd12.api.infobip.com`) and **API key**.
3. Install and configure:
   ```bash
   npm install
   cp .env.example .env   # paste the Base URL and API key into .env
   ```
4. Run it and scan the QR code with **Expo Go**:
   ```bash
   npx expo start
   ```

On the first OTP request, the app creates the Infobip 2FA application and message template for you.

**To use Vonage or Twilio instead,** set `EXPO_PUBLIC_OTP_PROVIDER=vonage` (or `twilio`), fill in that provider's keys and restart with `npx expo start -c`.

> **Security note:** For this assignment the API keys are loaded from a local, git-ignored `.env` file. In a production app these calls should go through a backend server so the keys are never shipped inside the app.

## Screenshots / Recording

_Add your screenshots and screen recording here._
