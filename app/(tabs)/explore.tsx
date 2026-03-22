/**
 * app/(tabs)/explore.tsx — More Component Examples
 *
 * Shows dialogs, selects, and layout patterns.
 */

import { ScrollView, View, Text, StyleSheet } from 'react-native';
import {
  Button,
  Card,
  Dialog,
  Select,
  TextArea,
  RadioGroup,
  ControlField,
  Skeleton,
  Separator,
} from 'heroui-native';
import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { haptics } from '@/lib/haptics';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionLabel } from '@/components/SectionLabel';

type SelectOption = { value: string; label: string } | undefined;

const ANIMAL_OPTIONS = [
  { value: 'cat', label: 'Cat' },
  { value: 'dog', label: 'Dog' },
  { value: 'elephant', label: 'Elephant' },
  { value: 'penguin', label: 'Penguin' },
];

export default function ExploreScreen() {
  const { theme } = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<SelectOption>({ value: 'cat', label: 'Cat' });
  const [radioValue, setRadioValue] = useState('option1');
  const [checkboxes, setCheckboxes] = useState<Record<string, boolean>>({
    option1: true,
    option2: false,
    option3: false,
  });
  const [showSkeleton, setShowSkeleton] = useState(true);

  const s = styles(theme);

  function toggleCheckbox(key: string) {
    setCheckboxes((prev) => ({ ...prev, [key]: !prev[key] }));
    haptics.light();
  }

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="Explore" subtitle="More HeroUI patterns" />

      {/* ── Dialog (Modal) ──────────────────────────────────────────────── */}
      <SectionLabel>Dialog</SectionLabel>

      <Card style={s.card}>
        <Card.Body>
          <Text style={s.cardText}>
            Tap the button to open a dialog overlay with title, body, and
            footer actions.
          </Text>
          <Button
            variant="primary"
            onPress={() => {
              haptics.medium();
              setDialogOpen(true);
            }}
            style={{ marginTop: 12 }}
          >
            Open Dialog
          </Button>
        </Card.Body>
      </Card>

      <Dialog isOpen={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Title>Confirm Action</Dialog.Title>
            <Dialog.Description>
              This is an example dialog. You can put any content here — forms,
              confirmations, media, or complex layouts.
            </Dialog.Description>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
              <Button variant="ghost" onPress={() => setDialogOpen(false)} style={{ flex: 1 }}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onPress={() => {
                  haptics.success();
                  setDialogOpen(false);
                }}
                style={{ flex: 1 }}
              >
                Confirm
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      {/* ── Select ───────────────────────────────────────────────────────── */}
      <SectionLabel>Select</SectionLabel>

      <Card style={s.card}>
        <Card.Body style={s.cardBody}>
          <Text style={s.inputLabel}>Favourite Animal</Text>
          <Select
            value={selectedAnimal}
            onValueChange={(val: SelectOption) => {
              setSelectedAnimal(val);
              haptics.select();
            }}
            presentation="dialog"
          >
            <Select.Trigger>
              <Select.Value placeholder="Pick one" />
            </Select.Trigger>
            <Select.Portal>
              <Select.Overlay />
              <Select.Content presentation="dialog">
                {ANIMAL_OPTIONS.map((item) => (
                  <Select.Item key={item.value} value={item.value} label={item.label}>
                    <Select.ItemLabel />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Portal>
          </Select>
          <Text style={s.cardSubtitle}>
            Selected: <Text style={s.accent}>{selectedAnimal?.label ?? 'none'}</Text>
          </Text>
        </Card.Body>
      </Card>

      {/* ── TextArea ───────────────────────────────────────────────────── */}
      <SectionLabel>TextArea</SectionLabel>

      <Card style={s.card}>
        <Card.Body>
          <Text style={s.inputLabel}>Notes</Text>
          <TextArea placeholder="Write something…" />
        </Card.Body>
      </Card>

      {/* ── Radio Group ──────────────────────────────────────────────────── */}
      <SectionLabel>Radio Group</SectionLabel>

      <Card style={s.card}>
        <Card.Body>
          <Text style={s.inputLabel}>Choose plan</Text>
          <RadioGroup
            value={radioValue}
            onValueChange={(v: string) => {
              setRadioValue(v);
              haptics.select();
            }}
          >
            <RadioGroup.Item value="option1">Free</RadioGroup.Item>
            <RadioGroup.Item value="option2">Pro — $9/mo</RadioGroup.Item>
            <RadioGroup.Item value="option3">Enterprise</RadioGroup.Item>
          </RadioGroup>
        </Card.Body>
      </Card>

      {/* ── Checkboxes ─────────────────────────────────────────────────── */}
      <SectionLabel>Checkboxes</SectionLabel>

      <Card style={s.card}>
        <Card.Body style={{ gap: 8 }}>
          <ControlField
            isSelected={checkboxes.option1}
            onSelectedChange={() => toggleCheckbox('option1')}
          >
            <ControlField.Indicator variant="checkbox" />
            <Text style={s.checkLabel}>Email updates</Text>
          </ControlField>
          <ControlField
            isSelected={checkboxes.option2}
            onSelectedChange={() => toggleCheckbox('option2')}
          >
            <ControlField.Indicator variant="checkbox" />
            <Text style={s.checkLabel}>Push notifications</Text>
          </ControlField>
          <ControlField
            isSelected={checkboxes.option3}
            onSelectedChange={() => toggleCheckbox('option3')}
          >
            <ControlField.Indicator variant="checkbox" />
            <Text style={s.checkLabel}>Weekly digest</Text>
          </ControlField>
        </Card.Body>
      </Card>

      {/* ── Skeleton ─────────────────────────────────────────────────────── */}
      <SectionLabel>Skeleton Loading</SectionLabel>

      <Card style={[s.card, { marginBottom: 8 }]}>
        <Card.Body style={s.cardBody}>
          <Button
            size="sm"
            variant="outline"
            onPress={() => {
              haptics.light();
              setShowSkeleton((v) => !v);
            }}
            style={{ alignSelf: 'flex-start' }}
          >
            Toggle Skeleton
          </Button>

          <View style={s.skeletonRow}>
            <Skeleton isLoading={showSkeleton} style={s.skeletonAvatar}>
              <View style={[s.skeletonAvatar, { backgroundColor: theme.accent }]} />
            </Skeleton>
            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton isLoading={showSkeleton} style={s.skeletonLine} />
              <Skeleton
                isLoading={showSkeleton}
                style={[s.skeletonLine, { width: '60%' }]}
              />
            </View>
          </View>
        </Card.Body>
      </Card>

      {/* ── Card variants ────────────────────────────────────────────────── */}
      <SectionLabel>Card Variants</SectionLabel>

      {(['default', 'secondary', 'tertiary'] as const).map((variant) => (
        <Card key={variant} variant={variant} style={{ marginBottom: 10, borderRadius: 16 }}>
          <Card.Header>
            <Text style={s.cardTitle}>{variant}</Text>
          </Card.Header>
          <Card.Body>
            <Text style={s.cardText}>
              A <Text style={s.accent}>{variant}</Text> card. Use the{' '}
              <Text style={{ fontFamily: 'monospace' }}>variant</Text> prop to
              adjust the visual treatment.
            </Text>
          </Card.Body>
          <Card.Footer>
            <Button size="sm" variant="ghost">
              Learn more
            </Button>
          </Card.Footer>
        </Card>
      ))}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

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
    cardTitle: { fontSize: 15, fontWeight: '600', color: theme.textPrimary },
    cardSubtitle: { fontSize: 13, color: theme.textSecondary },
    cardText: { fontSize: 14, color: theme.textSecondary, lineHeight: 21 },
    accent: { color: theme.accent, fontWeight: '600' },
    inputLabel: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.textPrimary,
      marginBottom: 4,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
    modalBody: { fontSize: 14, color: theme.textSecondary, lineHeight: 22 },
    checkLabel: { fontSize: 14, color: theme.textPrimary },
    skeletonRow: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 8 },
    skeletonAvatar: { width: 44, height: 44, borderRadius: 22 },
    skeletonLine: { height: 14, borderRadius: 7, backgroundColor: theme.border },
  });
}
