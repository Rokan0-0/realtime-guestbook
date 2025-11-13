// src/context/SomniaContext.tsx
import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { SDK } from '@somnia-chain/streams';
import { 
  createWalletClient, 
  createPublicClient, 
  custom, 
  http,
  webSocket,
  getAddress,
  type WalletClient, 
  type PublicClient 
} from 'viem';
import { parseAccount } from 'viem/accounts';
// 1. THE FIX: Import the single schema
import { somniaTestnet, GUESTBOOK_SCHEMA, GUESTBOOK_SCHEMA_ID } from '../config'; 

// ... (Context definition is the same) ...
interface SomniaContextType {
  sdk: SDK | null;
  account: string | null;
  schemaId: string | null;
  connectWallet: () => Promise<void>;
}
const SomniaContext = createContext<SomniaContextType | undefined>(undefined);
// ... (End of unchanged part) ...

export const SomniaProvider = ({ children }: { children: ReactNode }) => {
  const [sdk, setSdk] = useState<SDK | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [schemaId, setSchemaId] = useState<string | null>(null);

  const connectWallet = async () => {
    if (!window.ethereum) {
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
        transport: custom(window.ethereum),
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
        transport: custom(window.ethereum),
      });

      const somniaSdk = new SDK({
        public: publicClient as PublicClient,
        wallet: walletClient as WalletClient,
        url: wsUrl, 
        chain: somniaTestnet 
      });
      setSdk(somniaSdk);
      console.log('Wallet Connected:', address);
      console.log('SDK Initialized (All-in Config)');

      // 2. THE FIX: Compute and register the schema
      console.log('Computing Schema ID...');
      const id = await somniaSdk.streams.computeSchemaId(GUESTBOOK_SCHEMA);
      setSchemaId(id);
      console.log('Schema ID Computed:', id);

      // 3. Register the schema if not already registered
      console.log('Checking if schema is registered...');
      const isRegistered = await somniaSdk.streams.isDataSchemaRegistered(id);
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

    } catch (error) {
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
export const useSomnia = () => {
  const context = useContext(SomniaContext);
  if (context === undefined) {
    throw new Error('useSomnia must be used within a SomniaProvider');
  }
  return context;
};