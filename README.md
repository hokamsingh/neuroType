# neuroType

A fast, minimal typing trainer that maps keys to fingers and builds muscle memory through progressive drills.

![Svelte](https://img.shields.io/badge/built_with-Svelte-FF3E00?style=flat&logo=svelte) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)

Built by [hokamsingh](https://github.com/hokamsingh)

## Features

- **9 progressive layers** — home row → full keyboard → free flow
- **Chess rank system** — Pawn → Grandmaster based on WPM + accuracy
- **Per-key & per-finger analytics** — tracks error rates, surfaces weak spots
- **Ghost run** — race your personal best
- **Speed Burst mode** — high-intensity timed drills
- **Multiplayer Race** — compete against bots at varying speeds
- **Streak tracking** — daily play streaks and session history
- **Achievements** — 20+ unlockable milestones
- **10 animated fluid backgrounds** — aurora, metal, topo, silk, blobs, wireframe, smoke, grain, particles, fog
- **Dark / light theme** — pure monochrome, no colour noise
- **Blind mode** — hide keyboard map for pure neural recall

## Layers

| # | Name | Keys |
|---|------|------|
| 0 | Home Base | F, D (left index + middle) |
| 1 | Home Row | A S D F J K L ; |
| 2 | Left Hand Rise | Q W E R T |
| 3 | Right Hand Rise | Y U I O P |
| 4 | Cross Fire | Both hands across top row |
| 5 | Under Pressure | Z X C V B N M , . / |
| 6 | Word Patterns | Common bigrams and trigrams |
| 7 | Free Flow | Real words, full speed |
| 8 | Anchor Return | Reach and return, fingers stay home |

## Tech Stack

- **Svelte + TypeScript** — component framework
- **Vite** — build tool
- **Web Audio API** — sound effects and metronome
- **Canvas API** — particle flow field background
- **localStorage** — all progress persisted locally, no backend needed

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173`

## Build

```bash
npm run build
```

Output in `dist/` — deploy anywhere static files are served.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Select layer / start |
| `Space` | Start drill |
| `Tab` | Cycle layers |
| `Escape` | Back / home |

## Settings

| Setting | Description |
|---------|-------------|
| Sound effects | Key clicks, streak sounds, rank-up ceremony |
| Metronome | Audible beat for rhythm training |
| Anchor hints | Show home row finger positions |
| Blind mode | Hide keyboard map |
| Theme | Dark / light |
| Background | 10 animated variants, works in any theme |
