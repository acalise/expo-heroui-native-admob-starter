/**
 * app/(tabs)/index.tsx: HeroUI Native component showcase.
 *
 * A live reference for the components you'll reach for most, and the place to
 * check what a variant looks like in both color schemes without leaving the
 * app. Delete this screen once you know the library, nothing depends on it.
 *
 * Note the styling: `className`, not StyleSheet. The classes resolve against
 * the CSS variables in theme.css, which is what makes both color schemes work
 * with no conditional logic anywhere in this file.
 */

import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Chip,
  ControlField,
  Description,
  FieldError,
  Input,
  Label,
  Separator,
  Skeleton,
  Spinner,
  Surface,
  TextField,
} from 'heroui-native';

import { AppText } from '@/components/AppText';
import { BannerAd } from '@/components/BannerAd';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionLabel } from '@/components/SectionLabel';
import { haptics } from '@/lib/haptics';

export default function ComponentsScreen() {
  const [email, setEmail] = useState('');
  const [notifications, setNotifications] = useState(false);
  const [loading, setLoading] = useState(false);

  function simulateWork() {
    haptics.medium();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      haptics.success();
    }, 1600);
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-4 pb-10"
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="Components" subtitle="HeroUI Native, themed by theme.css" />

      {/* ── Buttons ─────────────────────────────────────────────────────── */}
      <SectionLabel>Buttons</SectionLabel>
      <Card>
        <Card.Body className="gap-3">
          <View className="flex-row gap-2">
            <Button className="flex-1" onPress={() => haptics.medium()}>
              <Button.Label>Primary</Button.Label>
            </Button>
            <Button variant="secondary" className="flex-1" onPress={() => haptics.light()}>
              <Button.Label>Secondary</Button.Label>
            </Button>
          </View>
          <View className="flex-row gap-2">
            <Button variant="tertiary" className="flex-1" onPress={() => haptics.light()}>
              <Button.Label>Tertiary</Button.Label>
            </Button>
            <Button variant="ghost" className="flex-1" onPress={() => haptics.light()}>
              <Button.Label>Ghost</Button.Label>
            </Button>
          </View>
          <View className="flex-row gap-2">
            <Button size="sm" onPress={() => haptics.light()}>
              <Button.Label>Small</Button.Label>
            </Button>
            <Button size="sm" variant="danger" onPress={() => haptics.error()}>
              <Button.Label>Danger</Button.Label>
            </Button>
            <Button size="sm" variant="ghost" isDisabled>
              <Button.Label>Disabled</Button.Label>
            </Button>
          </View>
          <Button isDisabled={loading} onPress={simulateWork}>
            <Button.Label>{loading ? 'Working…' : 'Press to load'}</Button.Label>
          </Button>
        </Card.Body>
      </Card>

      {/* ── Form fields ─────────────────────────────────────────────────── */}
      <SectionLabel>Form fields</SectionLabel>
      <Card>
        <Card.Body className="gap-4">
          <TextField isRequired>
            <Label>Email</Label>
            <Input
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Description>We&apos;ll never share this.</Description>
          </TextField>

          <TextField isInvalid={email.length > 0 && !email.includes('@')}>
            <Label>Validated field</Label>
            <Input placeholder="Type without an @ to see the error state" />
            <FieldError>That doesn&apos;t look like an email.</FieldError>
          </TextField>

          <ControlField isSelected={notifications} onSelectedChange={setNotifications}>
            <View className="flex-1">
              <Label>
                <Label.Text>Notifications</Label.Text>
              </Label>
              <Description>ControlField wires the whole row to the switch.</Description>
            </View>
            {/* Indicator renders the Switch and wires it to the field, so the
                whole row is tappable, not just the 50pt switch itself. */}
            <ControlField.Indicator />
          </ControlField>
        </Card.Body>
      </Card>

      {/* ── Feedback ────────────────────────────────────────────────────── */}
      <SectionLabel>Feedback</SectionLabel>
      <View className="gap-3">
        <Alert status="accent">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Heads up</Alert.Title>
            <Alert.Description>
              Alerts come in accent, success, warning and danger.
            </Alert.Description>
          </Alert.Content>
        </Alert>
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Something went wrong</Alert.Title>
            <Alert.Description>Colors come from --danger in theme.css.</Alert.Description>
          </Alert.Content>
        </Alert>
      </View>

      {/* ── Surfaces & cards ────────────────────────────────────────────── */}
      <SectionLabel>Surfaces</SectionLabel>
      <Card>
        <Card.Header>
          <Card.Title>Card</Card.Title>
        </Card.Header>
        <Card.Body>
          <Card.Description>
            Cards group related content. Surfaces are the same idea without the slots, use whichever
            reads better.
          </Card.Description>
        </Card.Body>
        <Card.Footer className="flex-row gap-2">
          <Button size="sm" variant="ghost">
            <Button.Label>Dismiss</Button.Label>
          </Button>
          <Button size="sm">
            <Button.Label>Confirm</Button.Label>
          </Button>
        </Card.Footer>
      </Card>

      <View className="flex-row gap-3 pt-3">
        <Surface className="flex-1 gap-1 p-4">
          <AppText className="text-sm font-semibold text-foreground">Default</AppText>
          <AppText className="text-xs text-muted">--surface</AppText>
        </Surface>
        <Surface variant="secondary" className="flex-1 gap-1 p-4">
          <AppText className="text-sm font-semibold text-foreground">Secondary</AppText>
          <AppText className="text-xs text-muted">--surface-secondary</AppText>
        </Surface>
      </View>

      {/* ── People & tags ───────────────────────────────────────────────── */}
      <SectionLabel>People &amp; tags</SectionLabel>
      <Card>
        <Card.Body className="gap-4">
          <View className="flex-row items-center gap-3">
            <Avatar alt="Alice Johnson">
              <Avatar.Fallback>AJ</Avatar.Fallback>
            </Avatar>
            <View className="flex-1">
              <AppText className="text-base font-semibold text-foreground">Alice Johnson</AppText>
              <AppText className="text-sm text-muted">Product Designer</AppText>
            </View>
            <Chip size="sm">
              <Chip.Label>New</Chip.Label>
            </Chip>
          </View>

          <Separator />

          <View className="flex-row flex-wrap items-center gap-2">
            <Chip>
              <Chip.Label>Default</Chip.Label>
            </Chip>
            <Chip variant="secondary">
              <Chip.Label>Secondary</Chip.Label>
            </Chip>
            <Chip variant="tertiary">
              <Chip.Label>Tertiary</Chip.Label>
            </Chip>
          </View>

          <View className="flex-row items-center gap-3">
            <Avatar alt="Small" size="sm">
              <Avatar.Fallback>SM</Avatar.Fallback>
            </Avatar>
            <Avatar alt="Medium" size="md">
              <Avatar.Fallback>MD</Avatar.Fallback>
            </Avatar>
            <Avatar alt="Large" size="lg">
              <Avatar.Fallback>LG</Avatar.Fallback>
            </Avatar>
          </View>
        </Card.Body>
      </Card>

      {/* ── Loading ─────────────────────────────────────────────────────── */}
      <SectionLabel>Loading</SectionLabel>
      <Card>
        <Card.Body className="gap-4">
          <View className="flex-row items-center gap-4">
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
          </View>
          <Separator />
          {/* Skeletons beat spinners for content that has a known shape: the
              layout doesn't jump when the real data lands. */}
          <View className="gap-2">
            <Skeleton className="h-4 w-2/3 rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-1/2 rounded-md" />
          </View>
        </Card.Body>
      </Card>

      {/* Collapses to nothing when ads are off or the user subscribes. */}
      <BannerAd />
    </ScrollView>
  );
}
