/**
 * app/(tabs)/profile.tsx: a realistic screen, not a component dump.
 *
 * The showcase tab proves each component works in isolation. This one shows
 * them composed into the kind of layout you'd actually ship: a header block,
 * a stat row, a gated feature, and a list. Copy the structure, replace the data.
 *
 * It also demonstrates the pattern you'll use most in a freemium app,
 * `useSubscription()` to gate a section, with a paywall route as the fallback.
 */

import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar, Button, Card, Chip, Separator, Surface } from 'heroui-native';

import { AppText } from '@/components/AppText';
import { ChevronRightIcon, SparkleIcon } from '@/components/Icons';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionLabel } from '@/components/SectionLabel';
import { haptics } from '@/lib/haptics';
import { useSubscription } from '@/lib/subscription';

const STATS = [
  { label: 'Sessions', value: '128' },
  { label: 'Day streak', value: '14' },
  { label: 'Saved', value: '312' },
];

const TAGS = ['Design', 'TypeScript', 'React Native', 'Figma'];

const ACTIVITY = [
  { title: 'Completed a session', detail: '2 hours ago' },
  { title: 'Hit a 14-day streak', detail: 'Yesterday' },
  { title: 'Updated preferences', detail: '3 days ago' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { isPro } = useSubscription();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-4 pb-10"
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="Profile" subtitle="An example of a composed layout" />

      {/* ── Identity ────────────────────────────────────────────────────── */}
      <Card>
        <Card.Body className="items-center gap-3 py-6">
          <Avatar alt="Alex Rivera" size="lg">
            <Avatar.Image source={{ uri: 'https://i.pravatar.cc/150?u=heroui-starter' }} />
            <Avatar.Fallback>AR</Avatar.Fallback>
          </Avatar>

          <View className="items-center gap-1">
            <View className="flex-row items-center gap-2">
              <AppText className="text-xl font-bold text-foreground">Alex Rivera</AppText>
              {isPro && (
                <Chip size="sm">
                  <Chip.Label>Pro</Chip.Label>
                </Chip>
              )}
            </View>
            <AppText className="text-sm text-muted">alex@example.com</AppText>
          </View>

          <View className="flex-row flex-wrap justify-center gap-2 pt-1">
            {TAGS.map((tag) => (
              <Chip key={tag} size="sm" variant="tertiary">
                <Chip.Label>{tag}</Chip.Label>
              </Chip>
            ))}
          </View>
        </Card.Body>
      </Card>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <View className="flex-row gap-3 pt-3">
        {STATS.map((stat) => (
          <Surface key={stat.label} variant="secondary" className="flex-1 items-center gap-1 p-4">
            <AppText className="text-2xl font-bold text-foreground">{stat.value}</AppText>
            <AppText className="text-xs text-muted">{stat.label}</AppText>
          </Surface>
        ))}
      </View>

      {/* ── A gated feature ─────────────────────────────────────────────── */}
      <SectionLabel>Insights</SectionLabel>
      {isPro ? (
        <Card>
          <Card.Body className="gap-2">
            <View className="flex-row items-center gap-2">
              <SparkleIcon className="text-accent" size={18} />
              <AppText className="text-base font-semibold text-foreground">
                Your week at a glance
              </AppText>
            </View>
            <AppText className="text-sm leading-5 text-muted">
              This block is what a subscriber sees. Gate real features the same way: read `isPro`
              and branch, never check a product identifier.
            </AppText>
          </Card.Body>
        </Card>
      ) : (
        /* The upsell a free user sees. Show the feature's *shape*, not a wall,
           people convert on something they can already picture using. */
        <Card>
          <Card.Body className="gap-3">
            <View className="flex-row items-center gap-2">
              <SparkleIcon className="text-muted" size={18} />
              <AppText className="text-base font-semibold text-foreground">Weekly insights</AppText>
            </View>
            <AppText className="text-sm leading-5 text-muted">
              See patterns across your sessions, week over week. Available on Pro.
            </AppText>
            <Button
              size="sm"
              onPress={() => {
                haptics.medium();
                router.push('/paywall');
              }}
            >
              <Button.Label>Unlock insights</Button.Label>
            </Button>
          </Card.Body>
        </Card>
      )}

      {/* ── Activity ────────────────────────────────────────────────────── */}
      <SectionLabel>Recent activity</SectionLabel>
      <Card>
        <Card.Body className="gap-0 py-1">
          {ACTIVITY.map((item, index) => (
            <View key={item.title}>
              <Pressable
                onPress={() => haptics.light()}
                className="flex-row items-center gap-3 py-3"
              >
                <View className="flex-1">
                  <AppText className="text-base text-foreground">{item.title}</AppText>
                  <AppText className="text-sm text-muted">{item.detail}</AppText>
                </View>
                <ChevronRightIcon className="text-muted" size={18} />
              </Pressable>
              {index < ACTIVITY.length - 1 && <Separator />}
            </View>
          ))}
        </Card.Body>
      </Card>
    </ScrollView>
  );
}
