# Neuro Check-in

A minimalist, neurodivergence-friendly check-in app for daily self-awareness.

Helps people with autism, ADHD, and high inner complexity capture inner states in a calm, clear, and non-overwhelming way. Inspired by IFS (Internal Family Systems) — not a therapy replacement.

## Tech Stack

- **React Native** + **Expo** (Managed Workflow)
- **TypeScript** (strict mode)
- **Expo Router** (file-based navigation)
- **expo-sqlite** (local-first data storage)

## Features

- **8-step guided check-in:** Arrival, energy, focus, body signals, feelings, thoughts, self-care, summary
- **3 color palettes:** Warm Earth, Cool Mist, Soft Sage — all WCAG AA compliant
- **History:** Browse and review past check-ins with detail view
- **Onboarding:** 3-step intro, skippable
- **Accessibility:** Screen reader support, focus management, semantic roles, 44x44 touch targets
- **Local-first:** All data stays on device, no account required

## Setup

```bash
# Install dependencies
npm install

# Start dev server
npx expo start
```

## Scripts

| Command | Description |
|---------|-------------|
| `npx expo start` | Start Expo dev server |
| `npx expo start --android` | Start with Android emulator |
| `npx expo start --ios` | Start with iOS simulator |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript strict check |
| `npm run format` | Prettier formatting |

## Status

Active development — Phase 3 (Polish & Interactivity).
