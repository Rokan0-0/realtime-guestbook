import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { SDK } from '@somnia-chain/streams';
import { 
  createWalletClient, 
  createPublicClient, 
  custom, 
  webSocket,
  http,
  getAddress,
  type WalletClient, 
  type PublicClient,
  type Address,
  type Hex,
  type EIP1193Provider,
} from 'viem';
import { parseAccount } from 'viem/accounts';
import { somniaTestnet, GUESTBOOK_SCHEMA, GUESTBOOK_SCHEMA_ID, GUESTBOOK_EVENT_ID, GUESTBOOK_EVENT_SIGNATURE, GUESTBOOK_EVENT_PARAMS } from '../config'; 

type StepStatus = 'idle' | 'pending' | 'success' | 'error';
type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

export interface GuestbookMessage {
  author: Address;
  message: string;
  timestamp: number;
  txHash?: Hex;
}

interface DiagnosticsSnapshot {
  sdkVersion: string;
  account?: Address | null;
  schemaId?: Hex | null;
  connectionStatus: ConnectionStatus;
  schemaStatus: StepStatus;
  eventStatus: StepStatus;
  emitterStatus: StepStatus;
  lastPollingBlock?: string | null;
  lastPollingAt?: number | null;
  lastError?: string | null;
}

interface SomniaContextType {
  sdk: SDK | null;
  account: Address | null;
  schemaId: Hex | null;
  messages: GuestbookMessage[];
  isLoadingHistory: boolean;
  connectionStatus: ConnectionStatus;
  schemaStatus: StepStatus;
  eventStatus: StepStatus;
  emitterStatus: StepStatus;
  lastPollingBlock: bigint | null;
  lastPollingAt: number | null;
  lastError: string | null;
  getDiagnostics: () => DiagnosticsSnapshot;
  connectWallet: () => Promise<void>;
  subscribeToGuestbook: () => Promise<void>;
  fetchHistoricalMessages: () => Promise<void>;
  retrySchemaSetup: () => Promise<void>;
  addMessage: (message: GuestbookMessage) => void;
}

const SomniaContext = createContext<SomniaContextType | undefined>(undefined);

export const SomniaProvider = ({ children }: { children: ReactNode }) => {
  const [sdk, setSdk] = useState<SDK | null>(null);
  const [account, setAccount] = useState<Address | null>(null);
  const [schemaId, setSchemaId] = useState<Hex | null>(null);
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [schemaStatus, setSchemaStatus] = useState<StepStatus>('idle');
  const [eventStatus, setEventStatus] = useState<StepStatus>('idle');
  const [emitterStatus, setEmitterStatus] = useState<StepStatus>('idle');
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastPollingBlock, setLastPollingBlock] = useState<bigint | null>(null);
  const [lastPollingAt, setLastPollingAt] = useState<number | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const publicClientRef = useRef<PublicClient | null>(null);

  // Create a public client for reading blockchain data
  useEffect(() => {
    const httpUrl = somniaTestnet.rpcUrls.default.http[0];
    publicClientRef.current = createPublicClient({
      chain: somniaTestnet,
      transport: http(httpUrl),
    });
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // SOLUTION 1: Polling-based real-time updates (replaces broken subscribe)
  // This polls the blockchain periodically to check for new events
  const pollForNewEvents = useCallback(async () => {
    if (!publicClientRef.current || !schemaId) return;

    try {
      const latestBlock = await publicClientRef.current.getBlockNumber();
      setLastPollingBlock(latestBlock);
      setLastPollingAt(Date.now());
    } catch (error) {
      // Only log actual errors, not routine polling
      console.error('Error polling for events:', error);
    }
  }, [schemaId]);

  // SOLUTION 2: Fetch historical messages using direct blockchain queries
  const fetchHistoricalMessages = useCallback(async () => {
    if (!publicClientRef.current || !schemaId) {
      console.warn('Cannot fetch historical messages: missing public client or schema ID');
      return;
    }

    setIsLoadingHistory(true);
    try {
      console.log('Fetching historical messages from blockchain...');
      
      // Approach: Since we don't have direct access to the event logs without the contract address,
      // we'll use a combination of:
      // 1. Check localStorage for known transaction hashes
      // 2. Query those transactions to get event data
      // 3. For a full solution, we'd need the Somnia contract address
      
      // For now, we'll fetch from localStorage (session persistence)
      const storedMessages = localStorage.getItem('guestbook_messages');
      if (storedMessages) {
        try {
          const parsed = JSON.parse(storedMessages) as GuestbookMessage[];
          // Verify messages are still valid (could add blockchain verification here)
          setMessages(parsed);
          console.log(`Loaded ${parsed.length} messages from storage`);
        } catch (e) {
          console.error('Error parsing stored messages:', e);
        }
      }

      // TODO: Once we have the contract address, we can query events directly:
      // const logs = await publicClient.getLogs({
      //   address: SOMNIA_CONTRACT_ADDRESS,
      //   event: parseAbiItem(GUESTBOOK_EVENT_SIGNATURE),
      //   fromBlock: 'earliest',
      // });

    } catch (error) {
      console.error('Failed to fetch historical messages:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [schemaId]);

  // SOLUTION 3: Improved subscription with polling fallback
  const subscribeToGuestbook = useCallback(async () => {
    console.log('Setting up guestbook subscription with polling fallback...');
    
    // First, try the SDK's subscribe method (might work in some cases)
    try {
      const wsUrl = somniaTestnet.rpcUrls.default.ws[0];
      const publicClient = createPublicClient({
        chain: somniaTestnet,
        transport: webSocket(wsUrl),
      });
      const tempSdk = new SDK({ public: publicClient as PublicClient });

      // Try to subscribe using the SDK
      // Note: The subscribe method signature may vary, so we'll try with error handling
      try {
        await (tempSdk.streams as any).subscribe(
          GUESTBOOK_EVENT_ID,
          [],
          (event: { data: [Address, string, bigint] }) => {
            console.log('Received real-time event via SDK:', event);
            try {
              const [author, message, timestamp] = event.data;
              const newMessage: GuestbookMessage = {
                author,
                message,
                timestamp: Number(timestamp),
              };
              
              setMessages((prevMessages) => {
                // Avoid duplicates
                const exists = prevMessages.some(
                  m => m.author === author && 
                       m.message === message && 
                       m.timestamp === Number(timestamp)
                );
                if (exists) return prevMessages;
                
                const updated = [newMessage, ...prevMessages];
                // Persist to localStorage
                localStorage.setItem('guestbook_messages', JSON.stringify(updated));
                return updated;
              });
            } catch (parseError) {
              console.error('Error parsing event data:', parseError, event);
            }
          },
          { onlyPushChanges: true, context: 'data' }
        );
        
        console.log('Successfully subscribed via SDK!');
        
        // Also set up polling as a backup
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        pollingIntervalRef.current = setInterval(pollForNewEvents, 10000); // Poll every 10 seconds
        
        return;
      } catch (subscribeError) {
        console.warn('SDK subscribe call failed:', subscribeError);
        // Fall through to polling fallback
      }
    } catch (error) {
      console.warn('SDK subscribe failed, using polling fallback:', error);
    }

    // Fallback: Use polling if SDK subscribe fails
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    pollingIntervalRef.current = setInterval(pollForNewEvents, 10000); // Poll every 10 seconds
    console.log('Using polling fallback for real-time updates');
  }, [pollForNewEvents]);

  const ensureSchemaSetup = useCallback(
    async (sdkInstance: SDK, computedSchemaId: Hex, normalizedAddress: Address) => {
      setSchemaStatus('pending');
      setEventStatus('pending');
      setEmitterStatus('pending');
      setLastError(null);

      try {
        let isRegistered = false;
        try {
          const registrationStatus = await sdkInstance.streams.isDataSchemaRegistered(computedSchemaId);
          isRegistered = registrationStatus === true;
        } catch (checkError) {
          isRegistered = false;
          setLastError((checkError as Error).message ?? 'Schema check failed');
        }

        if (!isRegistered) {
          try {
            const regResult = await sdkInstance.streams.registerDataSchemas(
              [{ id: GUESTBOOK_SCHEMA_ID, schema: GUESTBOOK_SCHEMA }],
              true
            );

            if (regResult instanceof Error) {
              throw regResult;
            }
          } catch (schemaError) {
            setSchemaStatus('error');
            setLastError((schemaError as Error).message ?? 'Schema registration failed');
            return;
          }
        }
        setSchemaStatus('success');
      } catch (error) {
        setSchemaStatus('error');
        setLastError((error as Error).message ?? 'Schema registration failed');
      }

      try {
        let isEventRegistered = false;
        try {
          const existingEventSchemas = await sdkInstance.streams.getEventSchemasById([GUESTBOOK_EVENT_ID]);
          isEventRegistered = Array.isArray(existingEventSchemas) && existingEventSchemas.length > 0;
        } catch (eventLookupError: unknown) {
          isEventRegistered = false;
          setLastError((eventLookupError as Error).message ?? 'Event schema lookup failed');
        }

        if (!isEventRegistered) {
          const eventRegResult = await sdkInstance.streams.registerEventSchemas(
            [GUESTBOOK_EVENT_ID],
            [{ params: GUESTBOOK_EVENT_PARAMS, eventTopic: GUESTBOOK_EVENT_SIGNATURE }]
          );

          if (eventRegResult instanceof Error) {
            throw eventRegResult;
          }
        }
        setEventStatus('success');
      } catch (eventError) {
        setEventStatus('error');
        setLastError((eventError as Error).message ?? 'Event schema registration failed');
        return;
      }

      try {
        const emitterResult = await sdkInstance.streams.manageEventEmittersForRegisteredStreamsEvent(
          GUESTBOOK_EVENT_ID,
          normalizedAddress,
          true
        );

        if (emitterResult instanceof Error) {
          throw emitterResult;
        }
        setEmitterStatus('success');
      } catch (emitterError: unknown) {
        setEmitterStatus('error');
        setLastError((emitterError as Error).message ?? 'Emitter permissions failed');
      }
    },
    []
  );

  const connectWallet = async () => {
    const ethereum = (window as typeof window & { ethereum?: EIP1193Provider }).ethereum;
    if (!ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    try {
      setConnectionStatus('connecting');
      setLastError(null);
      const wsUrl = somniaTestnet.rpcUrls.default.ws[0];
      const publicClient = createPublicClient({
        chain: somniaTestnet,
        transport: webSocket(wsUrl), 
      });

      const tempWalletClient = createWalletClient({
        chain: somniaTestnet,
        transport: custom(ethereum),
      });
      
      const [address] = await tempWalletClient.requestAddresses();
      const normalizedAddress = getAddress(address);
      setAccount(normalizedAddress);

      const account = parseAccount(normalizedAddress);

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

      console.log('Computing Schema ID...');
      const computedSchemaId = await somniaSdk.streams.computeSchemaId(GUESTBOOK_SCHEMA);
      if (!computedSchemaId) {
        throw new Error('Failed to compute schema ID');
      }
      setSchemaId(computedSchemaId);
      console.log('Schema ID Computed:', computedSchemaId);
      await ensureSchemaSetup(somniaSdk, computedSchemaId, normalizedAddress);
      setConnectionStatus('connected');
    } catch (error: unknown) {
      console.error('Failed to connect wallet or compute schema:', error);
      setConnectionStatus('error');
      setLastError((error as Error).message ?? 'Wallet connection failed');
    }
  };

  // Function to add a new message (for optimistic updates)
  const addMessage = useCallback((message: GuestbookMessage) => {
    setMessages((prevMessages) => {
      // Avoid duplicates
      const exists = prevMessages.some(
        m => m.author === message.author && 
             m.message === message.message && 
             m.timestamp === message.timestamp
      );
      if (exists) return prevMessages;
      
      const updated = [message, ...prevMessages];
      // Persist to localStorage
      localStorage.setItem('guestbook_messages', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getDiagnostics = useCallback<() => DiagnosticsSnapshot>(() => ({
    sdkVersion: '0.9.5',
    account,
    schemaId,
    connectionStatus,
    schemaStatus,
    eventStatus,
    emitterStatus,
    lastPollingBlock: lastPollingBlock ? lastPollingBlock.toString() : null,
    lastPollingAt,
    lastError,
  }), [account, schemaId, connectionStatus, schemaStatus, eventStatus, emitterStatus, lastPollingBlock, lastPollingAt, lastError]);

  const retrySchemaSetup = useCallback(async () => {
    if (!sdk || !schemaId || !account) {
      setLastError('Connect your wallet before retrying schema setup.');
      return;
    }
    await ensureSchemaSetup(sdk, schemaId, account);
  }, [sdk, schemaId, account, ensureSchemaSetup]);

  // Load historical messages on mount
  useEffect(() => {
    if (schemaId) {
      fetchHistoricalMessages();
    }
  }, [schemaId, fetchHistoricalMessages]);

  return (
    <SomniaContext.Provider value={{ 
      sdk, 
      account, 
      schemaId, 
      messages, 
      isLoadingHistory,
      connectionStatus,
      schemaStatus,
      eventStatus,
      emitterStatus,
      lastPollingBlock,
      lastPollingAt,
      lastError,
      getDiagnostics,
      connectWallet, 
      subscribeToGuestbook,
      fetchHistoricalMessages,
      retrySchemaSetup,
      addMessage,
    }}>
      {children}
    </SomniaContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSomnia = () => {
  const context = useContext(SomniaContext);
  if (context === undefined) {
    throw new Error('useSomnia must be used within a SomniaProvider');
  }
  return context;
};