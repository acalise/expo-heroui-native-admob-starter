# PostHog: product analytics

**File:** `lib/analytics.ts`
**Env:** `EXPO_PUBLIC_POSTHOG_KEY`, `EXPO_PUBLIC_POSTHOG_HOST`
**Cost:** free for 1M events/month. Most small apps never exceed it.

---

## Why use it

AppsFlyer answers _"where did this user come from?"_. PostHog answers _"what did they do once they arrived, and where did they give up?"_ Neither substitutes for the other, which is why this starter has both behind one `track()` call.

Concretely, the things you can only see with product analytics:

- **Onboarding drop-off, per step.** "50% finish onboarding" is not actionable. "38% quit on the notifications step" is a fix you can ship this afternoon.
- **Paywall conversion by entry point.** The same paywall converts very differently from a settings tap than from a blocked feature.
- **Retention curves** by cohort, install source, or any property you attach.
- **Session replays**: watch the actual session where someone rage-tapped a button that does nothing.
- **Feature flags** and A/B tests without an app release.

It's open source and self-hostable, which matters if you'd rather not send behavioural data to a vendor.

### Alternatives

|                        | Notes                                                                                          |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| **PostHog**            | Best free tier; replay + flags + analytics in one. What this wires.                            |
| **Amplitude**          | Stronger cohort/funnel analysis. Free tier is smaller.                                         |
| **Mixpanel**           | Similar. Cleaner UI, pricier at scale.                                                         |
| **Firebase Analytics** | Free and unlimited, but event-parameter limits and a reporting delay make funnel work painful. |
| **None**               | Fine for a v1. Add it before you start optimising anything.                                    |

---

## Setup

1. Sign up at [posthog.com](https://posthog.com) (or self-host).
2. Project settings → **Project API key** (starts `phc_`). It's designed to be public, shipping it in the bundle is expected.
3. ```bash
   # .env
   EXPO_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxx
   # EU projects: this is the #1 cause of "events aren't arriving":
   # EXPO_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
   ```
4. `npx expo start -c`

Works in Expo Go. PostHog is pure JavaScript, no native module.

**Verify:** Growth tab → _Send a test event_ → PostHog → Activity. Should appear within seconds.

---

## Using it

```ts
import { track, trackScreen, identifyUser, resetUser } from '@/lib/analytics';

track('feature_used', { feature: 'export', duration_ms: 1240 });
trackScreen('Settings');
identifyUser(user.id, { email: user.email, plan: 'pro' }); // after login
resetUser(); // on logout
```

`track()` also forwards to AppsFlyer. If you remove AppsFlyer, `track()` keeps working unchanged.

### Naming events

Pick a convention and hold it. This starter uses `object_action`, lowercase snake_case:

```
onboarding_step        paywall_dismissed      purchase_completed
reminder_toggled       att_prompt_answered    review_prompt_requested
```

Six months in, the difference between a usable event list and an unusable one is entirely naming discipline. Prefer few events with rich properties over many narrowly-named events, `paywall_dismissed { source: 'settings' }` beats `settings_paywall_dismissed`, because you can group by source _and_ see the total.

### Super properties

`lib/analytics.ts` registers `platform: 'mobile'` on every event:

```ts
posthog?.register({ platform: 'mobile' });
```

If several apps report into one PostHog project, add an `app` discriminator here. Without it, two apps that both emit `onboarding_step` produce one meaningless merged funnel.

---

## Automatic screen tracking

`<PostHogProvider>` can capture screen views without you calling `trackScreen()`:

```tsx
import { PostHogProvider } from 'posthog-react-native';
import { posthog } from '@/lib/analytics';

<PostHogProvider client={posthog} autocapture={{ captureScreens: true }}>
  {/* app */}
</PostHogProvider>;
```

Not on by default here, deliberately. Autocapture with expo-router produces route names (`(tabs)/index`, `[id]`) rather than screen names you'd want in a funnel, and it captures every route including ones you don't care about. Explicit `trackScreen()` calls at the handful of screens that matter give you cleaner data. Turn it on if you'd rather have everything and filter later.

## Session replay

```ts
new PostHog(KEY, { host: HOST, enableSessionReplay: true });
```

Genuinely useful for diagnosing "users say it's confusing": you watch it happen. Two caveats: it consumes event quota fast, and it captures the screen, so **mask anything sensitive** with `<PostHogMaskView>` before enabling it in production. Check your privacy policy covers it.

## Feature flags

```ts
import { useFeatureFlag } from 'posthog-react-native';

const showNewPaywall = useFeatureFlag('new-paywall');
```

Ship both code paths, flip the flag from the dashboard, no release. The natural pairing with `app/paywall.tsx`, paywall variants are the highest-leverage thing to A/B test in a subscription app.

---

## What not to send

`EXPO_PUBLIC_POSTHOG_KEY` is a write-only ingestion key, publishing it is fine. What is **not** fine:

- A **personal API key** (`phx_…`). Those can read and delete your data. Server-side only.
- Personally identifying data in event properties. `identifyUser(user.id)` links a user; putting an email in every event's properties spreads PII across your whole dataset and makes a deletion request much harder to honour.
- Anything you'd be uncomfortable seeing in a support screenshot.

---

## Removing PostHog

1. In `lib/analytics.ts`: delete the `PostHog` import and the `posthog` export, and remove `posthog?.capture(...)` from `track()`, `trackScreen()`, `identifyUser()`, `resetUser()`, and the revenue helpers.
2. `npm uninstall posthog-react-native`

The call sites don't change, `track()` keeps working, it just stops forwarding to PostHog.
