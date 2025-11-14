# Somnia On-Chain Guestbook 📝

> **A Hackathon Project for the Somnia Data Streams Mini Hackathon**

This project is a fully functional Web3 dApp that demonstrates the **"Write" pipeline** of the Somnia Data Streams (SDS) SDK. It allows users to permanently publish structured data to the Somnia Testnet.

It also serves as a technical investigation into the current state of the SDK, identifying a critical regression in the subscription architecture.

---

## 🎥 Demo & Links

- **📺 Github repo:** [https://github.com/Rokan0-0/realtime-guestbook]
- **📺 Demo Video:** [INSERT YOUR LOOM/YOUTUBE LINK HERE]



---

## ✨ Key Features

* **🔌 Wallet Connection:** Seamless integration with MetaMask on the Somnia Testnet (Chain ID: `50312`).
* **📜 Auto-Schema Registration:** Automatically detects if the Data & Event schemas are registered on-chain. If not, it prompts the user to register them via `sdk.streams.registerDataSchemas()`.
* **✍️ On-Chain Publishing:** Uses `sdk.streams.set()` to cryptographically sign and publish structured guestbook messages to the blockchain.
* **⚡ Session Feed:** Shows messages sent during the current session (messages are permanently stored on-chain, but reading them back requires SDK functionality that's currently unavailable).

---

## 🛠️ Technical Implementation

### How Somnia Data Streams (SDS) is Used

This project demonstrates the complete **"Write" pipeline** of the Somnia Data Streams SDK:

1. **Schema Registration**: Automatically registers data schemas on-chain using `sdk.streams.registerDataSchemas()`
2. **Data Encoding**: Uses `SchemaEncoder` to encode structured data into the SDS format
3. **On-Chain Publishing**: Uses `sdk.streams.set()` to permanently store data on Somnia Testnet
4. **Transaction Verification**: Returns transaction hashes for blockchain verification

**SDS Methods Used:**
- `sdk.streams.computeSchemaId()` - Computes schema ID from schema definition
- `sdk.streams.isDataSchemaRegistered()` - Checks schema registration status
- `sdk.streams.registerDataSchemas()` - Registers schemas on-chain
- `sdk.streams.registerEventSchemas()` - Registers event schemas for subscriptions
- `sdk.streams.set()` - **Primary method**: Writes data to the blockchain
- `sdk.streams.manageEventEmittersForRegisteredStreamsEvent()` - Manages event emitter permissions

**Note on Read Functionality:**
The SDK's read methods (`subscribe()` and `get()`) are currently unavailable or broken, so this implementation focuses on the fully functional write pipeline.

### 1. Schema Definition
We utilized a strictly typed schema to ensure compatibility with the SDS Encoder.
```typescript
// src/config.ts
export const GUESTBOOK_SCHEMA = `(string senderName, string messageContent, string timestamp)`;

---
### 2. The "Write" Workflow
The `handleSign` function in `Guestbook.tsx` performs the following steps:

1. Validation: Checks wallet connection and schema registration status.

2. Encoding: Uses `SchemaEncoder` to pack the payload into the required tuple format.

3. Hashing: Generates a unique `dataId` using `keccak256`.

4. Publishing: Calls `sdk.streams.set()` to write to the Somnia Testnet.

---
## 🐛 Ecosystem Contribution: SDK Bug Report & Limitations

### Issue 1: `subscribe()` Function Broken
While attempting to implement full real-time bidirectional streams, I discovered a critical bug in the current version of the SDK (`@somnia-chain/streams` v0.9.5).

**The Error:**
```plaintext
UrlRequiredError: No URL was provided to the Transport. 
Please provide a valid RPC URL to the Transport.
```

**Root Cause:**
The `subscribe()` function internally attempts to construct a new `publicClient` for WebSocket connections but fails to inherit the RPC URL or chain configuration passed to the main SDK instance. This results in a viem transport error that blocks all real-time subscriptions.

**Impact:** Real-time subscriptions are currently impossible with the SDK.

### Issue 2: Missing `get()` Method
The SDK does not provide a `get()` method for on-demand data retrieval. This means there's no way to read previously stored data from the chain.

**Impact:** Can only write to chain, cannot read back stored data.

### Workaround & Solution
To ensure a stable, working submission, I:
1. ✅ **Focused on the write pipeline** - Which works perfectly
2. ✅ **Implemented session-based feed** - Shows messages sent during current session
3. ✅ **Documented all issues** - Provided detailed bug reports for the Somnia team
4. ✅ **Maintained production quality** - Clean, typed, well-documented code

**Ecosystem Value:**
This project serves as both a working demonstration of the write pipeline AND a comprehensive bug report that will help improve the SDK for future developers.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MetaMask installed
- Somnia Testnet added to MetaMask (Chain ID: `50312`)
- STT Testnet tokens (from the [Somnia Faucet](https://faucet.somnia.network))

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Rokan0-0/realtime-guestbook.git
cd realtime-guestbook
```

2. **Install dependencies**
```bash
npm install
```

3. **Run the development server**
```bash
npm run dev
```

4. **Open in browser**
Navigate to `http://localhost:5173`

### Deployment

To deploy to production (Vercel/Netlify):
```bash
npm run build
# Deploy the 'dist' folder to your hosting provider
```

**Note:** The app is configured for Somnia Testnet and will work on any static hosting service.

## 📚 Tech Stack

- **Frontend:** React 19, Vite, TypeScript
- **Blockchain SDK:** Somnia Data Streams SDK (`@somnia-chain/streams` v0.9.5)
- **Web3 Libraries:** Viem 2.37
- **Styling:** CSS Modules
- **Network:** Somnia Testnet (Chain ID: 50312)

## 🎯 Project Status & Future Potential

### Current Status
✅ **Write Pipeline:** Fully functional - Messages are successfully published to Somnia Testnet  
✅ **Schema Management:** Automatic registration and validation  
✅ **Code Quality:** Production-ready, fully typed, well-documented  
✅ **Ecosystem Contribution:** Comprehensive SDK bug reports  

⚠️ **Read Pipeline:** Limited by SDK - No `get()` method, `subscribe()` broken

### Future Potential

Once the SDK's read functionality is fixed, this project can easily evolve into:

1. **Decentralized Social Platform** - Permanent, on-chain messaging
2. **Immutable Comment Systems** - For blogs, forums, or documentation
3. **On-Chain Guestbooks** - For events, websites, or communities
4. **Data Storage dApp Template** - Reusable pattern for other projects

The architecture is already in place - only the SDK needs to support reading data back.

## 📄 License

This project is open source and available for the Somnia community to learn from and build upon.