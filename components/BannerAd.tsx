/**
 * components/BannerAd.tsx: an AdMob banner that's safe to leave in your layout.
 *
 * Renders nothing at all when ads are off, when the SDK isn't linked (Expo Go),
 * or when the user is a subscriber. Because it collapses to zero height rather
 * than reserving space, you can drop `<BannerAd />` into a screen and forget
 * about it: the layout is identical for paying users.
 *
 * Usage:
 *   <BannerAd />
 *   <BannerAd size="anchored" />   // adaptive, sized to the device width
 *
 * Removing ads entirely: see docs/admob.md.
 */

import { useState } from 'react';
import { View } from 'react-native';

import { AD_UNIT_IDS, adsAllowed } from '@/lib/ads';
import { optionalRequire } from '@/lib/native';

type AdMobModule = typeof import('react-native-google-mobile-ads');

interface BannerAdProps {
  /** Override the ad unit. Defaults to the banner unit in lib/ads.ts. */
  unitId?: string;
  /**
   * 'fixed': the classic 320×50 banner.
   * 'anchored', adaptive: full device width, height chosen by Google.
   *              Higher fill and better revenue; use it unless you have a
   *              layout reason not to.
   */
  size?: 'fixed' | 'anchored';
  className?: string;
}

export function BannerAd({ unitId, size = 'anchored', className }: BannerAdProps) {
  // A banner that fails to fill should occupy no space rather than leaving a
  // grey gap, no-fill is normal, especially with low traffic or in some regions.
  const [failed, setFailed] = useState(false);

  if (!adsAllowed() || failed) return null;

  const admob = optionalRequire<AdMobModule>('react-native-google-mobile-ads', (m) => m);
  if (!admob) return null;

  const { BannerAd: GoogleBanner, BannerAdSize } = admob;

  return (
    <View className={className ?? 'items-center py-2'}>
      <GoogleBanner
        unitId={unitId ?? AD_UNIT_IDS.banner}
        size={size === 'anchored' ? BannerAdSize.ANCHORED_ADAPTIVE_BANNER : BannerAdSize.BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={(error: Error) => {
          if (__DEV__) console.log('[BannerAd] no fill:', error.message);
          setFailed(true);
        }}
      />
    </View>
  );
}
