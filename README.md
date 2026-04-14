# Neuro Check-in

A minimalist, neurodivergence-friendly check-in app for daily self-awareness.

Helps people with autism, ADHD, and high inner complexity capture inner states in a calm, clear, and non-overwhelming way. Inspired by IFS (Internal Family Systems) — not a therapy replacement. All data stays local, no account required.

## Tech Stack

- **React Native** + **Expo SDK 53** (file-based routing via Expo Router)
- **TypeScript** (strict mode)
- **expo-sqlite** (local-first, no backend)
- **expo-notifications** (daily reminder, exact alarm on Android 12+)
- **expo-mail-composer** (in-app feedback)

## Features

- **8-step guided check-in:** Arrival, energy, focus, body signals, feelings, thoughts, self-care, summary
- **Quick-select chips** for feelings and self-care (reduces Alexithymia barrier)
- **3 color palettes:** Warm Earth, Cool Mist, Soft Sage — all WCAG AA compliant
- **Spotlight tutorial** on first check-in (skippable, respects reduce-motion)
- **History:** Browse and review past check-ins with detail view
- **Onboarding:** 3-step intro with live palette preview, skippable
- **Daily reminder:** Configurable time, pressure-free notification copy
- **In-app feedback** via email with device info pre-filled
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

> **Note:** Expo Go is not fully supported since SDK 53.
> The app runs as a custom development build.
> Re-run `npx expo run:android` only when new native packages are added.

## Scripts

| Command | When |
|---------|------|
| `npx expo run:android` | After adding native packages (one-time) |
| `npx expo start` | Normal dev session |
| `npx expo start --android` | Dev session + open emulator |
| `npx expo lint` | Linting |
| `npx tsc --noEmit` | TypeScript check |
| `eas build --platform android` | Production APK/AAB |

## Status

**V1.0 Release Candidate** — device testing, specialist reviews, then tag `v1.0.0`.

### Completed
- Phase 0–3: Architecture, check-in flow, history, settings, accessibility baseline
- Phase 4: Device testing, bugfixes (B-01..B-12, R-01..R-05, N-01..N-03, C-01..C-04)
- V1.0 Sprint: Custom modals (S-07), App icon config (S-08), Exact alarm (S-09), In-app feedback (S-10), Spotlight tutorial (S-11)

### Next
- Specialist reviews: `/nd-ux` (Opus), `/review`, `/secure`, `/perf` (Sonnet)
- Final device test after rebuild
- App icon assets (1024×1024 PNG)
- `git tag v1.0.0`
