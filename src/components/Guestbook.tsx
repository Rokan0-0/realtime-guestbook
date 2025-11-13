// src/components/Guestbook.tsx
import { useState, useEffect } from 'react';
import { useSomnia } from '../context/SomniaContext';
// 1. THE FIX: Import the single schema
import { GUESTBOOK_EVENT_ID, GUESTBOOK_SCHEMA } from '../config'; 
import { SchemaEncoder } from '@somnia-chain/streams';
import { keccak256, toBytes, isAddress, type Hex } from 'viem';

// ... (Interface is the same) ...
interface Message {
  senderName: string;
  messageContent: string;
  timestamp: string;
}

export const Guestbook = () => {
  const { sdk, account, schemaId } = useSomnia();
  // ... (States are the same) ...
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  // === PART 1: SUBSCRIBE (READ) ===
  useEffect(() => {
    if (!sdk || !schemaId) return;

    let isMounted = true;
    let unsubscribe: (() => void) | undefined;
    const decoder = new SchemaEncoder(GUESTBOOK_SCHEMA);

    const startSubscription = async () => {
      try {
        const subscription = await sdk.streams.subscribe({
          somniaStreamsEventId: GUESTBOOK_EVENT_ID,
          ethCalls: [],
          onlyPushChanges: true,
          onData: (payload: unknown) => {
            if (!isMounted) return;
            console.log('Real-time data received:', payload);
            try {
              const eventPayload = payload as {
                result?: { data?: string };
                data?: string;
                somniaEventStreams?: Array<{ data?: string }>;
              };
              const eventStreams = eventPayload?.somniaEventStreams;
              const streamData =
                eventStreams && eventStreams.length > 0 ? eventStreams[0]?.data : undefined;
              const encodedData = eventPayload?.result?.data ?? eventPayload?.data ?? streamData;

              if (!encodedData) {
                console.warn('Subscription payload did not contain encoded data:', payload);
                return;
              }

              if (typeof encodedData !== 'string') {
                console.warn('Encoded data is not a string:', encodedData);
                return;
              }

              const decodedItems = decoder.decodeData(encodedData as Hex);
              const rootValue = decodedItems.at(0)?.value;
              const tuple = Array.isArray(rootValue?.value) ? rootValue?.value : undefined;
              const [senderName, messageContent, timestamp] = (tuple ?? []) as [
                string,
                string,
                string
              ];

              if (!senderName || !messageContent || !timestamp) {
                console.warn('Decoded payload missing values:', decodedItems);
                return;
              }

              const nextMessage: Message = { senderName, messageContent, timestamp };

              setMessages((prev) => {
                const exists = prev.some(
                  (entry) =>
                    entry.senderName === nextMessage.senderName &&
                    entry.messageContent === nextMessage.messageContent &&
                    entry.timestamp === nextMessage.timestamp
                );
                if (exists) return prev;
                return [nextMessage, ...prev];
              });
            } catch (decodeError) {
              console.error('Failed to decode incoming message:', decodeError);
            }
          },
          onError: (error: Error) => {
            if (!isMounted) return;
            console.error('Subscription error:', error);
          },
        });

        if (subscription && isMounted) {
          unsubscribe = subscription.unsubscribe;
        }
      } catch (subscriptionError: unknown) {
        if (!isMounted) return;
        console.error('Failed to start subscription:', subscriptionError);
      }
    };

    startSubscription();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (unsubError: unknown) {
          console.warn('Failed to clean up subscription:', unsubError);
        }
      }
    };
  }, [sdk, schemaId]);

  // === PART 2: PUBLISH (WRITE) ===
  const handleSign = async () => {
    if (!sdk || !schemaId || !account || !name || !message) {
      alert('Please fill in all fields.');
      return;
    }
    
    // Validate account address format
    if (!isAddress(account)) {
      alert('Invalid account address. Please reconnect your wallet.');
      return;
    }
    
    setIsSending(true);
    console.log('Sending message...');
    console.log('Account:', account);
    console.log('Schema ID:', schemaId);
    
    // Verify schema is registered before attempting to publish
    try {
      const isRegistered = await sdk.streams.isDataSchemaRegistered(schemaId);
      if (!isRegistered) {
        alert('Schema is not registered yet. Please reconnect your wallet to register the schema first, then wait for the transaction to be confirmed before sending messages.');
        setIsSending(false);
        return;
      }
      console.log('Data schema registration verified. Proceeding with publish...');
    } catch (checkError: unknown) {
      console.warn('Could not verify data schema registration:', checkError);
    }

    try {
      const eventSchemas = await sdk.streams.getEventSchemasById([GUESTBOOK_EVENT_ID]);
      const isEventRegistered = Array.isArray(eventSchemas) && eventSchemas.length > 0;
      if (!isEventRegistered) {
        alert('Event schema is not registered yet. Please reconnect your wallet to register the event schema first.');
        setIsSending(false);
        return;
      }
      console.log('Event schema registration verified.');
    } catch (eventCheckError: unknown) {
      console.warn('Could not verify event schema registration:', eventCheckError);
    }
    
    try {
      // 2. THE FIX: Use the single schema
      const encoder = new SchemaEncoder(GUESTBOOK_SCHEMA);

      // The schema is a tuple, so we need to pass a single SchemaItem representing the tuple
      // The tuple's value should be an array of the actual primitive values
      const timestamp = new Date().toISOString();
      const payload = [
        {
          name: '', // Tuples don't have names in the function signature
          type: '(string,string,string)', // Match the tuple type
          value: [name, message, timestamp] // Array of actual values for the tuple components
        }
      ];

      // C. Encode the payload
      const encodedData = encoder.encodeData(payload);

      // ... (Rest of the function is the same) ...
      // Hash the identifier string to get exactly 32 bytes
      const idString = `guestbook-${account}-${Date.now()}`;
      const dataId = keccak256(toBytes(idString));
      
      console.log('Preparing to send transaction...');
      console.log('Data ID:', dataId);
      console.log('Encoded data length:', encodedData.length);
      
      console.log('Calling setAndEmitEvents() to publish data and emit event...');
      const txResult = await sdk.streams.setAndEmitEvents(
        [
          { id: dataId, schemaId: schemaId, data: encodedData },
        ],
        [
          { id: GUESTBOOK_EVENT_ID, argumentTopics: [], data: encodedData },
        ]
      );

      if (txResult instanceof Error) {
        throw txResult;
      }

      if (!txResult) {
        throw new Error('Transaction failed without a returned hash.');
      }

      console.log('Message sent! TxHash:', txResult);

      const optimisticMessage: Message = { senderName: name, messageContent: message, timestamp };
      setMessages((prev) => {
        const exists = prev.some(
          (entry) =>
            entry.senderName === optimisticMessage.senderName &&
            entry.messageContent === optimisticMessage.messageContent &&
            entry.timestamp === optimisticMessage.timestamp
        );
        if (exists) return prev;
        return [optimisticMessage, ...prev];
      });
      setMessage('');

    } catch (error: unknown) {
      console.error('Failed to send message:', error);

      const errorRecord =
        error && typeof error === 'object' ? (error as Record<string, unknown>) : undefined;

      console.error('Error details:', {
        message:
          typeof errorRecord?.message === 'string'
            ? errorRecord.message
            : error instanceof Error
            ? error.message
            : undefined,
        code: errorRecord?.code,
        name: errorRecord?.name,
        cause: errorRecord?.cause,
        shortMessage: errorRecord?.shortMessage,
        details: errorRecord?.details,
      });
      
      // Provide more helpful error messages
      let errorMessage = 'Failed to send message. ';
      
      // Check for user rejection
      const errorMessageText =
        typeof errorRecord?.message === 'string'
          ? errorRecord.message
          : error instanceof Error
          ? error.message
          : '';
      const errorCode =
        typeof errorRecord?.code === 'number'
          ? errorRecord.code
          : typeof errorRecord?.code === 'string'
          ? Number(errorRecord.code)
          : undefined;
      const shortMessage =
        typeof errorRecord?.shortMessage === 'string' ? errorRecord.shortMessage : undefined;

      if (
        errorMessageText?.includes('user rejected') ||
        errorMessageText?.includes('User rejected') ||
        errorMessageText?.includes('User denied') ||
        errorCode === 4001
      ) {
        errorMessage += 'Transaction was rejected in MetaMask. Please approve the transaction to send your message.';
      } else if (
        errorMessageText?.includes('insufficient funds') ||
        errorMessageText?.includes('gas') ||
        errorMessageText?.includes('balance')
      ) {
        errorMessage += 'Insufficient funds for gas. Please ensure you have testnet tokens (STT) in your wallet.';
      } else if (errorMessageText?.includes('Internal JSON-RPC error') || errorCode === -32603) {
        errorMessage += 'Transaction failed with Internal JSON-RPC error.\n\n' +
          'Possible causes:\n' +
          '1. Transaction was rejected in MetaMask (click "Reject")\n' +
          '2. Insufficient testnet tokens for gas\n' +
          '3. Network connectivity issues\n' +
          '4. MetaMask is not connected to Somnia Testnet\n\n' +
          'Please:\n' +
          '- Make sure you click "Confirm" (not "Reject") in MetaMask\n' +
          '- Ensure you have STT tokens for gas\n' +
          '- Check that MetaMask is on Somnia Testnet (Chain ID: 50312)\n\n' +
          'Check the browser console for more details.';
      } else if (shortMessage) {
        errorMessage += shortMessage;
      } else if (errorMessageText) {
        errorMessage += errorMessageText;
      } else {
        errorMessage += 'Unknown error. Check console for details.';
      }
      
      alert(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  // === PART 3: RENDER (THE UI) ===
  // (Unchanged)
  return (
    <div className="guestbook-container">
      {/* ... (form JSX is the same) ... */}
      <div className="guestbook-form">
        <h3>Sign the Guestbook</h3>
        <input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          placeholder="Write your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button onClick={handleSign} disabled={isSending}>
          {isSending ? 'Sending...' : 'Sign & Publish'}
        </button>
      </div>
      {/* ... (feed JSX is the same) ... */}
      <div className="guestbook-feed">
        <h3>Live Feed</h3>
        {messages.length === 0 ? (
          <p className="loading">Waiting for new messages...</p>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className="message-card">
              <p>"{msg.messageContent}"</p>
              <strong>- {msg.senderName}</strong>
              <small>
                {new Date(msg.timestamp).toLocaleString()}
              </small>
            </div>
          ))
        )}
      </div>
    </div>
  );
};