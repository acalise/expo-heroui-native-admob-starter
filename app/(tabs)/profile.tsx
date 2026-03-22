/**
 * app/(tabs)/profile.tsx — Profile Screen Example
 *
 * A polished example of a real-world profile layout using HeroUI Native
 * components. Not app-specific — purely a layout and component demo.
 */

import { ScrollView, View, Text, StyleSheet } from 'react-native';
import {
  Avatar,
  Button,
  Card,
  Chip,
  Separator,
} from 'heroui-native';
import { useTheme } from '@/context/ThemeContext';
import { haptics } from '@/lib/haptics';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ACCENT_COLOR } from '@/constants/theme';

const STATS = [
  { label: 'Posts', value: '128' },
  { label: 'Followers', value: '4.2k' },
  { label: 'Following', value: '312' },
];

const SKILLS = ['Design', 'TypeScript', 'React Native', 'Figma', 'GraphQL'];

const ACHIEVEMENTS = [
  { label: 'Early Adopter', emoji: '🚀', color: '#f59e0b' },
  { label: 'Top Contributor', emoji: '⭐', color: '#3b82f6' },
  { label: 'Bug Hunter', emoji: '🐛', color: '#10b981' },
];

export default function ProfileScreen() {
  const { theme } = useTheme();
  const s = styles(theme);

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="Profile" subtitle="Example profile layout" />

      {/* ── Hero Card ────────────────────────────────────────────────────── */}
      <Card style={s.heroCard}>
        <Card.Body style={s.heroBody}>
          <View>
            <Avatar alt="Alex Rivera" size="lg">
              <Avatar.Image source={{ uri: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }} />
              <Avatar.Fallback>AR</Avatar.Fallback>
            </Avatar>
            <View style={s.proBadge}>
              <Text style={s.proBadgeText}>Pro</Text>
            </View>
          </View>

          <Text style={s.name}>Alex Rivera</Text>
          <Text style={s.handle}>@alex_rivera · San Francisco, CA</Text>
          <Text style={s.bio}>
            Product designer & open-source enthusiast. Building things that
            matter with great teams.
          </Text>

          <View style={s.statsRow}>
            {STATS.map((stat, i) => (
              <View key={stat.label} style={s.stat}>
                <Text style={s.statValue}>{stat.value}</Text>
                <Text style={s.statLabel}>{stat.label}</Text>
                {i < STATS.length - 1 && (
                  <View style={s.statDivider} />
                )}
              </View>
            ))}
          </View>

          <View style={s.buttonRow}>
            <Button
              variant="primary"
              style={{ flex: 1 }}
              onPress={() => haptics.medium()}
            >
              Follow
            </Button>
            <Button
              variant="outline"
              style={{ flex: 1 }}
              onPress={() => haptics.light()}
            >
              Message
            </Button>
          </View>
        </Card.Body>
      </Card>

      {/* ── Skills ───────────────────────────────────────────────────────── */}
      <Text style={s.sectionTitle}>Skills</Text>
      <Card style={s.card}>
        <Card.Body>
          <View style={s.chipRow}>
            {SKILLS.map((skill) => (
              <Chip key={skill} variant="soft">
                {skill}
              </Chip>
            ))}
          </View>
        </Card.Body>
      </Card>

      {/* ── Achievements ─────────────────────────────────────────────────── */}
      <Text style={s.sectionTitle}>Achievements</Text>
      <Card style={s.card}>
        <Card.Body style={{ gap: 12 }}>
          {ACHIEVEMENTS.map((item) => (
            <View key={item.label} style={s.achievementRow}>
              <View
                style={[
                  s.achievementIcon,
                  { backgroundColor: `${item.color}22` },
                ]}
              >
                <Text style={s.achievementEmoji}>{item.emoji}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.achievementLabel}>{item.label}</Text>
                <Text style={s.achievementDesc}>
                  Earned for outstanding contributions
                </Text>
              </View>
            </View>
          ))}
        </Card.Body>
      </Card>

      {/* ── Activity ─────────────────────────────────────────────────────── */}
      <Text style={s.sectionTitle}>Activity</Text>
      <Card style={[s.card, { marginBottom: 32 }]}>
        <Card.Body style={{ gap: 14 }}>
          {[
            { label: 'Profile Completion', value: 85 },
            { label: 'Contributions', value: 62 },
            { label: 'Engagement', value: 91 },
          ].map((item) => (
            <View key={item.label}>
              <View style={s.progressHeader}>
                <Text style={s.progressLabel}>{item.label}</Text>
                <Text style={s.progressValue}>{item.value}%</Text>
              </View>
              <View style={s.progressTrack}>
                <View
                  style={[
                    s.progressFill,
                    { width: `${item.value}%`, backgroundColor: theme.accent },
                  ]}
                />
              </View>
            </View>
          ))}
        </Card.Body>
      </Card>
    </ScrollView>
  );
}

function styles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: theme.background },
    content: { paddingHorizontal: 16, paddingBottom: 40 },

    heroCard: {
      backgroundColor: theme.backgroundElevated,
      borderRadius: 20,
      marginBottom: 16,
      borderColor: theme.border,
    },
    heroBody: { alignItems: 'center', paddingVertical: 24, gap: 8 },
    name: { fontSize: 22, fontWeight: '700', color: theme.textPrimary, marginTop: 8 },
    handle: { fontSize: 13, color: theme.textSecondary },
    bio: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      paddingHorizontal: 16,
    },
    proBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      backgroundColor: theme.accent,
      borderRadius: 8,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    proBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#ffffff',
    },

    statsRow: { flexDirection: 'row', marginTop: 8, gap: 24 },
    stat: { alignItems: 'center', position: 'relative' },
    statValue: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
    statLabel: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
    statDivider: {
      position: 'absolute',
      right: -12,
      top: '10%',
      height: '80%',
      width: 1,
      backgroundColor: theme.border,
    },

    buttonRow: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 4 },

    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: 10,
      marginTop: 4,
    },
    card: {
      backgroundColor: theme.backgroundElevated,
      borderRadius: 16,
      marginBottom: 16,
      borderColor: theme.border,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

    achievementRow: { flexDirection: 'row', alignItems: 'center' },
    achievementIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    achievementEmoji: { fontSize: 22 },
    achievementLabel: { fontSize: 14, fontWeight: '600', color: theme.textPrimary },
    achievementDesc: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },

    progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
    progressLabel: { fontSize: 13, fontWeight: '500', color: theme.textPrimary },
    progressValue: { fontSize: 13, color: theme.textSecondary },
    progressTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.border,
      overflow: 'hidden',
      marginTop: 6,
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
  });
}
