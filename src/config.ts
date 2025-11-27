// src/config.ts
import { defineChain } from 'viem';

export const somniaTestnet = defineChain({
  id: 50312,
  name: 'Somnia Testnet',
  nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://dream-rpc.somnia.network'],
      ws: ['wss://dream-rpc.somnia.network/ws'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Shannon Explorer',
      url: 'https://shannon-explorer.somnia.network',
    },
  },
});

export const GUESTBOOK_SCHEMA = `(address author, string message, uint64 timestamp)`;

// 2. Define our unique Schema ID (human-readable identifier for registration)
export const GUESTBOOK_SCHEMA_ID = 'GUESTBOOK_SCHEMA_V2_FINAL'; // <-- Changed to avoid conflicts

// 3. Define our unique Event ID
export const GUESTBOOK_EVENT_ID = 'GLOBAL_GUESTBOOK_UPDATE_V2_FINAL'; // <-- Changed to avoid conflicts

// 4. Event schema definition (used for registration & decoding)
export const GUESTBOOK_EVENT_SIGNATURE = 'GuestbookSigned(address,string,uint64)';
export const GUESTBOOK_EVENT_PARAMS = [
  { name: 'author', paramType: 'address', isIndexed: true }, // <-- Indexed for filtering
  { name: 'message', paramType: 'string', isIndexed: false },
  { name: 'timestamp', paramType: 'uint64', isIndexed: false },
];