import { useState } from 'react';
import { X, ArrowRightLeft, CheckCircle2 } from 'lucide-react';
import { useVenueStore } from '../../store/useVenueStore';

export const SwapResourceModal = () => {
  const {
    isSwapModalOpen,
    closeSwapModal,
    sessionToSwap,
    resources,
    executeSwapResource,
  } = useVenueStore();

  const [targetResourceId, setTargetResourceId] = useState<number | null>(null);
  const [reason, setReason] = useState('Customer requested table change');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isSwapModalOpen || !sessionToSwap) return null;

  // Filter available tables of the same sport or all available tables
  const availableAlternatives = resources.filter(
    (r) => r.id !== sessionToSwap.id && r.status === 'AVAILABLE'
  );

  const handleSwap = async () => {
    if (!targetResourceId) return;
    setIsSubmitting(true);
    setSuccessMessage(null);
    try {
      await executeSwapResource(sessionToSwap.id, targetResourceId, reason);
      setSuccessMessage('Session transferred successfully to new table!');
      setTimeout(() => {
        setSuccessMessage(null);
        closeSwapModal();
      }, 1000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
              }}
            >
              <ArrowRightLeft size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Swap Table / Resource</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Transfer player from {sessionToSwap.name}
              </p>
            </div>
          </div>
          <button
            onClick={closeSwapModal}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {successMessage && (
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 'var(--radius-sm)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.9rem',
              }}
            >
              <CheckCircle2 size={18} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Current Session Snapshot */}
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.85rem',
            }}
          >
            <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Current Player:</div>
            <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
              {sessionToSwap.customerName || 'Walk-in Guest'}
            </div>
            <div style={{ color: 'var(--accent-cyan)', fontSize: '0.78rem', marginTop: '4px' }}>
              From: {sessionToSwap.name} ({sessionToSwap.sport})
            </div>
          </div>

          {/* Select Target Resource */}
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
              Select Destination Table / Console:
            </label>
            {availableAlternatives.length === 0 ? (
              <div
                style={{
                  padding: '16px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px dashed rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: '0.85rem',
                  textAlign: 'center',
                }}
              >
                No alternative tables are currently available. All units are occupied.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                {availableAlternatives.map((alt) => {
                  const isSelected = targetResourceId === alt.id;
                  const isSameSport = alt.sport === sessionToSwap.sport;
                  return (
                    <div
                      key={alt.id}
                      onClick={() => setTargetResourceId(alt.id)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                        background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{alt.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {alt.sport} • ₹{alt.ratePerHour}/hr
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isSameSport && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(16, 185, 129, 0.2)',
                              color: '#34d399',
                            }}
                          >
                            Exact Match
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)',
                            fontWeight: 700,
                          }}
                        >
                          {isSelected ? '✓ Selected' : 'Choose'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reason note */}
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Reason for Table Swap (Logged in Audit Trail):
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input-field"
              placeholder="e.g. Controller issue, customer preference, slot extension"
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                fontSize: '0.85rem',
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            background: 'rgba(15, 23, 42, 0.6)',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={closeSwapModal}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!targetResourceId || isSubmitting}
            onClick={handleSwap}
          >
            <ArrowRightLeft size={16} />
            <span>{isSubmitting ? 'Swapping...' : 'Confirm Table Swap'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
