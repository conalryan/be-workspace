import React, { useState } from 'react';
import { CreateFeatureFlagDto } from '../types/feature-flag.types';

interface CreateFlagFormProps {
  onSubmit: (data: CreateFeatureFlagDto) => Promise<void>;
  onCancel: () => void;
}

export const CreateFlagForm: React.FC<CreateFlagFormProps> = ({ onSubmit, onCancel }) => {
  const [flagKey, setFlagKey] = useState('');
  const [description, setDescription] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [flagData, setFlagData] = useState('{}');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate JSON
      const parsedData = JSON.parse(flagData);
      
      await onSubmit({
        flag_key: flagKey,
        description,
        enabled,
        flag_data: parsedData,
      });

      // Reset form
      setFlagKey('');
      setDescription('');
      setEnabled(false);
      setFlagData('{}');
    } catch (err: any) {
      setError(err.message || 'Invalid JSON or submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.formContainer}>
      <h3 style={styles.formTitle}>Create New Feature Flag</h3>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label htmlFor="flagKey" style={styles.label}>
            Flag Key *
          </label>
          <input
            id="flagKey"
            type="text"
            value={flagKey}
            onChange={(e) => setFlagKey(e.target.value)}
            placeholder="e.g., my-new-feature"
            required
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="description" style={styles.label}>
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this flag controls"
            rows={3}
            style={{ ...styles.input, ...styles.textarea }}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              style={styles.checkbox}
            />
            Enabled
          </label>
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="flagData" style={styles.label}>
            Flag Data (JSON)
          </label>
          <textarea
            id="flagData"
            value={flagData}
            onChange={(e) => setFlagData(e.target.value)}
            placeholder='{"value": "example"}'
            rows={5}
            style={{ ...styles.input, ...styles.textarea, fontFamily: 'monospace' }}
          />
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.buttonGroup}>
          <button type="submit" disabled={loading} style={styles.submitButton}>
            {loading ? 'Creating...' : 'Create Flag'}
          </button>
          <button type="button" onClick={onCancel} style={styles.cancelButton}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  formContainer: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '24px',
  },
  formTitle: {
    margin: '0 0 20px 0',
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#555',
  },
  input: {
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    outline: 'none',
  },
  textarea: {
    resize: 'vertical' as const,
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  submitButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#f5f5f5',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  error: {
    padding: '12px',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '4px',
    fontSize: '14px',
  },
};
