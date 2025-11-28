import { useState } from 'react';
import { useSomnia } from '../context/SomniaContext';

const statusLabels: Record<string, string> = {
  idle: 'Idle',
  pending: 'Working…',
  success: 'Ready',
  error: 'Needs Attention',
  connecting: 'Connecting…',
  connected: 'Connected',
};

const badgeColors: Record<string, string> = {
  idle: '#555',
  pending: '#f0ad4e',
  success: '#2e7d32',
  error: '#c62828',
  connecting: '#f0ad4e',
  connected: '#2e7d32',
};

const StatusBadge = ({ status }: { status: string }) => (
  <span
    style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '999px',
      fontSize: '12px',
      color: '#fff',
      fontWeight: 600,
      backgroundColor: badgeColors[status] ?? '#555',
    }}
  >
    {statusLabels[status] ?? status}
  </span>
);

export const StatusPanel = () => {
  const {
    connectionStatus,
    schemaStatus,
    eventStatus,
    emitterStatus,
    lastPollingBlock,
    lastPollingAt,
    lastError,
    getDiagnostics,
    retrySchemaSetup,
  } = useSomnia();

  const [copied, setCopied] = useState(false);

  const handleCopyDiagnostics = async () => {
    const diagnostics = getDiagnostics();
    const payload = JSON.stringify(
      {
        ...diagnostics,
        lastPollingBlock: diagnostics.lastPollingBlock ?? 'N/A',
        lastPollingAt: diagnostics.lastPollingAt
          ? new Date(diagnostics.lastPollingAt).toISOString()
          : 'N/A',
      },
      null,
      2
    );
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy diagnostics:', error);
    }
  };

  return (
    <div className="status-panel">
      <div className="status-row">
        <span>Wallet</span>
        <StatusBadge status={connectionStatus} />
      </div>
      <div className="status-row">
        <span>Data Schema</span>
        <StatusBadge status={schemaStatus} />
      </div>
      <div className="status-row">
        <span>Event Schema</span>
        <StatusBadge status={eventStatus} />
      </div>
      <div className="status-row">
        <span>Emitter Access</span>
        <StatusBadge status={emitterStatus} />
      </div>
      <div className="status-row">
        <span>Last Poll</span>
        <small>
          {lastPollingBlock
            ? `Block #${lastPollingBlock.toString()} (${lastPollingAt ? new Date(lastPollingAt).toLocaleTimeString() : 'time unknown'})`
            : 'Waiting…'}
        </small>
      </div>
      {lastError && (
        <div className="status-row warning-text">
          <span>Error</span>
          <small>{lastError}</small>
        </div>
      )}
      <div className="status-actions">
        <button onClick={retrySchemaSetup}>Retry Schema Setup</button>
        <button onClick={handleCopyDiagnostics}>{copied ? 'Copied!' : 'Copy Diagnostics'}</button>
      </div>
    </div>
  );
};

