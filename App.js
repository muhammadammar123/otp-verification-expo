import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { checkOtp, providerName, sendOtp } from './src/otpService';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function App() {
  // step: 'phone' -> 'otp' -> 'result'
  const [step, setStep] = useState('phone');
  const [countryCode, setCountryCode] = useState('+92');
  const [number, setNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [verified, setVerified] = useState(null); // true | false | null
  const [timer, setTimer] = useState(0);
  const otpRef = useRef(null);
  const [token, setToken] = useState(null); // id of the current verification (pinId / request_id)

  // E.164 phone number, e.g. +923001234567 (leading 0 of local number removed)
  const fullPhone = `${countryCode.trim()}${number.replace(/\D/g, '').replace(/^0+/, '')}`;
  const phoneValid = /^\+\d{1,4}$/.test(countryCode.trim()) && /^\+\d{8,15}$/.test(fullPhone);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timer]);

  async function handleSendOtp() {
    setError('');
    setInfo('');
    if (!phoneValid) {
      setError('Please enter a valid phone number.');
      return;
    }
    setLoading(true);
    try {
      const id = await sendOtp(fullPhone);
      setToken(id);
      setOtp('');
      setStep('otp');
      setTimer(RESEND_SECONDS);
      setInfo(`OTP sent by SMS to ${fullPhone}`);
      setTimeout(() => otpRef.current?.focus(), 300);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setError('');
    if (otp.length !== OTP_LENGTH) {
      setError(`Enter the ${OTP_LENGTH}-digit code.`);
      return;
    }
    setLoading(true);
    try {
      const ok = await checkOtp(token, fullPhone, otp);
      setVerified(ok); // true -> success screen, false -> failure screen
      setStep('result');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep('phone');
    setOtp('');
    setError('');
    setInfo('');
    setVerified(null);
    setTimer(0);
  }

  function tryAgain() {
    setStep('otp');
    setOtp('');
    setError('');
    setInfo('');
    setVerified(null);
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <View style={styles.card}>
        <Text style={styles.logo}>🔐</Text>
        <Text style={styles.title}>Phone Verification</Text>

        {step === 'phone' && (
          <>
            <Text style={styles.subtitle}>
              Enter your phone number. We'll send a one-time password (OTP) by SMS.
            </Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.codeInput]}
                value={countryCode}
                onChangeText={(t) => setCountryCode(t.startsWith('+') ? t : `+${t}`)}
                keyboardType="phone-pad"
                maxLength={5}
              />
              <TextInput
                style={[styles.input, styles.flex]}
                value={number}
                onChangeText={setNumber}
                placeholder="3001234567"
                placeholderTextColor="#9aa3af"
                keyboardType="phone-pad"
                maxLength={15}
                autoFocus
              />
            </View>
            <PrimaryButton
              label="Send OTP"
              onPress={handleSendOtp}
              loading={loading}
              disabled={!phoneValid}
            />
          </>
        )}

        {step === 'otp' && (
          <>
            <Text style={styles.subtitle}>Enter the 6-digit code sent to</Text>
            <Text style={styles.phone}>{fullPhone}</Text>

            {/* Hidden input + visual boxes */}
            <Pressable onPress={() => otpRef.current?.focus()} style={styles.otpRow}>
              {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                <View
                  key={i}
                  style={[styles.otpBox, otp.length === i && styles.otpBoxActive]}
                >
                  <Text style={styles.otpDigit}>{otp[i] || ''}</Text>
                </View>
              ))}
            </Pressable>
            <TextInput
              ref={otpRef}
              value={otp}
              onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, OTP_LENGTH))}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              maxLength={OTP_LENGTH}
              style={styles.hiddenInput}
            />

            <PrimaryButton
              label="Verify OTP"
              onPress={handleVerify}
              loading={loading}
              disabled={otp.length !== OTP_LENGTH}
            />

            <View style={styles.linksRow}>
              <Pressable onPress={reset}>
                <Text style={styles.link}>Change number</Text>
              </Pressable>
              <Pressable onPress={handleSendOtp} disabled={timer > 0 || loading}>
                <Text style={[styles.link, timer > 0 && styles.linkDisabled]}>
                  {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
                </Text>
              </Pressable>
            </View>
          </>
        )}

        {step === 'result' && (
          <>
            <Text style={styles.resultIcon}>{verified ? '✅' : '❌'}</Text>
            <Text style={[styles.resultText, { color: verified ? '#15803d' : '#b91c1c' }]}>
              {verified ? 'Verification Successful!' : 'Verification Failed'}
            </Text>
            <Text style={styles.subtitle}>
              {verified
                ? `${fullPhone} has been verified.`
                : 'The code you entered is incorrect. Please try again.'}
            </Text>
            {verified ? (
              <PrimaryButton label="Verify another number" onPress={reset} />
            ) : (
              <>
                <PrimaryButton label="Try again" onPress={tryAgain} />
                <Pressable onPress={reset} style={{ marginTop: 14 }}>
                  <Text style={[styles.link, { textAlign: 'center' }]}>Change number</Text>
                </Pressable>
              </>
            )}
          </>
        )}

        {!!info && step === 'otp' && <Text style={styles.info}>{info}</Text>}
        {!!error && <Text style={styles.error}>{error}</Text>}
      </View>
      <Text style={styles.footer}>SMS OTP powered by {providerName}</Text>
    </KeyboardAvoidingView>
  );
}

function PrimaryButton({ label, onPress, loading, disabled }) {
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        styles.button,
        off && styles.buttonDisabled,
        pressed && !off && styles.buttonPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.buttonText}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  logo: { fontSize: 44, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', color: '#111827' },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
    lineHeight: 21,
  },
  phone: { fontSize: 16, fontWeight: '600', textAlign: 'center', color: '#111827' },
  row: { flexDirection: 'row', gap: 10, marginTop: 20 },
  flex: { flex: 1 },
  input: {
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 17,
    color: '#111827',
  },
  codeInput: { width: 76, textAlign: 'center' },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 22 },
  otpBox: {
    width: 44,
    height: 54,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxActive: { borderColor: '#4f46e5' },
  otpDigit: { fontSize: 22, fontWeight: '700', color: '#111827' },
  hiddenInput: { position: 'absolute', opacity: 0, height: 1, width: 1 },
  button: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 22,
  },
  buttonPressed: { backgroundColor: '#4338ca' },
  buttonDisabled: { backgroundColor: '#a5b4fc' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linksRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  link: { color: '#4f46e5', fontSize: 15, fontWeight: '600' },
  linkDisabled: { color: '#9ca3af' },
  resultIcon: { fontSize: 64, textAlign: 'center', marginTop: 16 },
  resultText: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  info: { color: '#15803d', textAlign: 'center', marginTop: 14, fontSize: 14 },
  error: { color: '#b91c1c', textAlign: 'center', marginTop: 14, fontSize: 14 },
  footer: { textAlign: 'center', color: '#9ca3af', marginTop: 16, fontSize: 12 },
});
