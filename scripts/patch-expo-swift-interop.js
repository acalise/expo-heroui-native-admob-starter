#!/usr/bin/env node
/**
 * scripts/patch-expo-swift-interop.js: postinstall workaround for an upstream
 * Expo SDK 57 build failure on Xcode 26.3 / Swift 6.2.
 *
 * ── The failure ─────────────────────────────────────────────────────────────
 *   expo-modules-jsi/.../JavaScriptCodable+Date.swift:53:50:
 *   error: type of expression is ambiguous without a type annotation
 *     guard milliseconds.isFinite, abs(milliseconds) <= maxJavaScriptDateMilliseconds
 *
 * ── The cause ───────────────────────────────────────────────────────────────
 * ExpoModulesJSI is compiled with Swift/C++ interop so it can talk to JSI. That
 * interop imports the C++ standard library's `abs` overload set into scope
 * alongside Swift's own generic `abs`, and on newer toolchains the compiler can
 * no longer pick between them for a `Double`. Nothing about the code is wrong,
 * it stopped compiling because the toolchain around it changed.
 *
 * ── The fix ─────────────────────────────────────────────────────────────────
 * `Double.magnitude` is the same value with no overload to resolve. One line,
 * no behaviour change. (`Swift.abs(...)` works equally well.)
 *
 * ── Why a script and not patch-package ──────────────────────────────────────
 * patch-package is the usual tool, but it hard-fails when the upstream file
 * changes, which is exactly what happens the day Expo fixes this, turning a
 * routine SDK bump into a broken install for everyone who cloned the starter.
 * This script is idempotent and never fails the install: if the buggy line is
 * gone, it says so and exits cleanly. Delete `scripts/` and the `postinstall`
 * entry in package.json once you're on an Expo version that has the fix.
 *
 * Verified: with this applied, `npx expo run:ios` builds clean on
 * Xcode 26.3 / Swift 6.2.4 with Expo SDK 57.0.11 + expo-modules-jsi 57.0.4.
 */

const fs = require('node:fs');
const path = require('node:path');

const TARGET = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-modules-jsi',
  'apple',
  'Sources',
  'ExpoModulesJSI',
  'Coding',
  'JavaScriptCodable+Date.swift',
);

const BROKEN = 'abs(milliseconds) <= maxJavaScriptDateMilliseconds';
const FIXED = 'milliseconds.magnitude <= maxJavaScriptDateMilliseconds';

function main() {
  if (!fs.existsSync(TARGET)) {
    // Expo restructured the package, or this is a fresh clone with no install
    // yet. Either way there's nothing to do and nothing is wrong.
    return;
  }

  const source = fs.readFileSync(TARGET, 'utf8');

  if (source.includes(FIXED)) return; // already applied

  if (!source.includes(BROKEN)) {
    console.log(
      '[patch] expo-modules-jsi no longer contains the ambiguous `abs()` call, ' +
        'upstream has likely fixed it. You can delete scripts/patch-expo-swift-interop.js ' +
        'and the "postinstall" entry in package.json.',
    );
    return;
  }

  fs.writeFileSync(TARGET, source.replace(BROKEN, FIXED), 'utf8');
  console.log(
    '[patch] expo-modules-jsi: replaced ambiguous `abs()` with `.magnitude` ' +
      '(Swift/C++ interop workaround, see scripts/patch-expo-swift-interop.js).',
  );
}

try {
  main();
} catch (error) {
  // A postinstall script must never be the reason `npm install` fails.
  console.warn('[patch] skipped:', error.message);
}
