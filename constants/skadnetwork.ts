/**
 * constants/skadnetwork.ts: SKAdNetwork advertiser IDs for Info.plist.
 *
 * The raw list lives in `skadnetwork-ids.json` next to this file, not inline.
 * That's a workaround with a real cause: app.config.ts is transpiled and run by
 * plain Node before Metro exists, so it can `require` a .json but NOT a .ts.
 * Keeping the data in JSON lets both consumers, app.config.ts at build time and
 * this module at runtime, read the same single copy.
 *
 * ── Why this list exists, and why it's this long ─────────────────────────────
 * On iOS, an ad network can only be credited with an install if its
 * SKAdNetwork identifier is listed in YOUR app's Info.plist at the moment the
 * ad is shown. The list is baked into the binary. Add a network later and you
 * need a new build, a new submission, and a new review cycle before that
 * channel can attribute a single install.
 *
 * The cost of including a network you never use is zero. Apple ignores the
 * entry. The cost of omitting one is an unattributable ad campaign and a
 * multi-day wait. So the correct move is to ship every ID up front, before your
 * first submission, even if you have no plans to run ads at all.
 *
 * 153 identifiers: 152 `*.skadnetwork` values covering the networks
 * AppsFlyer integrates with (Meta, TikTok/ByteDance, Google, AppLovin,
 * ironSource, Unity, Liftoff, Moloco, …) plus `com.apple.ads` for Apple Search
 * Ads. Lowercased, per Apple's guidance.
 *
 * ── Keeping it fresh ────────────────────────────────────────────────────────
 * Networks add IDs over time. Before a release where ad spend matters, re-check
 * your MMP's published list (AppsFlyer, Adjust and Singular each publish one)
 * and Apple's own docs, then paste any additions here.
 * Source snapshot: AppsFlyer partner list, mid-2026.
 */

import SKADNETWORK_IDS_JSON from './skadnetwork-ids.json';

export const SKADNETWORK_IDS: readonly string[] = SKADNETWORK_IDS_JSON;

/** Info.plist shape: `[{ SKAdNetworkIdentifier: 'xxxx.skadnetwork' }, …]`. */
export const SKADNETWORK_ITEMS = SKADNETWORK_IDS.map((id) => ({
  SKAdNetworkIdentifier: id,
}));
