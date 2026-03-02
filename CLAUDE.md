# Catch a Culprit

## Overview

Interactive web-based investigation game where players review suspect profiles — financial metrics, behavioral analytics, and interrogation videos — to identify culprits. Built with React + TypeScript + Vite, backed by Supabase.

## Game Flow (5-Phase State Machine)

Driven by `GameState` in `src/app/App.tsx`:

1. **Landing** (`LandingPage.tsx`) — Welcome screen, "START THE GAME" button
2. **Reviewing** (`SuspectCard.tsx`) — Review each suspect's dossier: 6 metric charts, 3 summary stats, interrogation video, call summary, conclusion
3. **Selecting** (`SelectCulprit.tsx`) — Click suspects to accuse; correct = green border, wrong = red shake + grayscale
4. **Revealing** (`RevealCulprit.tsx`) — 3-second spinning reveal animation, shows reasoning and next steps
5. **Final** (`FinalScreen.tsx`) — Confetti, investigation report, comparative data table, Excel export, "Start Over"

## Tech Stack

- **Framework**: React 18.3.1, TypeScript
- **Build**: Vite 6.3.5
- **Styling**: Tailwind CSS 4.1.12, custom design tokens in `src/styles/theme.css`
- **UI components**: 60+ shadcn/ui (Radix UI) primitives in `src/app/components/ui/`
- **Animation**: `motion` (Framer Motion)
- **Charts**: Recharts (line charts for 3-month metric trends)
- **Database**: Supabase (PostgreSQL) — table `culprit_game`
- **Excel export**: `xlsx`
- **Confetti**: `canvas-confetti`
- **Icons**: Lucide React

## Project Structure

```
src/
├── main.tsx                          # React root render
├── styles/
│   ├── index.css                     # Imports fonts, tailwind, theme
│   ├── tailwind.css                  # Tailwind config
│   └── theme.css                     # Design tokens (colors, radii, typography)
└── app/
    ├── App.tsx                       # Central state manager (~129 lines)
    ├── components/
    │   ├── LandingPage.tsx           # Phase 1
    │   ├── SuspectCard.tsx           # Phase 2 (largest component)
    │   ├── SelectCulprit.tsx         # Phase 3
    │   ├── RevealCulprit.tsx         # Phase 4
    │   ├── FinalScreen.tsx           # Phase 5
    │   ├── figma/ImageWithFallback.tsx
    │   └── ui/                       # 60+ shadcn/ui primitives
    ├── data/mockData.ts              # Types, Supabase fetch, row mapping
    └── lib/supabase.ts               # Supabase client init
photos/                               # 13 static suspect images (~15 MB)
```

## Key Data Model

Defined in `src/app/data/mockData.ts`:

- **SuspectData**: `id`, `name`, `country`, `memberSince`, `bio`, `image`, `videoUrl`, `callSummary`, `conclusion`, `culprit` (boolean), photos for each game state, and 9 metric arrays (`paidAmount`, `influencersApproved`, `influencerSearch`, `influencerSearchShow`, `audienceData`, `pctClicksUnder05s`, `ipAddresses`, `timeSpent`, `consecutiveActions`)
- **MonthlyDataPoint**: `{ month: string; value: number }` — each metric has 3 data points (Dec, Jan, Feb)
- Data is fetched from Supabase via `fetchSuspects()` and transformed through `mapRowToSuspect()`

## Architecture Notes

- **State management**: Simple `useState` hooks in `App.tsx` — no Redux/Context
- **No routing**: Single-page app driven entirely by game state
- **No tests**: Zero test files or test runner dependencies
- **Supabase**: Uses a public anonymous key for read-only access

## How to Run

```bash
npm install
npm run dev      # Starts Vite dev server
npm run build    # Production build
```
