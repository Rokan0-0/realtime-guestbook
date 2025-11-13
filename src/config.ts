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

// 1. THE FIX: A single, unified, NAMED tuple schema
// We will use this for computeSchemaId AND SchemaEncoder
export const GUESTBOOK_SCHEMA = `(string senderName, string messageContent, string timestamp)`;

// 2. Define our unique Schema ID (human-readable identifier for registration)
export const GUESTBOOK_SCHEMA_ID = 'GUESTBOOK_SCHEMA_V1';

// 3. Define our unique Event ID
export const GUESTBOOK_EVENT_ID = 'GLOBAL_GUESTBOOK_UPDATE_V1';

// 4. Event schema definition (used for registration & decoding)
export const GUESTBOOK_EVENT_SIGNATURE = 'GuestbookSigned(string,string,string)';
export const GUESTBOOK_EVENT_PARAMS = [
  { name: 'senderName', paramType: 'string', isIndexed: false },
  { name: 'messageContent', paramType: 'string', isIndexed: false },
  { name: 'timestamp', paramType: 'string', isIndexed: false },
];