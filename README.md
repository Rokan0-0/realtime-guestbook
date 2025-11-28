# Somnia Real-Time Guestbook

> A Somnia Data Streams SDK submission that turns on-chain guestbook entries into a live experience with diagnostics, schema automation, and hackathon-ready polish.

---

## 🔗 Quick Links

| Resource | Link |
| --- | --- |
| Public Repo | https://github.com/Rokan0-0/realtime-guestbook |
| Live dApp | https://realtime-guestbook-5t7d.vercel.app/ |
| Demo Video (3–5 min) | `https://YOUR-VIDEO-LINK` *(add Loom/YouTube URL)* |
| Test Guide | [TESTING-GUIDE.md](./TESTING-GUIDE.md) |

---

## 🧠 What We Built

- **Write-first SDS demo:** Users connect MetaMask (Somnia Testnet, chain id `50312`), sign a message, and we encode + submit it on-chain through `sdk.streams.set`.
- **Self-healing setup:** The dApp automatically computes schema IDs, registers data + event schemas, and configures emitter permissions the moment a wallet connects.
- **Real-time UX:** A diagnostics panel shows live connection/schema status while a polling fallback keeps the feed updated when Somnia’s subscription helper fails.
- **Persistence stop-gap:** Messages persist across refreshes and every entry includes an explorer link so judges can verify the on-chain data.

---

## ⚙️ How SDS Is Used

| Step | SDS Call | Purpose |
| --- | --- | --- |
| Schema hashing | `sdk.streams.computeSchemaId` | Derive deterministic schema id from the tuple definition |
| Schema registration | `sdk.streams.registerDataSchemas` | Deploy the data schema if the user hasn’t already |
| Event schema registration | `sdk.streams.registerEventSchemas` | Register the event layout used for real-time feeds |
| Permissioning | `sdk.streams.manageEventEmittersForRegisteredStreamsEvent` | Authorize the connected wallet to emit events |
| Publishing | `sdk.streams.set` | Primary write path (guestbook entries) |
| Diagnostics | `sdk.streams.isDataSchemaRegistered`, `sdk.streams.getEventSchemasById` | Populate the status panel + retry flow |

```ts
// src/config.ts
export const GUESTBOOK_SCHEMA = `(address author, string message, uint64 timestamp)`;
```

### Real-Time Strategy

1. **Attempt native subscribe**: We spin up a read-only SDK instance to call `streams.subscribe`. If it works, we push live updates into React state.
2. **Fallback polling**: When subscribe fails (known UrlRequiredError), we poll the RPC every 10s and surface block-height + timestamp in the diagnostics panel.
3. **Optimistic feed**: After `sdk.streams.set` resolves, the UI updates immediately while linking to Shannon Explorer for on-chain validation.

---

## 🧪 Local Development

### Prerequisites

- Node.js ≥ 18
- MetaMask with Somnia Testnet added (Chain ID `50312`)
- STT test tokens (https://faucet.somnia.network)

### Install & Run

```bash
git clone https://github.com/Rokan0-0/realtime-guestbook.git
cd realtime-guestbook
npm install
npm run dev
# open http://localhost:5173
```

### Production build

```bash
npm run build
npm run preview   # optional sanity check
```

### Deployment (Vercel)

The repo ships with `vercel.json`. When importing into Vercel choose the **Vite** preset—build command `npm run build`, output `dist/`. The app requires no server-side secrets.

---

## 🧭 Testing Checklist

See [TESTING-GUIDE.md](./TESTING-GUIDE.md) for a detailed flow covering:

- Wallet onboarding
- Schema/event/emitter retries
- Message persistence & explorer verification
- Diagnostics copy + error reproduction steps

---

## ✅ Hackathon Criteria Mapping

| Criterion | How We Address It |
| --- | --- |
| **Technical Excellence** | Typed React + Vite app, CI-ready build, diagnostics panel, schema auto-healing, optimistic UI, explorer links |
| **Real-Time UX** | Attempts native `subscribe`, falls back to polling with live block height + timestamp, highlights status via badges |
| **Somnia Integration** | Everything runs on Somnia Testnet (`@somnia-chain/streams` v0.9.5); schema + event definitions deployed via SDK and verifiable on Shannon Explorer |
| **Potential Impact** | Can evolve into on-chain comments or social feeds once read APIs are unlocked; diagnostics doubles as a bug report pipeline for Somnia core team |

---

## ⚠️ Known Limitations & Future Work

1. **Cross-session reads** – A public API or contract address is needed to pull historical entries (`getLogs`). Until Somnia exposes that, we mirror data in localStorage for demo stability.
2. **SDK subscribe bug** – Documented `UrlRequiredError` prevents native WebSocket streaming. We built a polling fallback plus diagnostics so the issue is easy to triage.
3. **Event explorer deep links** – We currently link to transaction hashes. Once Somnia exposes event filtering, the feed can become fully trustless/read-only.

---

## 📄 License

MIT – free for the Somnia community to extend, fork, or integrate into other ecosystem projects.