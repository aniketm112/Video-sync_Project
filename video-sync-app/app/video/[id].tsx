import React, { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { getSession, type VideoSession } from '@/lib/db';
import { continueUrl, platformLabel, supportsTimestampRestore } from '@/lib/platforms';
import { formatDateTime, formatDuration } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Brand } from '@/constants/theme';

export default function VideoDetails() {
  const { user, initializing } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<VideoSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    let active = true;
    getSession(user.uid, id)
      .then((s) => {
        if (active) setSession(s);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, id]);

  if (initializing || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Brand.accent} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.center}>
        <Text style={styles.missing}>This video couldn’t be found.</Text>
        <Button label="Go back" variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }

  const open = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      // Ignore — the OS has no handler for the scheme, nothing else to do.
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>{'‹'}</Text>
      </Pressable>

      {session.thumbnail ? (
        <Image source={{ uri: session.thumbnail }} style={styles.thumb} contentFit="cover" />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Text style={styles.thumbIcon}>▶</Text>
        </View>
      )}

      <Text style={styles.title}>{session.title ?? 'Untitled video'}</Text>

      <View style={styles.metaCard}>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Platform</Text>
          <Text style={styles.metaValue}>{platformLabel(session.platform)}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Position</Text>
          <Text style={styles.metaValue}>
            {session.time > 0 ? formatDuration(session.time) : 'Start'}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Saved</Text>
          <Text style={styles.metaValue}>{formatDateTime(session.updatedAt)}</Text>
        </View>
        {session.deviceName && (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Pushed from</Text>
            <Text style={styles.metaValue}>{session.deviceName}</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <Button
          label={session.time > 0 ? `Continue from ${formatDuration(session.time)}` : 'Start watching'}
          onPress={() => open(continueUrl(session.url, session.time))}
        />
        <Button
          label="Open original URL"
          variant="secondary"
          onPress={() => open(session.url)}
        />
        {!supportsTimestampRestore(session.platform) && session.time > 0 && (
          <Text style={styles.note}>
            {platformLabel(session.platform)} sites can’t be opened at a saved
            timestamp, so the video will start from the beginning.
          </Text>
        )}
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
    paddingTop: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    backgroundColor: Brand.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  missing: {
    color: Brand.muted,
    fontSize: 15,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
  },
  backText: {
    color: Brand.text,
    fontSize: 28,
    lineHeight: 32,
  },
  thumb: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: Brand.radius,
    backgroundColor: Brand.surface,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbIcon: {
    color: Brand.faint,
    fontSize: 34,
  },
  title: {
    color: Brand.text,
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 27,
    marginTop: 16,
  },
  metaCard: {
    backgroundColor: Brand.surface,
    borderColor: Brand.border,
    borderWidth: 1,
    borderRadius: Brand.radius,
    marginTop: 16,
    paddingVertical: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  metaLabel: {
    color: Brand.muted,
    fontSize: 13.5,
  },
  metaValue: {
    color: Brand.text,
    fontSize: 13.5,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  actions: {
    marginTop: 20,
    gap: 10,
  },
  note: {
    color: Brand.faint,
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 4,
  },
});
