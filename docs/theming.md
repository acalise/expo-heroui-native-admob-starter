# Theming

**Files:** `theme.css`, `global.css`, `hooks/useAppTheme.ts`, `context/ThemeContext.tsx`

---

## The whole system in one paragraph

HeroUI Native components are styled by CSS custom properties. Uniwind compiles Tailwind classes for React Native and resolves them against those same properties. So one CSS file defines every color, and both `className` strings and HeroUI's internal styles read from it. `theme.css` is that file. There is no `constants/theme.ts`, no exported palette object, and no second copy of any hex code.

---

## Rebranding the app

Open `theme.css` and change two lines per color scheme:

```css
@variant light {
  --accent: #3b82f6;
  --accent-foreground: #ffffff;
}
```

That's the whole job. Buttons, chips, switches, focus rings, the active tab, the onboarding dots, the paywall's checkmarks. Everything picks it up, in both color schemes, with no other edits.

`--accent-foreground` is what gets drawn _on top of_ the accent. Set it to whatever stays readable, white on a mid-blue, near-black on a yellow. Getting this wrong is the usual cause of an unreadable primary button after a rebrand.

### The rest of the tokens

`theme.css` also overrides surfaces, text, borders and status colors. Any variable you delete falls back to HeroUI's own default, so you can override as little or as much as you like. The full list of ~64 tokens is in:

```
node_modules/heroui-native/lib/module/styles/variables.css
```

### Roundness

```css
--radius: 0.75rem;
```

One value drives the corner radius of every component. `0.25rem` reads sharp and technical; `1.5rem` reads soft and consumer.

---

## Why hex and not oklch

HeroUI's own defaults use `oklch()`, which is a better color space and worth using for anything consumed only through `className`.

But React Native's style engine cannot parse `oklch()`. Any value that `useAppTheme()` hands to a JS color prop: the tab bar tint, the Stack's `contentStyle`: must be something RN understands, or it silently renders as transparent. So `theme.css` uses plain hex for the tokens that cross that boundary.

---

## Light, dark, and system

`context/ThemeContext.tsx` handles the preference. The line that matters:

```ts
Uniwind.setTheme(mode); // 'light' | 'dark' | 'system'
```

Uniwind decides which `@variant` block is live. **Track the color mode in React state alone and your toggle will flip your own screens while every HeroUI component stays on the system setting**: a half-themed app, and a surprisingly easy mistake to make.

`'system'` is a real, persisted third option, not the absence of a choice. A user who never touches the toggle should keep following their device as it changes at sunset; a user who explicitly picked Dark should stay dark at noon. Collapsing this to a boolean is the usual reason an app's dark mode "randomly turns itself back on".

```ts
const { preference, colorMode, isDark, setPreference, toggleColorMode } = useColorMode();
```

- `preference`: what the user chose, including `'system'`
- `colorMode`: what that resolves to right now

---

## Colors in JavaScript

Most of the time you don't need this, use a class:

```tsx
<View className="bg-surface border border-border">
  <AppText className="text-foreground">Hello</AppText>
</View>
```

For the few places that take a color as a prop, read the same variables rather than typing a hex code:

```ts
import { useThemeColor } from 'heroui-native';

const accent = useThemeColor('accent');
const [bg, border] = useThemeColor(['background', 'border']);
```

`hooks/useAppTheme.ts` wraps this to return a whole palette object, for the couple of call sites (the tab bar) that want several at once. Prefer `useThemeColor` for one or two, it's cheaper.

---

## Adding a second brand theme

Uniwind supports named themes beyond light/dark, useful for a "high contrast" mode, a seasonal skin, or per-user theme choice.

1. Create `themes/ocean.css`:

   ```css
   @layer theme {
     :root {
       @variant ocean-light {
         --accent: #0891b2; /* … */
       }
       @variant ocean-dark {
         --accent: #22d3ee; /* … */
       }
     }
   }
   ```

2. Import it from `global.css`.
3. Register the variant names in `metro.config.js`:

   ```js
   module.exports = withUniwindConfig(config, {
     cssEntryFile: './global.css',
     dtsFile: './uniwind-types.d.ts',
     extraThemes: ['ocean-light', 'ocean-dark'],
   });
   ```

4. `Uniwind.setTheme('ocean-dark')`

Restart Metro with `-c` after changing `metro.config.js`, theme names are baked in at compile time.

---

## Fonts

Add a custom font in one place:

```css
/* theme.css, inside each @variant block */
--font-normal: 'Inter-Regular';
--font-medium: 'Inter-Medium';
--font-semibold: 'Inter-SemiBold';
--font-bold: 'Inter-Bold';
```

Load the files with `expo-font` in `app/_layout.tsx` and hold the splash screen until they're ready, otherwise the first frame renders in the system font and visibly reflows.

`components/AppText.tsx` is the other place worth knowing about: it caps `maxFontSizeMultiplier` at 1.6. iOS accessibility text scales to ~310%, at which point an uncapped layout doesn't degrade so much as disintegrate. The cap keeps text growing for people who need it while keeping rows intact. Never reach for `allowFontScaling={false}`: that ignores the user's setting entirely, which is the accessibility bug people actually notice.

---

## Troubleshooting

**A class does nothing.** Tailwind only emits utilities it has seen used. If you're styling a component in `node_modules`, add it to the `@source` list in `global.css`, that's exactly why HeroUI's `lib` directory is listed there.

**Colors don't change after editing theme.css.** Restart Metro with `npx expo start -c`. CSS is compiled at bundle time and the cache is aggressive.

**HeroUI components ignore the in-app toggle.** `Uniwind.setTheme()` isn't being called. See `context/ThemeContext.tsx`.

**A color renders transparent.** It's probably `oklch()` reaching a JS color prop. Use hex for anything `useThemeColor()` returns to a StyleSheet.
