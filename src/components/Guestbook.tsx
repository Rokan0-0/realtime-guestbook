import { useState, useEffect } from 'react';
import { useSomnia, type GuestbookMessage } from '../context/SomniaContext';
import { GUESTBOOK_SCHEMA, GUESTBOOK_EVENT_ID } from '../config'; 
import { SchemaEncoder } from '@somnia-chain/streams';
import { keccak256, toBytes, isAddress } from 'viem';

export const Guestbook = () => {
  const { sdk, account, schemaId, messages, isLoadingHistory, subscribeToGuestbook, fetchHistoricalMessages, addMessage } = useSomnia();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Subscribe to real-time updates when component mounts
  useEffect(() => {
    if (schemaId) {
      console.log('Setting up guestbook subscription...');
      subscribeToGuestbook();
      
      return () => {
        // Cleanup handled in context
      };
    }
  }, [schemaId, subscribeToGuestbook]);

  // Add a manual refresh button handler
  const handleRefresh = async () => {
    await fetchHistoricalMessages();
  };

  const handleSign = async () => {
    if (!sdk || !schemaId || !account || !message) {
      alert('Please fill in all fields and connect your wallet.');
      return;
    }
    if (!isAddress(account)) {
      alert('Invalid account address.');
      return;
    }
    
    setIsSending(true);
    console.log('Sending message...');
    
    try {
      const isRegistered = await sdk.streams.isDataSchemaRegistered(schemaId);
      if (!isRegistered) {
        console.warn('Schema registration check might be unreliable, proceeding anyway.');
      }
      
      // 3. Encode the data using the tuple format (this is the working format)
      const encoder = new SchemaEncoder(GUESTBOOK_SCHEMA);
      const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
      
      // SchemaEncoder works with tuple format: values in order matching the schema
      const payload = [
        { name: '', type: '(address,string,uint64)', value: [account, message, timestamp] }
      ];
      const encodedData = encoder.encodeData(payload);
      const dataId = keccak256(toBytes(`guestbook-${account}-${timestamp}`)); 
      
      console.log('Calling set() to publish data...');
      
      const hash = await sdk.streams.set([
        { id: dataId, schemaId: schemaId, data: encodedData },
      ]);

      console.log('Message sent! TxHash:', hash);

      // 4. THE FIX: Try to emit an event so subscribers can receive the message
      // Note: The SDK's emit method may not exist or work as expected
      console.log('Attempting to emit event for new message...');
      try {
        // Check if emit method exists before calling
        if ('emit' in sdk.streams && typeof sdk.streams.emit === 'function') {
          const eventResult = await (sdk.streams as any).emit(
            GUESTBOOK_EVENT_ID,
            [account, message, timestamp]
          );

          if (eventResult instanceof Error) {
            console.error('Failed to emit event:', eventResult);
          } else {
            console.log('Event emitted successfully! TxHash:', eventResult);
          }
        } else {
          console.warn('SDK streams.emit() method not available');
        }
      } catch (emitError) {
        console.warn('Error emitting event (message still published):', emitError);
      }

      // Add message to context immediately (optimistic update)
      const newMessage: GuestbookMessage = {
        author: account,
        message: message,
        timestamp: timestamp,
        txHash: hash || undefined,
      };
      
      addMessage(newMessage);
      
      // Clear the message input after sending
      setMessage('');
      
    } catch (err: any) {
      console.error('Failed to send message:', err);
      let errorMessage = 'Failed to send message. ';
      if (err?.message?.includes('user rejected')) {
        errorMessage += 'Transaction was rejected in MetaMask.';
      } else if (err?.message?.includes('insufficient funds')) {
        errorMessage += 'Insufficient funds for gas.';
      } else {
        errorMessage += 'Unknown error. Check console for details.';
      }
      alert(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="guestbook-container">
      <div className="guestbook-form">
        <h3>Sign the Guestbook</h3>
        {/* 5. THE FIX: Use `account` for the name input, and make it read-only */}
        <input
          type="text"
          placeholder="Your connected address"
          value={account ? `Signed as: ${account}` : 'Connecting...'}
          readOnly
          className="address-input"
        />
        <textarea
          placeholder="Write your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button onClick={handleSign} disabled={isSending || !account}>
          {isSending ? 'Sending...' : 'Sign & Publish'}
        </button>
      </div>
      
      <div className="guestbook-feed">
        <div className="feed-header">
          <h3>Real-time Feed</h3>
          <small className="feed-note">(Messages from the blockchain)</small>
          <button 
            onClick={handleRefresh} 
            disabled={isLoadingHistory}
            className="refresh-button"
            style={{ marginLeft: '10px', padding: '5px 10px', fontSize: '12px' }}
          >
            {isLoadingHistory ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        {/* 6. THE FIX: Render messages from the context */}
        {isLoadingHistory && messages.length === 0 ? (
          <p className="loading">Loading messages from blockchain...</p>
        ) : messages.length === 0 ? (
          <p className="loading">No messages yet. Be the first to sign the guestbook!</p>
        ) : (
          [...messages].reverse().map((msg, index) => (
            <div key={`${msg.author}-${msg.timestamp}-${index}`} className="message-card">
              <p>"{msg.message}"</p>
              <strong>- {msg.author}</strong>
              <small>
                {new Date(msg.timestamp * 1000).toLocaleString()}
                {msg.txHash && (
                  <a 
                    href={`https://shannon-explorer.somnia.network/tx/${msg.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ marginLeft: '10px', color: '#4CAF50' }}
                  >
                    View on Explorer
                  </a>
                )}
              </small>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
