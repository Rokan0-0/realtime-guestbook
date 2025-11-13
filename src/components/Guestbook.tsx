// src/components/Guestbook.tsx
import { useState, useEffect } from 'react';
import { useSomnia } from '../context/SomniaContext';
// 1. THE FIX: Import the single schema
import { GUESTBOOK_EVENT_ID, GUESTBOOK_SCHEMA } from '../config'; 
import { SchemaEncoder } from '@somnia-chain/streams';
import { keccak256, toBytes, isAddress } from 'viem';

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

  // === PART 1: SUBSCRIBE (READ) - REMAINS DISABLED ===
  useEffect(() => {
    if (!sdk || !schemaId) return;
    console.log('Subscription code is disabled. Skipping subscribe call.');
    console.log('Using Schema ID:', schemaId);
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
      console.log('Schema registration verified. Proceeding with publish...');
    } catch (checkError) {
      console.warn('Could not verify schema registration:', checkError);
      // Continue anyway - the transaction will fail if schema isn't registered
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
      
      // Try using set() first - simpler and doesn't require event schema registration
      // If this works, we can add events later
      console.log('Calling set() to publish data...');
      const hash = await sdk.streams.set([
        { id: dataId, schemaId: schemaId, data: encodedData },
      ]);
      
      // Note: We're using set() instead of setAndEmitEvents() for now
      // Events require additional event schema registration which we can add later

      console.log('Message sent! TxHash:', hash);
      setMessages((prevMessages) => [{ senderName: name, messageContent: message, timestamp: timestamp }, ...prevMessages]);
      setMessage('');

    } catch (err: any) {
      console.error('Failed to send message:', err);
      console.error('Error details:', {
        message: err?.message,
        code: err?.code,
        name: err?.name,
        cause: err?.cause,
        shortMessage: err?.shortMessage,
        details: err?.details
      });
      
      // Provide more helpful error messages
      let errorMessage = 'Failed to send message. ';
      
      // Check for user rejection
      if (err?.message?.includes('user rejected') || 
          err?.message?.includes('User rejected') ||
          err?.message?.includes('User denied') ||
          err?.code === 4001) {
        errorMessage += 'Transaction was rejected in MetaMask. Please approve the transaction to send your message.';
      } else if (err?.message?.includes('insufficient funds') || 
                 err?.message?.includes('gas') ||
                 err?.message?.includes('balance')) {
        errorMessage += 'Insufficient funds for gas. Please ensure you have testnet tokens (STT) in your wallet.';
      } else if (err?.message?.includes('Internal JSON-RPC error') || 
                 err?.code === -32603) {
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
      } else if (err?.shortMessage) {
        errorMessage += err.shortMessage;
      } else if (err?.message) {
        errorMessage += err.message;
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