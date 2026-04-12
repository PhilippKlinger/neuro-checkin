# Neuro Check-in

A minimalist, neurodivergence-friendly check-in app for daily self-awareness.

Helps people with autism, ADHD, and high inner complexity capture inner states in a calm, clear, and non-overwhelming way. Inspired by IFS (Internal Family Systems) — not a therapy replacement.

## Tech Stack

- **React Native** + **Expo** (Managed Workflow)
- **TypeScript** (strict mode)
- **Expo Router** (file-based navigation)
- **expo-sqlite** (local-first data storage)

## Setup

```bash
# Install dependencies
npm install

# Einmaliger nativer Build (erforderlich nach Installation nativer Module)
# Emulator muss vorher in Android Studio gestartet sein
npx expo run:android

# Danach fuer alle weiteren Sessions nur noch:
npx expo start
```

> **Wichtig:** Seit SDK 53 wird Expo Go nicht mehr vollstaendig unterstuetzt.
> Die App laeuft als eigener Development Build auf dem Emulator/Geraet.
> `npx expo run:android` nur erneut ausfuehren wenn neue native Packages hinzukommen.

## Scripts

| Command | Wann |
|---------|------|
| `npx expo run:android` | Einmalig nach neuen nativen Packages |
| `npx expo start` | Normaler Session-Start (danach) |
| `npx expo start --android` | Session-Start + Emulator direkt oeffnen |
| `npx expo lint` | Linting |
| `npx tsc --noEmit` | TypeScript Check |
| `eas build --platform android` | Production Build |

## Status

Phase 3 abgeschlossen — Phase 4: Testing & Hardening.
