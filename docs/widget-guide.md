# iOS Widget Guide (Advanced)

This guide explains how to add **iOS Home Screen Widgets** to your Expo app as an optional
extension. Widgets are built with **SwiftUI** inside a native App Extension and can read shared
data you expose from the RN side via **App Groups**.

> **Note:** Widgets require an [EAS Build](https://docs.expo.dev/build/introduction/) or ejecting
> to a bare workflow. They cannot run in Expo Go.

---

## Prerequisites

| Requirement | Notes |
|---|---|
| Expo SDK 51+ | Needed for stable bare workflow |
| Apple Developer Account | Required for App Groups entitlement |
| Xcode 15+ | SwiftUI widget templates ship with Xcode |
| EAS CLI | `npm install -g eas-cli` |

---

## How Widgets Share Data with Your App

Widgets cannot access your app's AsyncStorage directly. Instead, you expose data through an
**App Group** — a shared container on disk that both the main app and the widget extension can
read and write.

```
Main App (React Native)
    │
    │  Writes JSON to App Group container
    ▼
App Group: group.com.yourname.yourapp
    │
    │  Reads from container
    ▼
Widget Extension (SwiftUI)
```

---

## Step 1 — Enable App Groups in Expo

In `app.json`, add the entitlement for both your main target and the widget extension:

```json
{
  "expo": {
    "ios": {
      "entitlements": {
        "com.apple.security.application-groups": [
          "group.com.yourname.yourapp"
        ]
      }
    }
  }
}
```

---

## Step 2 — Write Data from React Native

Install the community library that bridges React Native → App Group:

```bash
npx expo install react-native-shared-group-preferences
```

Then write your widget data whenever relevant state changes:

```ts
// lib/widgetData.ts
import SharedGroupPreferences from 'react-native-shared-group-preferences';

const APP_GROUP = 'group.com.yourname.yourapp';

export interface WidgetData {
  title: string;
  value: number;
  updatedAt: string; // ISO date string
}

export async function updateWidgetData(data: WidgetData): Promise<void> {
  try {
    await SharedGroupPreferences.setItem(
      'widgetData',
      JSON.stringify(data),
      APP_GROUP,
    );
    // Optionally reload the widget timeline immediately:
    // WidgetKit.reloadAllTimelines(); // (requires native module)
  } catch (e) {
    console.warn('[widget] Failed to write widget data:', e);
  }
}
```

Call `updateWidgetData(...)` whenever your relevant data changes (e.g., after a user action or
on app foreground).

---

## Step 3 — Create the Widget Extension in Xcode

1. Open `ios/YourApp.xcworkspace` in Xcode.
2. **File → New → Target → Widget Extension**
3. Name it `YourAppWidget`. **Uncheck** "Include Configuration Intent" for a simple static widget.
4. In the **Signing & Capabilities** tab for both targets, add **App Groups** and enter your
   group ID: `group.com.yourname.yourapp`.

---

## Step 4 — Read Data in SwiftUI

```swift
// YourAppWidget.swift

import WidgetKit
import SwiftUI

// ── Data model (must match the JSON you write from RN) ────────────────────
struct WidgetData: Codable {
    var title: String
    var value: Int
    var updatedAt: String
}

// ── Timeline entry ─────────────────────────────────────────────────────────
struct SimpleEntry: TimelineEntry {
    let date: Date
    let data: WidgetData
}

// ── Provider ───────────────────────────────────────────────────────────────
struct Provider: TimelineProvider {
    let appGroup = "group.com.yourname.yourapp"

    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: .now, data: WidgetData(title: "–", value: 0, updatedAt: ""))
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> Void) {
        completion(SimpleEntry(date: .now, data: readData()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SimpleEntry>) -> Void) {
        let entry = SimpleEntry(date: .now, data: readData())
        // Refresh every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: .now)!
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }

    private func readData() -> WidgetData {
        guard
            let defaults = UserDefaults(suiteName: appGroup),
            let json = defaults.string(forKey: "widgetData"),
            let data = json.data(using: .utf8),
            let decoded = try? JSONDecoder().decode(WidgetData.self, from: data)
        else {
            return WidgetData(title: "No data", value: 0, updatedAt: "")
        }
        return decoded
    }
}

// ── Widget View ────────────────────────────────────────────────────────────
struct YourAppWidgetEntryView: View {
    var entry: Provider.Entry

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(entry.data.title)
                .font(.headline)
            Text("\(entry.data.value)")
                .font(.system(size: 40, weight: .bold))
                .foregroundColor(.blue)
        }
        .padding()
        .containerBackground(.background, for: .widget)
    }
}

// ── Widget configuration ────────────────────────────────────────────────────
@main
struct YourAppWidget: Widget {
    let kind = "YourAppWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            YourAppWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Your App")
        .description("Shows your latest data at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
```

---

## Step 5 — Add the Extension to EAS Build

In `eas.json`, add your widget target to the build profile:

```json
{
  "build": {
    "production": {
      "ios": {
        "bundleIdentifier": "com.yourname.yourapp",
        "targets": {
          "YourAppWidget": {
            "bundleIdentifier": "com.yourname.yourapp.widget"
          }
        }
      }
    }
  }
}
```

---

## Reloading the Widget Timeline Programmatically

If you want the widget to update immediately after the user takes an action (not wait for the
15-minute refresh), you can call the WidgetKit API from native Swift. Create a native module or
use [expo-modules-core](https://docs.expo.dev/modules/overview/) to expose a method:

```swift
// In your Expo module (Swift)
import WidgetKit

func reloadWidget() {
    WidgetCenter.shared.reloadAllTimelines()
}
```

Then call it from JS after updating the App Group data.

---

## Sizing Reference

| Family | Logical Size (points) |
|---|---|
| `.systemSmall` | 155 × 155 |
| `.systemMedium` | 329 × 155 |
| `.systemLarge` | 329 × 345 |
| `.systemExtraLarge` (iPad only) | 692 × 345 |

---

## Useful Resources

- [WidgetKit documentation](https://developer.apple.com/documentation/widgetkit)
- [App Groups entitlement](https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_security_application-groups)
- [Expo Modules Core](https://docs.expo.dev/modules/overview/) — for writing custom native modules
- [react-native-shared-group-preferences](https://github.com/KjellConnelly/react-native-shared-group-preferences)
