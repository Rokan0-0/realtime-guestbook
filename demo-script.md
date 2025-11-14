# Demo Video Script for Somnia On-Chain Guestbook
**Target Length: 3-5 minutes**

---

## 🎬 Opening (0:00 - 0:30)

**[Screen: Show the deployed app]**

"Hi! I'm [Your Name], and this is my submission for the Somnia Data Streams Mini Hackathon.

Today I'm going to show you a fully functional Web3 guestbook dApp that uses Somnia Data Streams to permanently store messages on the blockchain.

Let me walk you through what I built and how it works."

---

## 📱 Part 1: Live Demo - Wallet Connection (0:30 - 1:30)

**[Screen: Show the app, click "Connect Wallet"]**

"First, let's connect a MetaMask wallet. The app automatically detects if you're on Somnia Testnet and prompts you to switch if needed.

[Click Connect Wallet]

Notice how the app automatically:
- Detects if the data schema is registered
- Registers it if needed (you'll see a MetaMask transaction)
- Sets up event emitter permissions

This all happens seamlessly in the background."

**[Screen: Show MetaMask popup, approve if needed]**

"Once connected, the app is ready to publish data to the Somnia blockchain."

---

## ✍️ Part 2: Writing Data to the Chain (1:30 - 2:30)

**[Screen: Fill in the form]**

"Now let's write a message to the blockchain. I'll enter my name and a message.

[Type name: "Demo User"]
[Type message: "Hello from the Somnia Hackathon!"]

[Click "Sign & Publish"]

**[Screen: Show MetaMask transaction popup]**

"You'll see a MetaMask transaction. This is the actual blockchain transaction that will permanently store this data on Somnia Testnet.

[Approve transaction]

**[Screen: Show transaction hash in console or UI]**

"Perfect! The transaction was successful. You can see the transaction hash here. This message is now permanently stored on the Somnia blockchain.

The app uses `sdk.streams.set()` to:
1. Encode the data using SchemaEncoder
2. Generate a unique data ID
3. Publish it to the chain with cryptographic signing"

**[Screen: Show message appearing in feed]**

"And you can see the message immediately appears in the session feed."

---

## 🔍 Part 3: Technical Deep Dive (2:30 - 3:30)

**[Screen: Show code or architecture diagram]**

"Let me explain the technical implementation:

**Schema Definition:**
The app uses a typed schema: `(string senderName, string messageContent, string timestamp)`

**Write Workflow:**
1. Validates wallet connection and schema registration
2. Encodes the payload using SchemaEncoder
3. Generates a unique dataId using keccak256
4. Calls `sdk.streams.set()` to write to Somnia Testnet

**What makes this special:**
- Fully on-chain data storage
- Automatic schema registration
- Type-safe encoding/decoding
- Real blockchain transactions"

---

## 🐛 Part 4: SDK Bug Discovery & Ecosystem Contribution (3:30 - 4:30)

**[Screen: Show error logs or explain]**

"During development, I discovered a critical bug in the SDK that I want to highlight:

**The Issue:**
- `sdk.streams.subscribe()` throws a `UrlRequiredError`
- The SDK doesn't have a `get()` method for reading data
- This prevents real-time subscriptions and on-demand reads

**My Investigation:**
The subscribe function fails to inherit the RPC URL configuration from the main SDK instance, causing a viem transport error.

**Impact:**
While the write pipeline works perfectly, I had to pivot to a session-based feed since reading from the chain isn't possible with the current SDK version.

**Ecosystem Contribution:**
I've documented this issue thoroughly in the README and code comments, providing the Somnia team with:
- Exact error messages
- Root cause analysis
- Reproduction steps
- Impact assessment

This bug report will help improve the SDK for future developers."

---

## 🎯 Part 5: Closing & Future Potential (4:30 - 5:00)

**[Screen: Show the working app one more time]**

"To summarize what I built:

✅ **Fully functional write pipeline** - Messages are successfully published to Somnia Testnet
✅ **Automatic schema management** - Seamless user experience
✅ **Production-ready code** - Clean, typed, well-documented
✅ **Ecosystem contribution** - Detailed bug report for SDK improvements

**Future Potential:**
Once the SDK's read functionality is fixed, this could easily evolve into:
- A fully decentralized social platform
- On-chain comment systems
- Immutable message boards
- Any application requiring permanent data storage

**Links:**
- GitHub: https://github.com/Rokan0-0/realtime-guestbook
- [Live Demo: INSERT YOUR DEPLOYMENT LINK]

Thank you for watching! The code is open source and ready for the Somnia team to review."

---

## 🎥 Production Tips

### What to Show:
1. ✅ **Wallet connection flow** - Show the seamless UX
2. ✅ **Transaction in MetaMask** - Prove it's real blockchain interaction
3. ✅ **Transaction hash** - Show it's actually on-chain
4. ✅ **Code snippets** - Show technical depth (optional)
5. ✅ **Console logs** - Show the SDK calls working
6. ✅ **Multiple messages** - Show it works repeatedly

### What to Emphasize:
- ✅ **Write functionality works perfectly**
- ✅ **Real blockchain transactions**
- ✅ **Professional code quality**
- ✅ **Ecosystem contribution (bug report)**
- ✅ **Clear documentation of limitations**

### What NOT to Show:
- ❌ Don't try to show reading from chain (it doesn't work)
- ❌ Don't hide the limitations (be transparent)
- ❌ Don't make it seem like it's fully real-time (it's session-based)

### Screen Recording Tips:
1. Use a clean browser window (hide bookmarks)
2. Show MetaMask popups clearly
3. Zoom in on transaction hashes
4. Show console logs if demonstrating technical details
5. Use smooth transitions between sections

---

## 📝 Key Talking Points

**Strengths to Highlight:**
- "Fully functional write pipeline"
- "Real blockchain transactions on Somnia Testnet"
- "Automatic schema registration"
- "Production-ready code"
- "Ecosystem contribution through bug reporting"

**Honest About Limitations:**
- "Session-based feed due to SDK limitations"
- "Read functionality not available in current SDK version"
- "Once SDK is fixed, full real-time functionality is ready"

**Technical Depth:**
- "Uses SchemaEncoder for type-safe encoding"
- "Generates unique dataIds using keccak256"
- "Properly configured for Somnia Testnet (Chain ID: 50312)"

