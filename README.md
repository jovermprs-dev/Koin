# Koin 💰

Personal finance tracker built with React Native & Expo. Track your income and expenses, set monthly budgets, and visualize your spending habits — all from your phone.

---

## Screenshots

> _Coming soon_

---

## Features

- **Transaction tracking** — log income and expenses with category and notes
- **Monthly summary** — instant overview of your balance, income and spending
- **Budget control** — set limits per category and get alerted when you exceed them
- **Charts & stats** — visualize spending by category and monthly trends
- **Offline-first** — everything works without internet, syncs to the cloud when available
- **Authentication** — secure login with email and password via Supabase

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo |
| Navigation | Expo Router v3 |
| Language | TypeScript |
| Local database | expo-sqlite |
| Backend & auth | Supabase |
| Charts | Gifted Charts |
| Animations | React Native Reanimated |

---

## Getting started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your phone, or an iOS/Android simulator

### Installation

```bash
# Clone the repository
git clone https://github.com/jovermprs-dev/koin.git
cd koin

# Install dependencies
npm install

# Start the development server
npx expo start
```

Scan the QR code with Expo Go on your phone, or press `i` for iOS simulator / `a` for Android.

### Environment variables

Create a `.env.local` file in the root of the project:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

### Demo mode (no backend)

Set `EXPO_PUBLIC_DEMO=true` to build a public demo of the web app: no login, no Supabase client and no network
requests. It loads six months of fictional transactions and budgets (`lib/demoData.ts`) into the in-memory cache the
web build already uses. Visitors can add or delete entries to try the app, but every change only lives in their
browser's memory and is gone on reload, so there is no database to keep alive or attack. The Supabase variables are not
needed (and are deliberately never baked into a demo bundle). Off by default; the Android app is unaffected.

```bash
EXPO_PUBLIC_DEMO=true npx expo export --platform web   # or: EXPO_PUBLIC_DEMO=true docker compose up -d --build
```

---

## Project structure

```
koin/
├── app/                  # Expo Router — each file is a route
│   ├── (tabs)/
│   │   ├── _layout.tsx   # Tab bar configuration
│   │   ├── index.tsx     # Home — monthly summary
│   │   ├── gastos.tsx    # Transaction list
│   │   └── agregar.tsx   # Add transaction form
│   └── _layout.tsx       # Root layout
├── db/
│   └── database.ts       # SQLite setup and queries
├── lib/                  # Shared utilities and helpers
└── assets/               # Icons and images
```

---

## Roadmap

- [x] Project setup and navigation
- [x] Transaction CRUD
- [x] Monthly summary screen
- [x] Budget management
- [x] Charts and statistics
- [x] Supabase auth and sync
- [x] Dark mode
- [ ] Production build

---

## License

MIT
