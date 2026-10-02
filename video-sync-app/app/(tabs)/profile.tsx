import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { subscribeDevices, type DeviceEntry } from '@/lib/db';
import { formatMonthYear, timeAgo } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Brand } from '@/constants/theme';

export default function Profile() {
  const { user, profile, initializing, signOut } = useAuth();
  const [devices, setDevices] = useState<Record<string, DeviceEntry>>({});
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!user) return;
    return subscribeDevices(user.uid, setDevices);
  }, [user]);

  if (initializing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Brand.accent} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/" />;
  }

  const deviceList = Object.entries(devices)
    .map(([id, d]) => ({ id, ...d }))
    .sort((a, b) => b.lastSeen - a.lastSeen);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.accountCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(profile?.username ?? user.email ?? 'V').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.accountMeta}>
          <Text style={styles.username}>{profile?.username ?? 'Viewer'}</Text>
          <Text style={styles.email}>{user.email}</Text>
          {profile?.createdAt ? (
            <Text style={styles.memberSince}>
              Member since {formatMonthYear(profile.createdAt)}
            </Text>
          ) : null}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Devices</Text>
      <Text style={styles.sectionHint}>
        Devices signed into your account that have pushed or received videos.
      </Text>
      <View style={styles.deviceList}>
        {deviceList.map((d) => (
          <View key={d.id} style={styles.deviceRow}>
            <View style={styles.deviceIcon}>
              <Text style={styles.deviceIconText}>📱</Text>
            </View>
            <View style={styles.deviceMeta}>
              <Text style={styles.deviceName}>{d.name}</Text>
              <Text style={styles.deviceLast}>Active {timeAgo(d.lastSeen)}</Text>
            </View>
          </View>
        ))}
        {deviceList.length === 0 && (
          <Text style={styles.empty}>No devices registered yet.</Text>
        )}
      </View>

      <View style={styles.footer}>
        <Button
          label={signingOut ? 'Signing out…' : 'Sign out'}
          variant="danger"
          onPress={handleSignOut}
        />
        <Text style={styles.privacyNote}>
          Your videos and timestamps are private to your account and protected
          by Firebase security rules.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  content: {
    padding: 20,
    paddingTop: 64,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    backgroundColor: Brand.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: Brand.text,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Brand.surface,
    borderColor: Brand.border,
    borderWidth: 1,
    borderRadius: Brand.radius,
    padding: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Brand.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#06283B',
    fontSize: 24,
    fontWeight: '800',
  },
  accountMeta: {
    flex: 1,
    gap: 2,
  },
  username: {
    color: Brand.text,
    fontSize: 17,
    fontWeight: '700',
  },
  email: {
    color: Brand.muted,
    fontSize: 13.5,
  },
  memberSince: {
    color: Brand.faint,
    fontSize: 12.5,
    marginTop: 2,
  },
  sectionTitle: {
    color: Brand.text,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 28,
    marginBottom: 4,
  },
  sectionHint: {
    color: Brand.faint,
    fontSize: 12.5,
    marginBottom: 12,
  },
  deviceList: {
    gap: 8,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Brand.surface,
    borderColor: Brand.border,
    borderWidth: 1,
    borderRadius: Brand.radius,
    padding: 12,
  },
  deviceIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Brand.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceIconText: {
    fontSize: 16,
  },
  deviceMeta: {
    flex: 1,
  },
  deviceName: {
    color: Brand.text,
    fontSize: 14.5,
    fontWeight: '600',
  },
  deviceLast: {
    color: Brand.muted,
    fontSize: 12,
    marginTop: 1,
  },
  empty: {
    color: Brand.faint,
    fontSize: 13.5,
  },
  footer: {
    marginTop: 32,
    gap: 14,
  },
  privacyNote: {
    color: Brand.faint,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
  },
});
