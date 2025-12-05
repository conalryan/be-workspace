import React, { useState } from 'react';
import { FeatureFlag, UpdateFeatureFlagDto } from '../types/feature-flag.types';

interface EditFlagFormProps {
  flag: FeatureFlag;
  onSubmit: (key: string, data: UpdateFeatureFlagDto) => Promise<void>;
  onCancel: () => void;
}

export const EditFlagForm: React.FC<EditFlagFormProps> = ({ flag, onSubmit, onCancel }) => {
  const [description, setDescription] = useState(flag.description);
  const [enabled, setEnabled] = useState(flag.enabled);
  const [flagData, setFlagData] = useState(JSON.stringify(flag.flag_data, null, 2));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const parsedData = JSON.parse(flagData);
      
      await onSubmit(flag.flag_key, {
        description,
        enabled,
        flag_data: parsedData,
      });
    } catch (err: any) {
      setError(err.message || 'Invalid JSON or submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.formContainer}>
      <h3 style={styles.formTitle}>Edit Feature Flag: {flag.flag_key}</h3>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label htmlFor="description" style={styles.label}>
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
            rows={8}
            style={{ ...styles.input, ...styles.textarea, fontFamily: 'monospace' }}
          />
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.buttonGroup}>
          <button type="submit" disabled={loading} style={styles.submitButton}>
            {loading ? 'Updating...' : 'Update Flag'}
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
    backgroundColor: '#2196F3',
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
