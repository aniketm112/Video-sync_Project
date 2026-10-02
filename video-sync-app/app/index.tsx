import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Brand } from '@/constants/theme';

/**
 * Landing screen. Greets signed-out users, sends signed-in users to Home, and
 * explains what to configure when Firebase env vars are missing.
 */
export default function Welcome() {
  const { configured } = useAuth();
  const router = useRouter();

  if (!configured) {
    return (
      <View style={[styles.center, styles.pad]}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Almost there</Text>
          <Text style={styles.cardBody}>
            Video Sync needs its Firebase configuration before it can run.
          </Text>
          <Text style={styles.cardBody}>
            Copy{' '}
            <Text style={styles.mono}>video-sync-app/.env.example</Text> to{' '}
            <Text style={styles.mono}>.env</Text>, paste the values from your
            Firebase console (Project settings → Your apps → Web app), then
            reload this app.
          </Text>
          <Text style={styles.cardBody}>
            Full instructions are in the project README.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.logoWrap}>
          <Text style={styles.logo}>▶</Text>
        </View>
        <Text style={styles.title}>Continue watching.{'\n'}Anywhere.</Text>
        <Text style={styles.subtitle}>
          Push whatever you’re watching — with your exact position — from your
          browser, and pick it up on any other device in one tap.
        </Text>
      </View>

      <View style={styles.steps}>
        {[
          ['1', 'Push', 'Click PUSH VIDEO in the Chrome extension while watching.'],
          ['2', 'Sync', 'Your video and timestamp sync to your account instantly.'],
          ['3', 'Resume', 'Open Video Sync anywhere and continue where you left off.'],
        ].map(([step, heading, body]) => (
          <View key={step} style={styles.step}>
            <Text style={styles.stepNumber}>{step}</Text>
            <View style={styles.stepTextWrap}>
              <Text style={styles.stepHeading}>{heading}</Text>
              <Text style={styles.stepBody}>{body}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button
          label="Create account"
          style={styles.actionButton}
          onPress={() => router.push('/signup')}
        />
      </View>
      <View style={[styles.actions, styles.actionsBottom]}>
        <Button
          label="I already have an account"
          variant="secondary"
          style={styles.actionButton}
          onPress={() => router.push('/login')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.bg,
    paddingHorizontal: 24,
    paddingTop: 72,
  },
  center: {
    flex: 1,
    backgroundColor: Brand.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pad: {
    padding: 24,
  },
  card: {
    backgroundColor: Brand.surface,
    borderColor: Brand.border,
    borderWidth: 1,
    borderRadius: Brand.radius,
    padding: 20,
    gap: 10,
  },
  cardTitle: {
    color: Brand.text,
    fontSize: 18,
    fontWeight: '700',
  },
  cardBody: {
    color: Brand.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  mono: {
    fontFamily: 'monospace',
    color: Brand.accent,
  },
  hero: {
    alignItems: 'center',
    gap: 14,
  },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: Brand.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    color: '#06283B',
    fontSize: 28,
    marginLeft: 4,
  },
  title: {
    color: Brand.text,
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 36,
  },
  subtitle: {
    color: Brand.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  steps: {
    marginTop: 36,
    gap: 18,
  },
  step: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  stepNumber: {
    color: Brand.accent,
    fontSize: 14,
    fontWeight: '800',
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.surface,
    textAlign: 'center',
    textAlignVertical: 'center',
    overflow: 'hidden',
  },
  stepTextWrap: {
    flex: 1,
    gap: 2,
  },
  stepHeading: {
    color: Brand.text,
    fontSize: 15,
    fontWeight: '700',
  },
  stepBody: {
    color: Brand.muted,
    fontSize: 13.5,
    lineHeight: 19,
  },
  actions: {
    marginTop: 'auto',
    gap: 10,
    paddingBottom: 8,
  },
  actionsBottom: {
    marginTop: 0,
    paddingBottom: 36,
  },
  actionButton: {
    width: '100%',
  },
});
