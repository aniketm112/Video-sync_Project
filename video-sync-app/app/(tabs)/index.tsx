import React, { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { subscribeHistory, subscribeLatest, type VideoSession } from '@/lib/db';
import { continueUrl, platformLabel, supportsTimestampRestore } from '@/lib/platforms';
import { formatDuration, timeAgo } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { VideoCard } from '@/components/video-card';
import { Brand } from '@/constants/theme';

export default function Home() {
  const { user, profile, initializing } = useAuth();
  const router = useRouter();
  const [latest, setLatest] = useState<VideoSession | null>(null);
  const [history, setHistory] = useState<VideoSession[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Realtime subscriptions — pushed videos appear here without any refresh.
    const unsubLatest = subscribeLatest(user.uid, (s) => {
      setLatest(s);
      setLoaded(true);
    });
    const unsubHistory = subscribeHistory(user.uid, setHistory);
    return () => {
      unsubLatest();
      unsubHistory();
    };
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

  const firstName = profile?.username?.split(' ')[0] ?? 'there';

  const openContinue = async (session: VideoSession) => {
    const url = continueUrl(session.url, session.time);
    try {
      await Linking.openURL(url);
    } catch {
      // Nothing can open this URL (shouldn't happen for https) — surface it.
      Linking.openURL(session.url);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.hello}>Hey {firstName}</Text>
          <Text style={styles.tagline}>Pick up where you left off</Text>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live</Text>
        </View>
      </View>

      {loaded && latest && (
        <View style={styles.heroCard}>
          {latest.thumbnail ? (
            <Image source={{ uri: latest.thumbnail }} style={styles.heroThumb} contentFit="cover" />
          ) : (
            <View style={[styles.heroThumb, styles.heroThumbPlaceholder]}>
              <Text style={styles.heroThumbIcon}>▶</Text>
            </View>
          )}
          <View style={styles.heroBody}>
            <Text style={styles.heroLabel}>Continue watching</Text>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {latest.title ?? 'Untitled video'}
            </Text>
            <Text style={styles.heroMeta}>
              {platformLabel(latest.platform)}
              {latest.time > 0 ? ` · Continue from ${formatDuration(latest.time)}` : ' · From the start'}
              {' · '}
              {timeAgo(latest.updatedAt)}
            </Text>
            <Button
              label="Continue Watching"
              style={styles.heroButton}
              onPress={() => openContinue(latest)}
            />
            {!supportsTimestampRestore(latest.platform) && latest.time > 0 && (
              <Text style={styles.heroNote}>
                This site doesn’t support opening at a timestamp — the video
                opens from the start.
              </Text>
            )}
          </View>
        </View>
      )}

      {loaded && !latest && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Nothing pushed yet</Text>
          <Text style={styles.emptyBody}>
            Install the Video Sync Chrome extension, open any video, and hit
            <Text style={styles.emptyStrong}> PUSH VIDEO</Text>. It will appear
            here instantly — on every device signed into your account.
          </Text>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent</Text>
        <Text style={styles.sectionCount}>{history.length}</Text>
      </View>

      <View style={styles.list}>
        {history.map((session) => (
          <VideoCard
            key={session.id ?? session.url}
            session={session}
            onPress={() => router.push(`/video/${session.id}`)}
          />
        ))}
        {loaded && history.length === 0 && (
          <Text style={styles.listEmpty}>Your pushed videos will show up here.</Text>
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
    paddingTop: 64,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    backgroundColor: Brand.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  hello: {
    color: Brand.text,
    fontSize: 24,
    fontWeight: '800',
  },
  tagline: {
    color: Brand.muted,
    fontSize: 13.5,
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Brand.surface,
    borderColor: Brand.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Brand.success,
  },
  liveText: {
    color: Brand.muted,
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  heroCard: {
    backgroundColor: Brand.surface,
    borderColor: Brand.border,
    borderWidth: 1,
    borderRadius: Brand.radius,
    overflow: 'hidden',
    marginBottom: 28,
  },
  heroThumb: {
    width: '100%',
    aspectRatio: 16 / 8,
    backgroundColor: Brand.surfaceRaised,
  },
  heroThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroThumbIcon: {
    color: Brand.faint,
    fontSize: 34,
  },
  heroBody: {
    padding: 16,
    gap: 6,
  },
  heroLabel: {
    color: Brand.accent,
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: Brand.text,
    fontSize: 19,
    fontWeight: '700',
    lineHeight: 25,
  },
  heroMeta: {
    color: Brand.muted,
    fontSize: 13,
  },
  heroButton: {
    marginTop: 10,
  },
  heroNote: {
    color: Brand.faint,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: Brand.surface,
    borderColor: Brand.border,
    borderWidth: 1,
    borderRadius: Brand.radius,
    padding: 20,
    marginBottom: 28,
    gap: 8,
  },
  emptyTitle: {
    color: Brand.text,
    fontSize: 17,
    fontWeight: '700',
  },
  emptyBody: {
    color: Brand.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  emptyStrong: {
    color: Brand.text,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    color: Brand.text,
    fontSize: 17,
    fontWeight: '700',
  },
  sectionCount: {
    color: Brand.faint,
    fontSize: 12.5,
    fontWeight: '700',
    backgroundColor: Brand.surface,
    borderColor: Brand.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  list: {
    gap: 10,
  },
  listEmpty: {
    color: Brand.faint,
    fontSize: 13.5,
  },
});
