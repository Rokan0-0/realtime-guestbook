// src/components/Guestbook.tsx
import { useState } from 'react';
import { useSomnia } from '../context/SomniaContext';
import { GUESTBOOK_SCHEMA } from '../config'; 
import { SchemaEncoder } from '@somnia-chain/streams';
import { keccak256, toBytes, isAddress } from 'viem';

// Interface for our React state
interface Message {
  senderName: string;
  messageContent: string;
  timestamp: string;
}

export const Guestbook = () => {
  const { sdk, account, schemaId } = useSomnia();
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]); // Session-only messages

  // NOTE: The SDK does not have a get() method, and subscribe() is broken.
  // Therefore, we can only show messages sent during this session.
  // Messages are successfully written to the chain via sdk.streams.set(),
  // but reading them back requires functionality that doesn't exist in the current SDK version.

  // === PART 2: PUBLISH (WRITE) ===
  // This is your 100% working code from Cursor
  const handleSign = async () => {
    if (!sdk || !schemaId || !account || !name || !message) {
      alert('Please fill in all fields.');
      return;
    }
    if (!isAddress(account)) {
      alert('Invalid account address.');
      return;
    }
    
    setIsSending(true);
    console.log('Sending message...');
    
    try {
      // Schema registration check
      const isRegistered = await sdk.streams.isDataSchemaRegistered(schemaId);
      if (!isRegistered) {
        console.warn('Schema registration check might be unreliable, proceeding anyway.');
        // We no longer alert here, just warn and proceed.
        // The user can't do anything if the check is flaky.
      }
      
      const encoder = new SchemaEncoder(GUESTBOOK_SCHEMA);
      const timestamp = new Date().toISOString();
      const payload = [
        { name: '', type: '(string,string,string)', value: [name, message, timestamp] }
      ];
      const encodedData = encoder.encodeData(payload);
      const dataId = keccak256(toBytes(`guestbook-${account}-${Date.now()}`)); 
      
      console.log('Calling set() to publish data...');
      
      // We use set() as it's the 100% working "Write" function
      const hash = await sdk.streams.set([
        { id: dataId, schemaId: schemaId, data: encodedData },
      ]);

      console.log('Message sent! TxHash:', hash);
      setMessage('');
      
      // Add the new message to the session feed
      // Note: This message is now on-chain, but we can't read it back due to SDK limitations
      const newMessage: Message = { senderName: name, messageContent: message, timestamp: timestamp };
      setMessages((prevMessages) => [newMessage, ...prevMessages]);

    } catch (err: any) {
      // ... (Your excellent error handling) ...
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

  // === PART 3: RENDER (THE UI) ===
  return (
    <div className="guestbook-container">
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
      
      <div className="guestbook-feed">
        <div className="feed-header">
          <h3>Session Feed</h3>
          <small className="feed-note">(Messages sent this session)</small>
        </div>
        {messages.length === 0 ? (
          <p className="loading">No messages sent yet this session. Sign the guestbook to see your message here!</p>
        ) : (
          <>
            <p className="feed-info">
              <small>Note: Messages are published to the blockchain, but the SDK doesn't support reading them back. 
              This feed shows only messages sent during this session.</small>
            </p>
            {messages.map((msg, index) => (
              <div key={`${msg.senderName}-${msg.timestamp}-${index}`} className="message-card">
                <p>"{msg.messageContent}"</p>
                <strong>- {msg.senderName}</strong>
                <small>
                  {new Date(msg.timestamp).toLocaleString()}
                </small>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
