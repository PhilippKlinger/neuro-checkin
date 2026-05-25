# Neuro Check-in

![Version](https://img.shields.io/badge/version-1.5.8-6C4FF0?logo=github&logoColor=white)
![Expo SDK](https://img.shields.io/badge/Expo-SDK%2054-4630EB?logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-Android-3DDC84?logo=android&logoColor=white)
![CI](https://img.shields.io/github/actions/workflow/status/PhilippKlinger/neuro-checkin/ci.yml?label=CI)

A minimalist, neurodivergence-friendly check-in app for daily self-awareness — built with React Native and Expo.

Designed for people with autism, ADHD, or high inner complexity who need a calm, low-pressure way to notice how they are doing right now. No account, no ads, no behavioral tracking. Check-in contents stay on your device. Crash reports (Sentry) and optional feedback (Formspree) are handled as described in the [privacy policy](https://neurocheckin.de/datenschutz).

---

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Prerequisites](#prerequisites)
- [Quickstart](#quickstart)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Tests](#tests)
- [Security Notes](#security-notes)
- [Status](#status)
- [Product Principles](#product-principles)
- [License](#license)

---

## Features

- **Guided 9-step check-in** — body signals, energy, focus, feelings, self-care, thoughts, distress level, and a free-form note; every step is optional
- **Quick check-in** — a condensed 3-step flow for low-energy moments
- **Check-in history** — full log with detail view and chronological summary
- **PDF export** — share individual or multiple check-ins as formatted PDF reports (e.g., for therapy appointments)
- **Guided mode** — inline contextual hints per step, toggleable without leaving the flow
- **User-defined chips** — add personal labels to the feelings and self-care steps
- **Fully offline** — all data stored on-device via SQLite, no account required
- **Dark mode** — three palette options (Calm / Warm / Sage) in light and dark variants
- **Accessible** — WCAG AA contrast, 44 px touch targets, screen-reader labels, reduced-motion support throughout
- **Neurodivergence-first UX** — no streaks, no gamification, no pressure language; alexithymia-safe "can't say" options on every emotional step

---

## Screenshots

> Screenshots will be added before the public release.

---

## Prerequisites

| Requirement                         | Version                           |
| ----------------------------------- | --------------------------------- |
| Node.js                             | 18 or later                       |
| EAS CLI                             | latest (`npm install -g eas-cli`) |
| Android emulator or physical device | API 26+                           |

The app runs as a custom development build. Expo Go is not supported.

---

## Quickstart

Clone the repository and enter the project folder.

```bash
git clone git@github.com:PhilippKlinger/neuro-checkin.git
cd neuro-checkin
```

Install dependencies.

```bash
npm install
```

Create a local environment file.

```bash
cp .env.example .env
```

Open `.env` and fill in the values. See [Environment Variables](#environment-variables) for details.

Create the native development build. The emulator or a connected device must be running.

```bash
npx expo run:android
```

This step is only required once — or after adding new native packages. For all subsequent development sessions, use the dev server directly.

```bash
npx expo start
```

---

## Project Structure

```
app/                   Screens and routes (Expo Router, file-based)
components/
  check-in/            Steps and UI for the guided check-in flow
  history/             History list and detail components
  settings/            Settings sections (appearance, notifications, data)
  ui/                  Shared primitives (ConfirmDialog, FadeView, ...)
lib/
  constants/           Design tokens, app config
  database/            SQLite service layer (queries, schema, migrations)
  hooks/               Custom hooks (useTheme, useDatabase, useReducedMotion)
  notifications/       Notification scheduling and permission handling
  observability/       Sentry integration with privacy-safe PII scrubber
  types/               Shared TypeScript interfaces
  utils/               Helper functions (format, chips, time)
assets/                Icons, splash screen
```

The database schema is versioned. Migrations run automatically on app start and are idempotent.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values.

```bash
cp .env.example .env
```

| Variable        | Purpose                                         |
| --------------- | ----------------------------------------------- |
| `SENTRY_DSN`    | Sentry project DSN for crash reporting          |
| `FORMSPREE_URL` | Formspree endpoint for the in-app feedback form |

Values are read at build time via `app.config.js` and injected into the bundle through the Expo `extra` field. For EAS builds, set them as EAS Secrets.

```bash
eas secret:create --name SENTRY_DSN --value "your-dsn"
eas secret:create --name FORMSPREE_URL --value "your-url"
```

---

## Scripts

| Command                               | When to use                                      |
| ------------------------------------- | ------------------------------------------------ |
| `npx expo run:android`                | First-time build or after adding native packages |
| `npx expo start`                      | Normal development session                       |
| `npx expo start --android`            | Development session and open emulator            |
| `npm test`                            | Run the full Jest test suite                     |
| `npx expo lint`                       | ESLint check (also runs in CI)                   |
| `npx tsc --noEmit`                    | TypeScript type check (also runs in CI)          |
| `eas build --platform android`        | Production build via EAS cloud                   |
| `eas build --local --profile preview` | Local preview build via WSL2                     |

---

## Tests

The project uses Jest with jest-expo. Tests cover the logic layer (`lib/database/`, `lib/utils/`, `lib/types/`) with a focus on pure functions and database queries.

```bash
npm test
```

CI runs lint, type checks, and the full test suite on every push and pull request.

---

## Security Notes

- Do not commit real `.env` files. The `.gitignore` covers all `.env` variants.
- Sentry is configured with a recursive `beforeSend` scrubber that strips all health-related fields from event payloads, contexts, and breadcrumbs before transmission — at any nesting depth. The scrubber is implemented in `lib/observability/sentry.ts` and covered by unit tests.
- Sentry is disabled in development (`enabled: !__DEV__`).
- All SQLite queries use parameterised statements. No string concatenation with user input.

---

## Status

Neuro Check-in is at **v1.5.9** and preparing for public release on Google Play.

Screenshots will be added before the public release.

---

## Product Principles

- Low cognitive load: few decisions per screen, calm flows, no dashboard overload.
- No streaks, points, rewards, or pressure language.
- Local-first data storage: check-ins stay on the device.
- Accessibility and neurodivergence-friendly UX from the start.
- The app is a self-awareness tool, not a diagnosis tool or therapy replacement.

---

## License

This repository is publicly visible for portfolio, transparency, and review purposes.
The code, branding, copy, assets, product strategy, and documentation may not be reused without written permission.

See [LICENSE](LICENSE).
