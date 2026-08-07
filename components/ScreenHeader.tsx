/**
 * components/ScreenHeader.tsx: the large title at the top of a tab screen.
 *
 * Deliberately not a navigation header: it scrolls away with the content, which
 * is the iOS large-title behaviour people expect, and it lets each screen own
 * its own spacing without fighting the navigator.
 */

import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from './AppText';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Rendered on the right: an action button, a chip, a count. */
  accessory?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, accessory }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-row items-end justify-between pb-5"
      style={{ paddingTop: insets.top + 16 }}
    >
      <View className="flex-1">
        <AppText className="text-[32px] font-extrabold tracking-tight text-foreground">
          {title}
        </AppText>
        {subtitle ? <AppText className="pt-1 text-sm text-muted">{subtitle}</AppText> : null}
      </View>
      {accessory}
    </View>
  );
}
