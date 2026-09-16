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
