// src/context/SomniaContext.tsx
import { createContext, useContext, useState, type ReactNode } from 'react';
import { SDK } from '@somnia-chain/streams';
import { 
  createWalletClient, 
  createPublicClient, 
  custom, 
  webSocket,
  getAddress,
  type WalletClient, 
  type PublicClient,
  type Address,
  type Hex,
  type EIP1193Provider,
} from 'viem';
import { parseAccount } from 'viem/accounts';
// 1. THE FIX: Import the single schema
import { somniaTestnet, GUESTBOOK_SCHEMA, GUESTBOOK_SCHEMA_ID, GUESTBOOK_EVENT_ID, GUESTBOOK_EVENT_SIGNATURE, GUESTBOOK_EVENT_PARAMS } from '../config'; 

// ... (Context definition is the same) ...
interface SomniaContextType {
  sdk: SDK | null;
  account: Address | null;
  schemaId: Hex | null;
  connectWallet: () => Promise<void>;
}
const SomniaContext = createContext<SomniaContextType | undefined>(undefined);
// ... (End of unchanged part) ...

export const SomniaProvider = ({ children }: { children: ReactNode }) => {
  const [sdk, setSdk] = useState<SDK | null>(null);
  const [account, setAccount] = useState<Address | null>(null);
  const [schemaId, setSchemaId] = useState<Hex | null>(null);

  const connectWallet = async () => {
    const ethereum = (window as typeof window & { ethereum?: EIP1193Provider }).ethereum;
    if (!ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    try {
      const wsUrl = somniaTestnet.rpcUrls.default.ws[0];

      const publicClient = createPublicClient({
        chain: somniaTestnet,
        transport: webSocket(wsUrl), 
      });

      // Request addresses first to get the account
      const tempWalletClient = createWalletClient({
        chain: somniaTestnet,
        transport: custom(ethereum),
      });
      
      const [address] = await tempWalletClient.requestAddresses();
      const normalizedAddress = getAddress(address); // Ensure proper checksum format
      setAccount(normalizedAddress);

      // Create account object for the wallet client
      const account = parseAccount(normalizedAddress);

      // Create wallet client with account explicitly set
      const walletClient = createWalletClient({
        account: account,
        chain: somniaTestnet,
        transport: custom(ethereum),
      });

      const somniaSdk = new SDK({
        public: publicClient as PublicClient,
        wallet: walletClient as WalletClient,
      });
      setSdk(somniaSdk);
      console.log('Wallet Connected:', address);
      console.log('SDK Initialized (All-in Config)');

      // 2. THE FIX: Compute and register the schema
      console.log('Computing Schema ID...');
      const computedSchemaId = await somniaSdk.streams.computeSchemaId(GUESTBOOK_SCHEMA);
      if (!computedSchemaId) {
        throw new Error('Failed to compute schema ID');
      }
      setSchemaId(computedSchemaId);
      console.log('Schema ID Computed:', computedSchemaId);

      // 3. Register the schema if not already registered
      console.log('Checking if schema is registered...');
      const isRegistered = await somniaSdk.streams.isDataSchemaRegistered(computedSchemaId);
      console.log('Schema registration status:', isRegistered);
      
      if (!isRegistered) {
        console.log('Schema not registered. Registering now...');
        console.log('You will need to approve a transaction in MetaMask to register the schema.');
        const regResult = await somniaSdk.streams.registerDataSchemas([
          {
            id: GUESTBOOK_SCHEMA_ID,
            schema: GUESTBOOK_SCHEMA,
          }
        ], true); // ignoreRegisteredSchemas = true to avoid errors if already registered
        
        if (regResult instanceof Error) {
          console.error('Failed to register schema:', regResult);
          alert(`Schema registration failed: ${regResult.message}. Please try reconnecting your wallet.`);
        } else if (regResult) {
          console.log('Schema registered successfully! TxHash:', regResult);
          alert(`Schema registration transaction submitted! TxHash: ${regResult}\n\nPlease wait for the transaction to be confirmed before sending messages.`);
        } else {
          console.log('Schema registration returned null (may already be registered or transaction was rejected)');
        }
      } else {
        console.log('Schema is already registered. Ready to publish data!');
      }

      // 4. Register the event schema (needed for subscriptions / emit events)
      console.log('Checking if event schema is registered...');
      let isEventRegistered = false;
      try {
        const existingEventSchemas = await somniaSdk.streams.getEventSchemasById([GUESTBOOK_EVENT_ID]);
        isEventRegistered = Array.isArray(existingEventSchemas) && existingEventSchemas.length > 0;
      } catch (eventLookupError: unknown) {
        console.warn('Unable to lookup event schema:', eventLookupError);
      }

      if (!isEventRegistered) {
        console.log('Event schema not registered. Registering now...');
        console.log('You will need to approve a transaction in MetaMask to register the event schema.');
        const eventRegResult = await somniaSdk.streams.registerEventSchemas(
          [GUESTBOOK_EVENT_ID],
          [
            {
              params: GUESTBOOK_EVENT_PARAMS,
              eventTopic: GUESTBOOK_EVENT_SIGNATURE,
            },
          ]
        );

        if (eventRegResult instanceof Error) {
          console.error('Failed to register event schema:', eventRegResult);
          alert(`Event schema registration failed: ${eventRegResult.message}. Please try reconnecting your wallet.`);
        } else if (eventRegResult) {
          console.log('Event schema registered successfully! TxHash:', eventRegResult);
          alert(`Event schema registration transaction submitted! TxHash: ${eventRegResult}\n\nPlease wait for the transaction to be confirmed before sending messages.`);
        } else {
          console.log('Event schema registration returned null (may already be registered or transaction was rejected).');
        }
      } else {
        console.log('Event schema is already registered. Ready to emit events!');
      }

      // 5. Ensure current wallet is allowed to emit events for this schema
      try {
        console.log('Ensuring current account is authorised to emit events...');
        const emitterResult = await somniaSdk.streams.manageEventEmittersForRegisteredStreamsEvent(
          GUESTBOOK_EVENT_ID,
          normalizedAddress,
          true
        );

        if (emitterResult instanceof Error) {
          console.error('Failed to set event emitter permissions:', emitterResult);
        } else if (emitterResult) {
          console.log('Event emitter permissions updated! TxHash:', emitterResult);
        } else {
          console.log('Event emitter permission call returned null (possibly already authorised).');
        }
      } catch (emitterError: unknown) {
        console.warn('Unable to manage event emitter permissions:', emitterError);
      }

    } catch (error: unknown) {
      console.error('Failed to connect wallet or compute schema:', error);
    }
  };

  return (
    <SomniaContext.Provider value={{ sdk, account, schemaId, connectWallet }}>
      {children}
    </SomniaContext.Provider>
  );
};

// ... (useSomnia hook is the same) ...
// eslint-disable-next-line react-refresh/only-export-components
export const useSomnia = () => {
  const context = useContext(SomniaContext);
  if (context === undefined) {
    throw new Error('useSomnia must be used within a SomniaProvider');
  }
  return context;
};