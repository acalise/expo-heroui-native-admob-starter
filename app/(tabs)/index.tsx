/**
 * app/(tabs)/index.tsx — Component Showcase
 *
 * This screen demonstrates the HeroUI Native components available in this
 * starter. Replace with your own content once you've picked what you need.
 */

import { ScrollView, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import {
  Button,
  Card,
  Input,
  Switch,
  Avatar,
  Chip,
  Separator,
  Spinner,
} from 'heroui-native';
import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { haptics } from '@/lib/haptics';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionLabel } from '@/components/SectionLabel';
import { BannerAd } from '@/components/BannerAd';

export default function ComponentsScreen() {
  const { theme } = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [switchOn, setSwitchOn] = useState(false);
  const [progress, setProgress] = useState(60);
  const [isLoading, setIsLoading] = useState(false);

  function handleLoadingButton() {
    haptics.medium();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  }

  const s = styles(theme);

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Components"
        subtitle="HeroUI Native component showcase"
      />

      {/* ── Buttons ──────────────────────────────────────────────────────── */}
      <SectionLabel>Buttons</SectionLabel>

      <Card style={s.card}>
        <Card.Body style={s.cardBody}>
          <View style={s.row}>
            <Button
              variant="primary"
              onPress={() => haptics.medium()}
              style={s.btnFlex}
            >
              Primary
            </Button>
            <Button
              variant="secondary"
              onPress={() => haptics.light()}
              style={s.btnFlex}
            >
              Secondary
            </Button>
          </View>

          <View style={s.row}>
            <Button
              variant="outline"
              onPress={() => haptics.light()}
              style={s.btnFlex}
            >
              Outline
            </Button>
            <Button
              variant="ghost"
              onPress={() => haptics.light()}
              style={s.btnFlex}
            >
              Ghost
            </Button>
          </View>

          <View style={s.row}>
            <Button
              variant="primary"
              size="sm"
              onPress={() => haptics.success()}
            >
              Small
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => haptics.warning()}
            >
              Small
            </Button>
            <Button
              variant="danger"
              size="sm"
              onPress={() => haptics.error()}
            >
              Danger
            </Button>
          </View>

          <Button
            variant="primary"
            isDisabled={isLoading}
            onPress={handleLoadingButton}
          >
            {isLoading ? 'Loading…' : 'Press to Load'}
          </Button>
        </Card.Body>
      </Card>

      {/* ── Inputs ───────────────────────────────────────────────────────── */}
      <SectionLabel>Inputs</SectionLabel>

      <Card style={s.card}>
        <Card.Body style={s.cardBody}>
          <View>
            <Text style={s.inputLabel}>Username</Text>
            <Input
              placeholder="Enter your username"
              value={inputValue}
              onChangeText={setInputValue}
            />
          </View>
          <View>
            <Text style={s.inputLabel}>Password</Text>
            <Input
              placeholder="Enter your password"
              secureTextEntry
            />
          </View>
          <View>
            <Text style={s.inputLabel}>Email</Text>
            <Input
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={s.inputDesc}>We'll never share your email.</Text>
          </View>
          <View>
            <Text style={s.inputLabel}>Error state</Text>
            <Input
              placeholder="Something went wrong"
              isInvalid
            />
            <Text style={s.inputError}>This field is required.</Text>
          </View>
        </Card.Body>
      </Card>

      {/* ── Cards ────────────────────────────────────────────────────────── */}
      <SectionLabel>Cards</SectionLabel>

      <Card style={s.card}>
        <Card.Header>
          <Text style={s.cardTitle}>Featured</Text>
        </Card.Header>
        <Card.Body>
          <Text style={s.cardText}>
            Cards are flexible containers that group related content. Use
            variants like <Text style={s.accent}>secondary</Text>,{' '}
            <Text style={s.accent}>tertiary</Text>, or the default style.
          </Text>
        </Card.Body>
      </Card>

      <Card variant="secondary" style={s.card}>
        <Card.Body style={s.cardBody}>
          <View style={s.row}>
            <Avatar alt="Alice">
              <Avatar.Fallback>AJ</Avatar.Fallback>
            </Avatar>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.cardTitle}>Alice Johnson</Text>
              <Text style={s.cardSubtitle}>Product Designer</Text>
            </View>
            <Chip variant="primary" size="sm">New</Chip>
          </View>
        </Card.Body>
      </Card>

      {/* ── Switch ───────────────────────────────────────────────────────── */}
      <SectionLabel>Switches</SectionLabel>

      <Card style={s.card}>
        <Card.Body style={s.cardBody}>
          <View style={s.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Notifications</Text>
              <Text style={s.cardSubtitle}>Receive push notifications</Text>
            </View>
            <Switch
              isSelected={switchOn}
              onSelectedChange={(v: boolean) => {
                haptics.light();
                setSwitchOn(v);
              }}
            />
          </View>

          <Separator />

          <View style={s.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Dark Mode</Text>
              <Text style={s.cardSubtitle}>Toggle in Settings tab</Text>
            </View>
            <Switch isSelected={false} isDisabled />
          </View>
        </Card.Body>
      </Card>

      {/* ── Progress (custom) ──────────────────────────────────────────── */}
      <SectionLabel>Progress</SectionLabel>

      <Card style={s.card}>
        <Card.Body style={s.cardBody}>
          <Text style={s.cardSubtitle}>Default ({progress}%)</Text>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${progress}%`, backgroundColor: theme.accent }]} />
          </View>

          <Text style={[s.cardSubtitle, { marginTop: 12 }]}>Success (100%)</Text>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: '100%', backgroundColor: '#10b981' }]} />
          </View>

          <Text style={[s.cardSubtitle, { marginTop: 12 }]}>Warning (40%)</Text>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: '40%', backgroundColor: '#f59e0b' }]} />
          </View>

          <View style={[s.row, { marginTop: 16 }]}>
            <Button
              size="sm"
              variant="outline"
              onPress={() => {
                haptics.light();
                setProgress((p) => Math.max(0, p - 10));
              }}
            >
              −10
            </Button>
            <Button
              size="sm"
              variant="outline"
              onPress={() => {
                haptics.light();
                setProgress((p) => Math.min(100, p + 10));
              }}
            >
              +10
            </Button>
          </View>
        </Card.Body>
      </Card>

      {/* ── Chips ──────────────────────────────────────────────────────── */}
      <SectionLabel>Chips</SectionLabel>

      <Card style={s.card}>
        <Card.Body style={s.cardBody}>
          <View style={s.chipRow}>
            <Chip variant="primary">Primary</Chip>
            <Chip variant="secondary">Secondary</Chip>
            <Chip variant="tertiary">Tertiary</Chip>
            <Chip variant="soft">Soft</Chip>
          </View>
        </Card.Body>
      </Card>

      {/* ── Avatars ──────────────────────────────────────────────────────── */}
      <SectionLabel>Avatars</SectionLabel>

      <Card style={s.card}>
        <Card.Body style={s.cardBody}>
          <View style={s.chipRow}>
            <Avatar alt="Alice" size="sm">
              <Avatar.Fallback>AL</Avatar.Fallback>
            </Avatar>
            <Avatar alt="Bob" size="md">
              <Avatar.Fallback>BO</Avatar.Fallback>
            </Avatar>
            <Avatar alt="Charlie" size="lg">
              <Avatar.Fallback>CH</Avatar.Fallback>
            </Avatar>
            <Avatar alt="Photo" size="lg">
              <Avatar.Image source={{ uri: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }} />
              <Avatar.Fallback>PH</Avatar.Fallback>
            </Avatar>
          </View>
          <View style={[s.chipRow, { marginTop: 12 }]}>
            <Avatar alt="XL" size="lg">
              <Avatar.Fallback>XL</Avatar.Fallback>
            </Avatar>
            <Avatar alt="Bordered" size="lg">
              <Avatar.Fallback>BD</Avatar.Fallback>
            </Avatar>
            <Avatar alt="Disabled" size="lg">
              <Avatar.Fallback>DI</Avatar.Fallback>
            </Avatar>
          </View>
        </Card.Body>
      </Card>

      {/* ── Spinner ──────────────────────────────────────────────────────── */}
      <SectionLabel>Spinners</SectionLabel>

      <Card style={[s.card, { marginBottom: 32 }]}>
        <Card.Body style={s.cardBody}>
          <View style={s.chipRow}>
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
          </View>
        </Card.Body>
      </Card>

      {/* Optional: Banner ad at the bottom of the screen */}
      <BannerAd marginVertical={12} />
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
function styles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: theme.background },
    content: { paddingHorizontal: 16, paddingBottom: 40 },
    card: {
      backgroundColor: theme.backgroundElevated,
      marginBottom: 12,
      borderRadius: 16,
      borderColor: theme.border,
    },
    cardBody: { gap: 10 },
    cardTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    cardSubtitle: {
      fontSize: 13,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    cardText: {
      fontSize: 14,
      color: theme.textSecondary,
      lineHeight: 21,
    },
    accent: { color: theme.accent, fontWeight: '600' },
    row: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
    },
    btnFlex: { flex: 1 },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      alignItems: 'center',
    },
    inputLabel: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.textPrimary,
      marginBottom: 4,
    },
    inputDesc: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 4,
    },
    inputError: {
      fontSize: 12,
      color: '#ef4444',
      marginTop: 4,
    },
    progressTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.border,
      overflow: 'hidden',
      marginTop: 4,
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
  });
}
