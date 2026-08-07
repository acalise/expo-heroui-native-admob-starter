/**
 * lib/review.ts: asking for a rating, at a moment that earns a good one.
 *
 * ── Why bother ──────────────────────────────────────────────────────────────
 * Star rating is one of the strongest conversion levers on a store listing,
 * it sits under your icon in every search result. It is also mostly a function
 * of *when* you ask. Ask during a frustrating moment and you harvest the
 * one-stars that would otherwise never have been written.
 *
 * ── The rules Apple imposes, whether you know them or not ───────────────────
 * `requestReview()` shows the system sheet. Apple caps it at three prompts per
 * user per 365 days, silently: over the cap the call returns normally and
 * nothing appears. You cannot detect this, you cannot tell whether the user
 * rated, and you must not gate anything on it or reward it (guideline 1.1.7,
 * "review gating", asking how they feel first and only prompting the happy
 * ones, is also explicitly banned).
 *
 * Because the budget is small and invisible, spend it deliberately. This module
 * adds the two conditions Apple doesn't: a minimum number of positive moments
 * before the first ask, and a cooldown between asks.
 *
 * ── Where to call it ────────────────────────────────────────────────────────
 * Right after something went *well*: a task finished, a streak extended, a
 * result exported. Never after an error, never during onboarding, never on
 * launch, and never on the same screen as a paywall.
 */

import * as StoreReview from 'expo-store-review';
import { Platform } from 'react-native';

import { APPLE_APP_ID } from '@/constants/config';
import { track } from './analytics';
import { storage } from './storage';

const KEY_POSITIVE_MOMENTS = 'review:moments';
const KEY_LAST_PROMPT = 'review:lastPromptAt';

/** Positive moments required before the first prompt. */
const MIN_MOMENTS = 5;
/** Days to wait before asking again. Apple allows 3/year; this spaces them out. */
const COOLDOWN_DAYS = 120;

/**
 * Record that something good just happened, and prompt if the thresholds are met.
 *
 * Safe to call liberally: it counts, checks, and usually does nothing.
 *
 * @example
 *   await onPositiveMoment();          // after a completed task
 *   await onPositiveMoment(3);         // weight a bigger milestone heavier
 */
export async function onPositiveMoment(weight = 1): Promise<void> {
  const moments = (await storage.getOrDefault<number>(KEY_POSITIVE_MOMENTS, 0)) + weight;
  await storage.set(KEY_POSITIVE_MOMENTS, moments);
  if (moments < MIN_MOMENTS) return;

  const lastPrompt = await storage.get<number>(KEY_LAST_PROMPT);
  if (lastPrompt && Date.now() - lastPrompt < COOLDOWN_DAYS * 864e5) return;

  await requestReview();
}

/**
 * Show the rating sheet now, bypassing the thresholds.
 *
 * Use for an explicit "Rate this app" row in Settings. Note the caveat above:
 * if the user is over Apple's yearly cap, tapping the row appears to do
 * nothing. `openStorePage()` is the honest fallback for a deliberate tap.
 */
export async function requestReview(): Promise<void> {
  try {
    if (!(await StoreReview.hasAction())) return;
    await storage.set(KEY_LAST_PROMPT, Date.now());
    // PostHog can't observe the sheet, but it can tell you how many users
    // reached the moment you deemed prompt-worthy.
    track('review_prompt_requested');
    await StoreReview.requestReview();
  } catch (e) {
    if (__DEV__) console.warn('[review] requestReview failed:', e);
  }
}

/**
 * Open the store's write-a-review page directly.
 *
 * Unlike the system sheet this always does something visible, so it's the right
 * target for a Settings row. It leaves your app, which is why it's wrong for an
 * automatic prompt.
 */
export async function openStorePage(): Promise<void> {
  try {
    if (Platform.OS === 'ios' && APPLE_APP_ID) {
      const { Linking } = await import('react-native');
      await Linking.openURL(`https://apps.apple.com/app/id${APPLE_APP_ID}?action=write-review`);
      return;
    }
    const url = StoreReview.storeUrl();
    if (url) {
      const { Linking } = await import('react-native');
      await Linking.openURL(url);
    }
  } catch (e) {
    if (__DEV__) console.warn('[review] openStorePage failed:', e);
  }
}

/** Dev helper, clear the counters so you can exercise the flow again. */
export async function resetReviewState(): Promise<void> {
  await storage.removeMany([KEY_POSITIVE_MOMENTS, KEY_LAST_PROMPT]);
}
