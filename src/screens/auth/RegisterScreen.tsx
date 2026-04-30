import React, { useState } from 'react';
import {
  View, StyleSheet, KeyboardAvoidingView, Platform,
  TouchableOpacity, ScrollView, StatusBar,
} from 'react-native';
import { TextInput, Button, Text, HelperText, Icon } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';

export const RegisterScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const { signUp } = useAuth();

  const handleRegister = async () => {
    if (!email.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signUp(email.trim(), password, role);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const RoleCard = ({
    type, icon, title, description,
  }: { type: 'user' | 'admin'; icon: string; title: string; description: string }) => {
    const selected = role === type;
    return (
      <TouchableOpacity
        style={[styles.roleCard, selected && styles.roleCardActive]}
        onPress={() => setRole(type)}
        activeOpacity={0.8}
      >
        <View style={[styles.roleIconWrap, selected && styles.roleIconWrapActive]}>
          <Icon source={icon} size={28} color={selected ? '#fff' : '#2A6B9C'} />
        </View>
        <Text style={[styles.roleTitle, selected && styles.roleTitleActive]}>{title}</Text>
        <Text style={styles.roleDesc}>{description}</Text>
        {selected && (
          <View style={styles.checkBadge}>
            <Icon source="check" size={12} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1A3A5C" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>P</Text>
        </View>
        <Text style={styles.appName}>Join ParkSpot</Text>
        <Text style={styles.tagline}>Create your free account</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text variant="titleSmall" style={styles.sectionLabel}>I want to…</Text>
        <View style={styles.roleRow}>
          <RoleCard type="user" icon="car" title="Find Parking" description="Reserve spots near me" />
          <RoleCard type="admin" icon="parking" title="List My Spot" description="Earn from my space" />
        </View>

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
        />
        <TextInput
          label="Confirm password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          mode="outlined"
          secureTextEntry={!showPw}
          left={<TextInput.Icon icon="lock-check-outline" />}
          style={styles.input}
        />

        {error ? <HelperText type="error" visible>{error}</HelperText> : null}

        <Button
          mode="contained"
          onPress={handleRegister}
          loading={loading}
          disabled={loading}
          style={styles.primaryBtn}
          contentStyle={styles.btnContent}
        >
          Create Account
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.navigate('Login')}
          style={{ marginTop: 8 }}
        >
          Already have an account? Sign In
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    backgroundColor: '#1A3A5C',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 52,
    paddingBottom: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoText: { fontSize: 30, fontWeight: '900', color: '#fff' },
  appName: { fontSize: 22, fontWeight: '800', color: '#fff' },
  tagline: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  scroll: { flex: 1 },
  form: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  sectionLabel: { fontWeight: '700', color: '#555', marginBottom: 10 },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  roleCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  roleCardActive: { borderColor: '#2A6B9C', backgroundColor: '#EBF4FB' },
  roleIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EBF4FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  roleIconWrapActive: { backgroundColor: '#2A6B9C' },
  roleTitle: { fontWeight: '700', color: '#333', fontSize: 14 },
  roleTitleActive: { color: '#2A6B9C' },
  roleDesc: { fontSize: 11, opacity: 0.5, textAlign: 'center', marginTop: 3 },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2A6B9C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: { marginBottom: 12 },
  primaryBtn: { borderRadius: 10, marginTop: 4, backgroundColor: '#1A3A5C' },
  btnContent: { paddingVertical: 6 },
});
