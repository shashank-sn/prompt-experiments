# prompt experiments

**test content strategies, not AI voices**

an open-source platform for systematically testing which content strategy performs best. compare variants side-by-side, learn what works, and stop guessing.

## why this exists

ai users constantly modify prompts trying to improve outputs. they create version 1, version 2, version 20. but they have no idea which version performs best, what changed between versions, or whether a modification improved results.

prompt experiments answers four questions:

1. which version performs best?
2. why does it perform best?
3. what changed from previous versions?
4. should i keep iterating or stop?

## hyv integration

every variant is processed through [hold your voice](https://github.com/holdyourvoice/hyv) before comparison. this strips ai patterns and ensures you're comparing content strategies — not random ai-voice lottery results. without hyv, comparing ai-generated variants is noise. with hyv, the comparison becomes meaningful.

if hyv is not installed, the tool works standalone — but variants won't be voice-matched.

```bash
npm i -g hyvoice
hyvoice init
```

## features

- **version tree**: fork prompts and track evolution like branches
- **side-by-side diff**: see exactly what changed between versions with git-style diffs
- **experiments**: test all versions against the same input simultaneously
- **human evaluation**: rank outputs (best, second, third) — results feed the leaderboard
- **leaderboard**: see which version wins most often
- **auto-generated variants**: create persuasive, concise, contrarian, storytelling, data-driven, and humorous variants automatically

## quick start

### docker (recommended)

```bash
docker compose up
```

open [http://localhost:3000](http://localhost:3000)

### local development

```bash
npm install
npm run dev
```

open [http://localhost:3000](http://localhost:3000)

## tech stack

- next.js 16 + typescript
- tailwind css v4
- sqlite (better-sqlite3) — zero config, single file
- docker support

## license

MIT
