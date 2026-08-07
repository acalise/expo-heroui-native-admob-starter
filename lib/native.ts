/**
 * lib/native.ts: load a native module without letting it take the app down.
 *
 * ── The problem ─────────────────────────────────────────────────────────────
 * RevenueCat, AppsFlyer and AdMob are native modules. They exist in the app
 * binary only after a native build (`expo run:ios`, `expo prebuild`, or EAS).
 * In Expo Go they are absent, and importing them at module scope throws during
 * bundle evaluation: a white screen with a stack trace, before your first
 * component ever renders.
 *
 * That is a genuinely bad first-run experience for a starter: clone, `npx expo
 * start`, scan the QR code, crash.
 *
 * ── The approach ────────────────────────────────────────────────────────────
 * Nothing in `lib/` imports a native SDK at the top of the file. Each one goes
 * through `optionalRequire()`, which returns `null` instead of throwing when
 * the module is missing. Every call site already has to handle "this service
 * isn't configured", so "this service isn't linked" costs no extra branches.
 *
 * The result: Expo Go runs the entire UI, theming, navigation, onboarding,
 * even the paywall screen, with purchases, attribution and ads inert. Make a
 * dev build when you want the real thing.
 *
 * ── Why `require` and not dynamic `import()` ────────────────────────────────
 * `await import('x')` returns a rejected promise for a missing module, so every
 * caller becomes async and needs a `.catch`. Metro also can't tree-shake either
 * form, so there's no bundle-size argument for `import()`. A synchronous
 * `require` in a try/catch is simpler and lets these helpers stay sync.
 */

import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * True when running inside the Expo Go sandbox app rather than your own build.
 *
 * Useful for showing "this needs a dev build" copy in your UI. Do NOT use it to
 * gate SDK calls, `optionalRequire` already handles absence, and it also
 * covers the case of a dev build made before you added the dependency.
 */
export const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const cache = new Map<string, unknown>();

/**
 * `require()` a module, returning `null` if it isn't linked into this binary.
 *
 * Results are memoised, including the misses: a module that's absent stays
 * absent for the process lifetime, and re-throwing the same error on every
 * `track()` call would be pure overhead.
 *
 * @example
 *   const Purchases = optionalRequire<typeof import('react-native-purchases').default>(
 *     'react-native-purchases',
 *     (m) => m.default,
 *   );
 *   if (!Purchases) return;   // not linked, caller degrades gracefully
 */
export function optionalRequire<T>(moduleName: string, pick?: (mod: any) => T): T | null {
  if (cache.has(moduleName)) return cache.get(moduleName) as T | null;

  let resolved: T | null = null;
  try {
    const mod = requireByName(moduleName);
    resolved = (pick ? pick(mod) : (mod as T)) ?? null;
  } catch (error) {
    if (__DEV__) {
      console.log(
        `[native] "${moduleName}" is not available in this build, ` +
          `related features will no-op.${IS_EXPO_GO ? ' (running in Expo Go)' : ''}`,
      );
      if (!IS_EXPO_GO) console.log('[native] reason:', error);
    }
  }

  cache.set(moduleName, resolved);
  return resolved;
}

/**
 * The registry of loadable native modules.
 *
 * Metro resolves `require()` calls statically: it reads the string literal at
 * the call site to decide what to bundle. `require(someVariable)` is not
 * resolvable, so the module simply isn't in the bundle and the call fails at
 * runtime for a completely different reason than "not linked".
 *
 * Hence the switch. Every module gets one literal `require`, and adding a new
 * one means adding a case here: the error below says so, because the
 * alternative is a confusing runtime failure.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
function requireByName(name: string): any {
  switch (name) {
    case 'react-native-purchases':
      return require('react-native-purchases');
    case 'react-native-appsflyer':
      return require('react-native-appsflyer');
    case 'react-native-google-mobile-ads':
      return require('react-native-google-mobile-ads');
    default:
      throw new Error(
        `[native] unknown module "${name}". Add a case to requireByName() in ` +
          `lib/native.ts. Metro needs a literal require() to bundle it.`,
      );
  }
}
/* eslint-enable @typescript-eslint/no-require-imports */
