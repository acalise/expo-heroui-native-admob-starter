/**
 * components/SectionLabel.tsx
 *
 * Small uppercase section divider label used in the component showcase.
 */

import { Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface SectionLabelProps {
  children: string;
}

export function SectionLabel({ children }: SectionLabelProps) {
  const { theme } = useTheme();
  return (
    <Text
      style={[
        styles.label,
        { color: theme.textMuted },
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 12,
    paddingLeft: 2,
  },
});
