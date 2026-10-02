import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, friendlyAuthError } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Brand } from '@/constants/theme';

export default function Login() {
  const { signIn, resetPassword } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    if (!email.trim()) {
      setError('Enter your email first, then tap “Forgot password”.');
      return;
    }
    try {
      await resetPassword(email);
      Alert.alert('Check your inbox', 'We sent you a password reset link.');
    } catch (err) {
      setError(friendlyAuthError(err));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>{'‹'}</Text>
        </Pressable>

        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Log in to continue watching across devices.</Text>

        <View style={styles.form}>
          <Field
            label="Email"
            placeholder="you@example.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Field
            label="Password"
            placeholder="Your password"
            secureTextEntry
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Button
            label="Log in"
            loading={busy}
            style={styles.submit}
            onPress={submit}
          />
          <Button label="Forgot password?" variant="ghost" onPress={forgot} />
        </View>

        <View style={styles.switchWrap}>
          <Text style={styles.switchText}>New to Video Sync? </Text>
          <Pressable onPress={() => router.push('/signup')}>
            <Text style={styles.switchLink}>Create an account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  scroll: {
    padding: 24,
    paddingTop: 24,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
    marginBottom: 8,
  },
  backText: {
    color: Brand.text,
    fontSize: 28,
    lineHeight: 32,
  },
  title: {
    color: Brand.text,
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: Brand.muted,
    fontSize: 14.5,
    marginTop: 6,
  },
  form: {
    marginTop: 28,
  },
  error: {
    color: Brand.danger,
    fontSize: 13.5,
    marginBottom: 12,
    lineHeight: 19,
  },
  submit: {
    marginTop: 6,
  },
  switchWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  switchText: {
    color: Brand.muted,
    fontSize: 14,
  },
  switchLink: {
    color: Brand.accent,
    fontSize: 14,
    fontWeight: '700',
  },
});
