import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'heroui-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';

export default function NotFoundScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <View style={styles.container}>
        <Text style={[styles.code, { color: theme.accent }]}>404</Text>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          Screen not found
        </Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          The route you're looking for doesn't exist.
        </Text>
        <Button
          variant="primary"
          style={{ marginTop: 24 }}
          onPress={() => router.replace('/(tabs)')}
        >
          Go Home
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  code: { fontSize: 80, fontWeight: '900', lineHeight: 90 },
  title: { fontSize: 24, fontWeight: '700', marginTop: 8 },
  body: { fontSize: 15, textAlign: 'center', marginTop: 10, lineHeight: 24 },
});
