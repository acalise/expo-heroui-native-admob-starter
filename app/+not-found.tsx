/**
 * app/+not-found.tsx: shown for any route that doesn't exist.
 *
 * Worth keeping even if you think your app has no dead links: this is also what
 * a malformed deep link lands on, and the alternative is a blank screen with no
 * way back.
 */

import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Button } from 'heroui-native';

import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <Screen>
      <View className="flex-1 items-center justify-center gap-2 px-8">
        <AppText className="text-7xl font-black text-accent">404</AppText>
        <AppText className="text-2xl font-bold text-foreground">Screen not found</AppText>
        <AppText className="pb-4 text-center text-base leading-6 text-muted">
          That route doesn&apos;t exist. It may have moved, or the link may be wrong.
        </AppText>
        <Button onPress={() => router.replace('/(tabs)')}>
          <Button.Label>Go home</Button.Label>
        </Button>
      </View>
    </Screen>
  );
}
