Somnia Real-Time Guestbook
A Hackathon Project by Rokan

This project is a functional "On-Chain Guestbook" dApp built for the Somnia Data Streams Mini Hackathon. It allows users to connect their Web3 wallet and permanently publish a message (as structured data) to the Somnia Testnet using the Somnia Data Streams (SDS) SDK.

This project successfully implements the full "Write" pipeline of the SDS SDK. It also serves as a technical deep-dive and bug report on the "Read" (subscribe) pipeline, identifying a critical bug in the current SDK version.

🚀 Live Demo & Video
Live dApp: [Link to your deployed Vercel/Netlify app]

Demo Video: [Link to your 3-5 minute YouTube/Loom video]

✨ Features
Wallet Connection: Connects to MetaMask on the Somnia Testnet (Chain ID: 50312).

On-Chain Schema Registration: Automatically checks and registers the GUESTBOOK_SCHEMA on-chain using sdk.streams.registerDataSchemas().

On-Chain Guestbook "Write": Users can sign and publish a message. This uses sdk.streams.set() to write structured, on-chain data.

Local Feed: The UI instantly displays messages you've sent during your current session.

🛠️ How to Run This Project Locally
Clone the repository:

Bash

git clone https://github.com/YourUsername/realtime-guestbook.git
cd realtime-guestbook
Install dependencies:

Bash

npm install
Run the development server:

Bash

npm run dev
Open the App:

Open http://localhost:5173 in your browser.

Ensure you have the Somnia Testnet added to your MetaMask.

Ensure your wallet is funded with STT tokens from the Somnia Faucet.

🔧 Technical Implementation
This project demonstrates a full mastery of the "Write" flow of the Somnia Data Streams SDK.

SDK Configuration: The SDK is initialized with an "All-in" configuration, providing the public (WebSocket), wallet, url, and chain properties to ensure all internal components are correctly configured.

Schema Definition: We define a simple, named-tuple schema for our guestbook messages:

(string senderName, string messageContent, string timestamp)
Schema Registration: On wallet connect, the app runs sdk.streams.computeSchemaId() and then sdk.streams.isDataSchemaRegistered(). If not registered, it prompts the user to send a transaction using sdk.streams.registerDataSchemas() to register it on-chain.

Writing Data (sdk.streams.set()): When a user signs, the app:

Creates a SchemaEncoder with the GUESTBOOK_SCHEMA.

Formats the payload into the highly specific array-of-tuple-objects format required by the encoder.

Uses sdk.streams.set() to publish the encoded data to the Somnia Testnet, receiving a transaction hash in return.

🐞 Challenge & SDK Bug Report: The "Read" Pipeline
A major goal of this project was to implement real-time updates using sdk.streams.subscribe(). However, during development, I discovered a critical, reproducible bug in the current SDK version that makes this function unusable.

The Bug: UrlRequiredError: No URL was provided to the Transport.

What is happening:

The sdk.streams.subscribe() function appears to ignore the publicClient, url, and chain configuration provided to the main SDK constructor.

Internally, it tries to create its own new publicClient to handle the WebSocket subscription.

Because this internal client is created without a url or chain object, it immediately throws a UrlRequiredError from viem, and the subscription fails.

This was isolated by successfully configuring the SDK to fix all other errors (like the websocket required error) and confirming that the UrlRequiredError is the final, un-passable blocker.

Conclusion: The "Write" (set) function works perfectly, but the "Read" (subscribe) function is currently non-functional due to this internal SDK regression.

🔮 Future Work
This project is perfectly positioned for its next step. As soon as the UrlRequiredError bug is patched in a future Somnia SDK release, the (already written) subscription code can be re-enabled to make this dApp fully real-time.