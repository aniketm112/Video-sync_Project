import React from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/theme';
import { formatDuration, timeAgo } from '@/lib/format';
import { platformLabel } from '@/lib/platforms';
import type { VideoSession } from '@/lib/db';

type VideoCardProps = {
  session: VideoSession;
  onPress?: () => void;
  compact?: boolean;
};

export function VideoCard({ session, onPress, compact = false }: VideoCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.card, compact && styles.cardCompact, pressed && styles.pressed]}>
      <View style={styles.thumbWrap}>
        {session.thumbnail ? (
          <Image source={{ uri: session.thumbnail }} style={styles.thumb} contentFit="cover" />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Text style={styles.thumbPlaceholderIcon}>▶</Text>
          </View>
        )}
        {session.time > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{formatDuration(session.time)}</Text>
          </View>
        )}
      </View>
      <View style={styles.meta}>
        <Text style={styles.title} numberOfLines={2}>
          {session.title ?? 'Untitled video'}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {platformLabel(session.platform)} · {session.time > 0 ? `at ${formatDuration(session.time)}` : 'from the start'} · {timeAgo(session.updatedAt)}
        </Text>
      </View>
    </Pressable>
  );
}

const THUMB_WIDTH = 132;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Brand.surface,
    borderColor: Brand.border,
    borderWidth: 1,
    borderRadius: Brand.radius,
    padding: 10,
    gap: 12,
  },
  cardCompact: {
    padding: 8,
  },
  pressed: {
    opacity: 0.85,
  },
  thumbWrap: {
    width: THUMB_WIDTH,
    height: 76,
    borderRadius: Brand.radiusSm,
    overflow: 'hidden',
    backgroundColor: Brand.surfaceRaised,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbPlaceholderIcon: {
    color: Brand.faint,
    fontSize: 22,
  },
  badge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  meta: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  title: {
    color: Brand.text,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  sub: {
    color: Brand.muted,
    fontSize: 12.5,
  },
});
