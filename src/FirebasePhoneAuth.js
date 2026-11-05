/**
 * Firebase Phone Authentication for Expo Go.
 *
 * Firebase needs a reCAPTCHA check before it sends an SMS, and reCAPTCHA only
 * runs in a browser. This component hosts a small page inside a WebView that
 * runs the official Firebase Web SDK. The page is loaded from the project's
 * own auth domain, which Firebase allows by default.
 *
 * The React Native screen talks to it through two promise-based methods:
 *   ref.current.sendOtp('+923001234567')  -> Firebase sends the SMS
 *   ref.current.confirmOtp('123456')      -> { uid, phoneNumber } or throws
 */
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { firebaseConfig, isFirebaseConfigured } from './firebaseConfig';

const SDK = 'https://www.gstatic.com/firebasejs/10.14.1';

const html = `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>html,body{margin:0;background:transparent;}</style>
<script src="${SDK}/firebase-app-compat.js"></script>
<script src="${SDK}/firebase-auth-compat.js"></script>
</head><body>
<div id="recaptcha-wrap"><div id="recaptcha-container"></div></div>
<script>
  function post(msg) { window.ReactNativeWebView.postMessage(JSON.stringify(msg)); }
  var verifier = null, confirmation = null, auth = null;

  try {
    firebase.initializeApp(${JSON.stringify(firebaseConfig)});
    auth = firebase.auth();
    post({ type: 'ready' });
  } catch (e) {
    post({ type: 'fatal', error: String(e && e.message || e) });
  }

  function resetRecaptcha() {
    try { if (verifier) verifier.clear(); } catch (e) {}
    verifier = null;
    document.getElementById('recaptcha-wrap').innerHTML = '<div id="recaptcha-container"></div>';
  }

  window.sendOtp = function (id, phone) {
    if (!verifier) {
      verifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', { size: 'invisible' });
    }
    auth.signInWithPhoneNumber(phone, verifier)
      .then(function (result) { confirmation = result; post({ id: id, ok: true }); })
      .catch(function (e) { resetRecaptcha(); post({ id: id, ok: false, code: e.code, error: e.message }); });
  };

  window.confirmOtp = function (id, code) {
    if (!confirmation) { post({ id: id, ok: false, code: 'no-otp', error: 'Request an OTP first.' }); return; }
    confirmation.confirm(code)
      .then(function (cred) {
        post({ id: id, ok: true, uid: cred.user.uid, phoneNumber: cred.user.phoneNumber });
        auth.signOut();
      })
      .catch(function (e) { post({ id: id, ok: false, code: e.code, error: e.message }); });
  };
</script>
</body></html>`;

const FRIENDLY_ERRORS = {
  'auth/invalid-phone-number': 'That phone number is not valid. Use the format +92 3001234567.',
  'auth/too-many-requests': 'Too many attempts from this device. Please wait a while and try again.',
  'auth/quota-exceeded': 'The SMS quota for this Firebase project has been exceeded.',
  'auth/billing-not-enabled':
    'Real SMS needs the Firebase Blaze plan. Enable billing, or use a Firebase test phone number.',
  'auth/operation-not-allowed':
    'Phone sign-in is not enabled. Firebase Console → Authentication → Sign-in method → Phone → Enable.',
  'auth/captcha-check-failed': 'reCAPTCHA check failed. Please try again.',
  'auth/code-expired': 'This code has expired. Please request a new OTP.',
  'auth/network-request-failed': 'Network error. Check your internet connection.',
};

export class OtpError extends Error {
  constructor(code, message) {
    super(FRIENDLY_ERRORS[code] || message || 'Something went wrong.');
    this.code = code;
  }
}

const FirebasePhoneAuth = forwardRef(function FirebasePhoneAuth(_props, ref) {
  const webRef = useRef(null);
  const pending = useRef({});
  const nextId = useRef(1);
  const ready = useRef(false);
  const queue = useRef([]);
  const [visible, setVisible] = useState(false);

  function run(fn, arg) {
    if (!isFirebaseConfigured) {
      return Promise.reject(
        new OtpError('config', 'Firebase is not configured. Create a .env file (see .env.example) and restart Expo.')
      );
    }
    const id = nextId.current++;
    const js = `window.${fn}(${id}, ${JSON.stringify(arg)}); true;`;
    return new Promise((resolve, reject) => {
      pending.current[id] = { resolve, reject };
      if (ready.current) webRef.current?.injectJavaScript(js);
      else queue.current.push(js);
    });
  }

  useImperativeHandle(ref, () => ({
    async sendOtp(phone) {
      setVisible(true); // shows the reCAPTCHA challenge if Google asks for one
      try {
        await run('sendOtp', phone);
      } finally {
        setVisible(false);
      }
    },
    confirmOtp(code) {
      return run('confirmOtp', code);
    },
  }));

  function onMessage(event) {
    let msg;
    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (msg.type === 'ready') {
      ready.current = true;
      queue.current.forEach((js) => webRef.current?.injectJavaScript(js));
      queue.current = [];
      return;
    }
    if (msg.type === 'fatal') {
      Object.values(pending.current).forEach((p) => p.reject(new OtpError('fatal', msg.error)));
      pending.current = {};
      return;
    }
    const p = pending.current[msg.id];
    if (!p) return;
    delete pending.current[msg.id];
    if (msg.ok) p.resolve(msg);
    else p.reject(new OtpError(msg.code, msg.error));
  }

  if (!isFirebaseConfigured) return null;

  return (
    <View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[StyleSheet.absoluteFill, { opacity: visible ? 1 : 0 }]}
    >
      <View style={styles.backdrop}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.text}>Sending OTP…</Text>
      </View>
      <WebView
        ref={webRef}
        source={{ html, baseUrl: `https://${firebaseConfig.authDomain}` }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        onMessage={onMessage}
        style={styles.web}
        containerStyle={StyleSheet.absoluteFill}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(238,242,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { marginTop: 12, color: '#4b5563', fontSize: 15 },
  web: { backgroundColor: 'transparent' },
});

export default FirebasePhoneAuth;
