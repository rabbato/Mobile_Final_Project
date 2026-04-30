import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signIn(email.trim(), password);
    } catch (err: any) {
      const code = err?.code ?? '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1A3A5C" />

      {/* Hero header */}
      <View style={styles.header}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>P</Text>
        </View>
        <Text style={styles.appName}>ParkSpot</Text>
        <Text style={styles.tagline}>Reserve your spot, anytime</Text>
      </View>

      {/* Form card */}
      <View style={styles.card}>
        <Text variant="headlineSmall" style={styles.cardTitle}>Welcome back</Text>
        <Text variant="bodyMedium" style={styles.cardSub}>Sign in to your account</Text>

        <TextInput
          label="Email address"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          autoCapitalize="none"
          keyboardType="email-address"
          left={<TextInput.Icon icon="email-outline" />}
          style={styles.input}
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          secureTextEntry={!showPw}
          left={<TextInput.Icon icon="lock-outline" />}
          right={
            <TextInput.Icon
              icon={showPw ? 'eye-off-outline' : 'eye-outline'}
              onPress={() => setShowPw(v => !v)}
            />
          }
          style={styles.input}
          onSubmitEditing={handleLogin}
        />

        {error ? <HelperText type="error" visible style={styles.error}>{error}</HelperText> : null}

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={styles.primaryBtn}
          contentStyle={styles.btnContent}
        >
          Sign In
        </Button>

        <View style={styles.dividerRow}>
          <View style={styles.line} />
          <Text variant="bodySmall" style={styles.dividerText}>or</Text>
          <View style={styles.line} />
        </View>

        <Button
          mode="outlined"
          onPress={() => navigation.navigate('Register')}
          style={styles.secondaryBtn}
          contentStyle={styles.btnContent}
        >
          Create an Account
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    backgroundColor: '#1A3A5C',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 64,
    paddingBottom: 36,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoText: { fontSize: 38, fontWeight: '900', color: '#fff' },
  appName: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 6 },
  card: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
  },
  cardTitle: { fontWeight: '800', color: '#1A1A2E' },
  cardSub: { opacity: 0.5, marginTop: 4, marginBottom: 24 },
  input: { marginBottom: 12 },
  error: { marginBottom: 4 },
  primaryBtn: { borderRadius: 10, marginTop: 4, backgroundColor: '#1A3A5C' },
  secondaryBtn: { borderRadius: 10, borderColor: '#1A3A5C' },
  btnContent: { paddingVertical: 6 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 18 },
  line: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  dividerText: { marginHorizontal: 12, opacity: 0.45 },
});
