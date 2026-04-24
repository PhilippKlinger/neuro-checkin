# Neuro Check-in

A minimalist, neurodivergence-friendly check-in app for daily self-awareness.

Helps people with autism, ADHD, and high inner complexity capture inner states in a calm, clear, and non-overwhelming way. Inspired by IFS (Internal Family Systems) — not a therapy replacement. All data stays local, no account required.

## Tech Stack

- **React Native** + **Expo SDK 54** (file-based routing via Expo Router)
- **TypeScript** (strict mode)
- **expo-sqlite** (local-first, Schema V4)
- **expo-notifications** (smart multi-slot weekly reminders, exact alarm on Android 12+)
- **@sentry/react-native** (crash reporting, EU-hosted, health data filtered)
- **Formspree** (anonymous in-app feedback form)

## Features

- **8-step guided check-in:** Arrival, energy, focus, body signals, feelings, thoughts, self-care, summary
- **Quick check-in:** 3-step shortcut (energy + focus + feelings) for when it needs to be fast
- **Quick-select chips** for feelings and self-care (reduces Alexithymia barrier)
- **'Was ist ein Check-in?' info screen** for first-time users, always accessible via header icon
- **3 color palettes:** Warm Earth, Cool Mist, Soft Sage — all WCAG AA compliant
- **History:** Browse and review past check-ins with detail view
- **Onboarding:** 3-step intro with live palette preview, skippable
- **Smart reminders:** 2 configurable slots (morning/evening), weekly schedule with weekday selection
- **In-app feedback form** (anonymous, via Formspree)
- **Crash reporting** via Sentry (EU-hosted, no health data transmitted)
- **Accessibility:** Screen reader support (TalkBack/VoiceOver), focus management, semantic roles, 44×44 touch targets, reduced motion support
- **Local-first:** All data on device, SQLite, no account, no tracking

## Setup

```bash
# Install dependencies
npm install

# First-time native build (required; emulator/device must be running)
npx expo run:android

# All subsequent sessions
npx expo start
```

> **Note:** Expo Go is not fully supported since SDK 54.
> The app runs as a custom development build.
> Re-run `npx expo run:android` only when new native packages are added.

## Scripts

| Command | When |
|---------|------|
| `npx expo run:android` | After adding native packages (one-time) |
| `npx expo start` | Normal dev session |
| `npx expo start --android` | Dev session + open emulator |
| `eas build --platform android` | Production APK/AAB (EAS cloud) |
| `eas build --local --profile preview` | Local build via WSL2 |

## CI

GitHub Actions runs on every push and PR to `main`:
`npm ci` → `npm audit --audit-level=high` → `npx expo lint` → `npx tsc --noEmit`

Branch protection enforces all checks before merge.
