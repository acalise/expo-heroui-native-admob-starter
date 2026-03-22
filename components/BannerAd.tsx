/**
 * components/BannerAd.tsx — Optional Google AdMob banner (optional module)
 *
 * Renders a banner ad when ADS_ENABLED=true, otherwise renders nothing.
 * Drop this anywhere in a screen — it won't affect layout when disabled.
 *
 * Usage:
 *   import { BannerAd } from '@/components/BannerAd';
 *   <BannerAd />
 *
 * To remove: delete this file and any <BannerAd /> usage in your screens.
 */

import { View, StyleSheet, Platform } from 'react-native';
import { ADS_ENABLED, AD_UNIT_IDS } from '@/lib/ads';

// BannerAdSize is only imported when ads are enabled to avoid native crashes
// when the module is not fully linked (e.g. Expo Go without a dev build).

interface BannerAdProps {
  /** Override the default banner ad unit ID */
  unitId?: string;
  /** Horizontal margin around the banner (default: 0) */
  marginHorizontal?: number;
  /** Top/bottom margin around the banner (default: 8) */
  marginVertical?: number;
}

/**
 * AdMob banner ad component. Renders nothing when ADS_ENABLED is false
 * or when running on web.
 */
export function BannerAd({
  unitId,
  marginHorizontal = 0,
  marginVertical = 8,
}: BannerAdProps) {
  // No ads on web, or when disabled
  if (!ADS_ENABLED || Platform.OS === 'web') return null;

  // Lazy import to avoid native module errors in Expo Go
  let BannerAdComponent: React.ComponentType<{
    unitId: string;
    size: string;
    onAdFailedToLoad?: (error: Error) => void;
  }> | null = null;
  let bannerSize = 'BANNER';

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const admob = require('react-native-google-mobile-ads');
    BannerAdComponent = admob.BannerAd;
    bannerSize = admob.BannerAdSize.BANNER;
  } catch {
    return null;
  }

  if (!BannerAdComponent) return null;

  return (
    <View
      style={[
        styles.container,
        { marginHorizontal, marginVertical },
      ]}
    >
      <BannerAdComponent
        unitId={unitId ?? AD_UNIT_IDS.banner}
        size={bannerSize}
        onAdFailedToLoad={(error) => {
          // Silently fail — ads should never crash the app
          if (__DEV__) console.warn('[BannerAd] Failed to load:', error.message);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    overflow: 'hidden',
  },
});
