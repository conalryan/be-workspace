import React, { useState, useEffect } from 'react';
import { FeatureFlag, CreateFeatureFlagDto, UpdateFeatureFlagDto } from './types/feature-flag.types';
import { featureFlagApi } from './services/api';
import { CreateFlagForm } from './components/CreateFlagForm';
import { EditFlagForm } from './components/EditFlagForm';
import { FlagList } from './components/FlagList';

function App() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Load flags on mount
  useEffect(() => {
    loadFlags();
  }, []);

  const loadFlags = async (search?: string) => {
    try {
      setLoading(true);
      setError('');
      const data = await featureFlagApi.getAllFlags(search);
      setFlags(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load feature flags');
      console.error('Load flags error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadFlags(searchTerm || undefined);
  };

  const handleCreateFlag = async (data: CreateFeatureFlagDto) => {
    await featureFlagApi.createFlag(data);
    setShowCreateForm(false);
    await loadFlags();
  };

  const handleUpdateFlag = async (key: string, data: UpdateFeatureFlagDto) => {
    await featureFlagApi.updateFlag(key, data);
    setEditingFlag(null);
    await loadFlags();
  };

  const handleToggleFlag = async (key: string) => {
    try {
      await featureFlagApi.toggleFlag(key);
      await loadFlags();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle flag');
    }
  };

  const handleDeleteFlag = async (key: string) => {
    try {
      await featureFlagApi.deleteFlag(key);
      await loadFlags();
    } catch (err: any) {
      alert(err.message || 'Failed to delete flag');
    }
  };

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.title}>🚩 Feature Flags Manager</h1>
        <p style={styles.subtitle}>Manage your application feature flags with PostgreSQL JSONB storage</p>
      </header>

      <main style={styles.main}>
        {/* Search and Action Bar */}
        <div style={styles.actionBar}>
          <form onSubmit={handleSearch} style={styles.searchForm}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search flags..."
              style={styles.searchInput}
            />
            <button type="submit" style={styles.searchButton}>
              🔍 Search
            </button>
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  loadFlags();
                }}
                style={styles.clearButton}
              >
                Clear
              </button>
            )}
          </form>
          
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={styles.createButton}
          >
            {showCreateForm ? '✕ Cancel' : '+ Create New Flag'}
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <CreateFlagForm
            onSubmit={handleCreateFlag}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {/* Edit Form */}
        {editingFlag && (
          <EditFlagForm
            flag={editingFlag}
            onSubmit={handleUpdateFlag}
            onCancel={() => setEditingFlag(null)}
          />
        )}

        {/* Error Message */}
        {error && (
          <div style={styles.errorBanner}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={styles.loadingState}>
            <div style={styles.spinner}>⟳</div>
            <p>Loading feature flags...</p>
          </div>
        )}

        {/* Flag List */}
        {!loading && (
          <>
            <div style={styles.flagCount}>
              {flags.length} flag{flags.length !== 1 ? 's' : ''} found
            </div>
            <FlagList
              flags={flags}
              onEdit={setEditingFlag}
              onToggle={handleToggleFlag}
              onDelete={handleDeleteFlag}
            />
          </>
        )}
      </main>

      <footer style={styles.footer}>
        <p style={styles.footerText}>
          Feature Flags API | PostgreSQL JSONB Storage | Express + React
        </p>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    backgroundColor: '#2c3e50',
    color: '#fff',
    padding: '32px 24px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '32px',
    fontWeight: '700',
  },
  subtitle: {
    margin: 0,
    fontSize: '16px',
    opacity: 0.9,
  },
  main: {
    flex: 1,
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    padding: '32px 24px',
  },
  actionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    gap: '16px',
    flexWrap: 'wrap' as const,
  },
  searchForm: {
    display: 'flex',
    gap: '8px',
    flex: 1,
    minWidth: '300px',
  },
  searchInput: {
    flex: 1,
    padding: '10px 16px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    outline: 'none',
  },
  searchButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#607D8B',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  clearButton: {
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#f5f5f5',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  createButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  errorBanner: {
    padding: '16px',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '4px',
    marginBottom: '24px',
    border: '1px solid #fcc',
  },
  loadingState: {
    textAlign: 'center',
    padding: '48px 24px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  spinner: {
    fontSize: '48px',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  },
  flagCount: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#666',
    marginBottom: '16px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  footer: {
    backgroundColor: '#2c3e50',
    color: '#fff',
    padding: '24px',
    textAlign: 'center',
    marginTop: 'auto',
  },
  footerText: {
    margin: 0,
    fontSize: '14px',
    opacity: 0.9,
  },
};

export default App;
