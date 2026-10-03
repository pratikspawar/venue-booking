import { useState, FormEvent } from 'react';
import { useVenueStore } from '../../store/useVenueStore';

export const WalkinModal = () => {
  const {
    isWalkinModalOpen,
    closeWalkinModal,
    resources,
    selectedResourceIdForWalkin,
    startSession,
  } = useVenueStore();

  const [resourceId, setResourceId] = useState<number>(selectedResourceIdForWalkin);
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isWalkinModalOpen) return null;

  const availableResources = resources.filter((r) => r.status === 'AVAILABLE');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await startSession(resourceId || availableResources[0]?.id || 1, name, phone);
      setName('');
      setPhone('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div className="glass-panel" style={{ width: '440px', padding: '32px' }}>
        <h2 style={{ fontSize: '1.35rem', marginBottom: '8px', marginTop: 0 }}>Create Walk-in Session</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
          Instant table / PlayStation 5 console assignment. Starts live billing immediately.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
              Select Table / Console
            </label>
            <select
              value={resourceId}
              onChange={(e) => setResourceId(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: '#fff',
                fontSize: '0.9rem',
              }}
            >
              {availableResources.map((r) => (
                <option key={r.id} value={r.id} style={{ background: '#0f172a' }}>
                  {r.name} (₹{r.ratePerHour}/hr)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
              Customer Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Sahil P."
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: '#fff',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
              Mobile Phone (Optional for SMS receipt)
            </label>
            <input
              type="tel"
              placeholder="+91 98..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: '#fff',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={closeWalkinModal}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
              {isSubmitting ? 'Starting...' : 'Start Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
