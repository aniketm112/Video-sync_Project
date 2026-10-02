import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, friendlyAuthError } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Brand } from '@/constants/theme';

export default function SignUp() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const name = username.trim();
    if (name.length < 2) {
      setError('Your name should be at least 2 characters.');
      return;
    }
    if (!email.trim()) {
      setError('Enter an email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords don’t match.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await signUp(name, email, password);
      router.replace('/(tabs)');
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
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

        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>
          One account syncs every pushed video across all your devices.
        </Text>

        <View style={styles.form}>
          <Field
            label="Name"
            placeholder="How should we greet you?"
            autoCapitalize="words"
            autoComplete="name"
            value={username}
            onChangeText={setUsername}
          />
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
            placeholder="At least 8 characters"
            secureTextEntry
            autoComplete="new-password"
            value={password}
            onChangeText={setPassword}
          />
          <Field
            label="Confirm password"
            placeholder="Repeat your password"
            secureTextEntry
            autoComplete="new-password"
            value={confirm}
            onChangeText={setConfirm}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Button
            label="Sign up"
            loading={busy}
            style={styles.submit}
            onPress={submit}
          />
        </View>

        <View style={styles.switchWrap}>
          <Text style={styles.switchText}>Already have an account? </Text>
          <Pressable onPress={() => router.push('/login')}>
            <Text style={styles.switchLink}>Log in</Text>
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
