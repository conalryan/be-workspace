import React from 'react';
import { FeatureFlag } from '../types/feature-flag.types';

interface FlagListProps {
  flags: FeatureFlag[];
  onEdit: (flag: FeatureFlag) => void;
  onToggle: (key: string) => void;
  onDelete: (key: string) => void;
}

export const FlagList: React.FC<FlagListProps> = ({ flags, onEdit, onToggle, onDelete }) => {
  if (flags.length === 0) {
    return (
      <div style={styles.emptyState}>
        <p style={styles.emptyText}>No feature flags found. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div style={styles.listContainer}>
      {flags.map((flag) => (
        <div key={flag.id} style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.flagInfo}>
              <h3 style={styles.flagKey}>{flag.flag_key}</h3>
              <span style={flag.enabled ? styles.badgeEnabled : styles.badgeDisabled}>
                {flag.enabled ? '✓ Enabled' : '✗ Disabled'}
              </span>
            </div>
            <div style={styles.actions}>
              <button
                onClick={() => onToggle(flag.flag_key)}
                style={styles.toggleButton}
                title={flag.enabled ? 'Disable flag' : 'Enable flag'}
              >
                {flag.enabled ? '◐ Disable' : '◑ Enable'}
              </button>
              <button
                onClick={() => onEdit(flag)}
                style={styles.editButton}
                title="Edit flag"
              >
                ✎ Edit
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Delete flag "${flag.flag_key}"?`)) {
                    onDelete(flag.flag_key);
                  }
                }}
                style={styles.deleteButton}
                title="Delete flag"
              >
                ✕ Delete
              </button>
            </div>
          </div>

          {flag.description && (
            <p style={styles.description}>{flag.description}</p>
          )}

          <div style={styles.jsonContainer}>
            <div style={styles.jsonLabel}>Flag Data:</div>
            <pre style={styles.jsonPre}>
              {JSON.stringify(flag.flag_data, null, 2)}
            </pre>
          </div>

          <div style={styles.metadata}>
            <span style={styles.metadataItem}>
              ID: {flag.id}
            </span>
            <span style={styles.metadataItem}>
              Version: {flag.version}
            </span>
            <span style={styles.metadataItem}>
              Created: {new Date(flag.created_at).toLocaleString()}
            </span>
            <span style={styles.metadataItem}>
              Updated: {new Date(flag.updated_at).toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  card: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    border: '1px solid #e0e0e0',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
    flexWrap: 'wrap' as const,
    gap: '12px',
  },
  flagInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap' as const,
  },
  flagKey: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    fontFamily: 'monospace',
  },
  badgeEnabled: {
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: '#4CAF50',
    color: '#fff',
    borderRadius: '12px',
  },
  badgeDisabled: {
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: '#999',
    color: '#fff',
    borderRadius: '12px',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  toggleButton: {
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: '500',
    backgroundColor: '#FF9800',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  editButton: {
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: '500',
    backgroundColor: '#2196F3',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  deleteButton: {
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: '500',
    backgroundColor: '#f44336',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  description: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.5',
  },
  jsonContainer: {
    marginBottom: '12px',
  },
  jsonLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#888',
    marginBottom: '6px',
    textTransform: 'uppercase' as const,
  },
  jsonPre: {
    margin: 0,
    padding: '12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    fontSize: '13px',
    fontFamily: 'monospace',
    overflow: 'auto',
    maxHeight: '200px',
  },
  metadata: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    color: '#999',
    borderTop: '1px solid #e0e0e0',
    paddingTop: '12px',
    flexWrap: 'wrap' as const,
  },
  metadataItem: {
    whiteSpace: 'nowrap' as const,
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: '48px 24px',
    borderRadius: '8px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  emptyText: {
    margin: 0,
    fontSize: '16px',
    color: '#999',
  },
};
