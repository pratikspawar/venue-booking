import { useState } from 'react';
import { X, Clock, AlertTriangle, ArrowRightLeft, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useVenueStore } from '../../store/useVenueStore';

export const ExtendSessionModal = () => {
  const {
    isExtendModalOpen,
    closeExtendModal,
    sessionToExtend,
    extendConflictData,
    executeExtendSession,
    executeSwapResource,
    resources,
  } = useVenueStore();

  const [extraMinutes, setExtraMinutes] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isExtendModalOpen || !sessionToExtend) return null;

  const currentResource = resources.find((r) => r.id === sessionToExtend.id) || sessionToExtend;
  const sameSportAlternatives = resources.filter(
    (r) => r.sport === sessionToExtend.sport && r.id !== sessionToExtend.id && r.status === 'AVAILABLE'
  );

  const handleInPlaceExtend = async () => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    try {
      const res = await executeExtendSession(sessionToExtend.id, extraMinutes);
      if (res.success) {
        setSuccessMessage(res.message || `Extended session by ${extraMinutes} mins`);
        setTimeout(() => {
          setSuccessMessage(null);
          closeExtendModal();
        }, 1200);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwapAndExtend = async (targetResourceId: number) => {
    setIsSubmitting(true);
    try {
      await executeSwapResource(
        sessionToExtend.id,
        targetResourceId,
        `Customer extended session (+${extraMinutes}m); current table occupied next slot.`
      );
      setSuccessMessage('Successfully swapped table and extended session!');
      setTimeout(() => {
        setSuccessMessage(null);
        closeExtendModal();
      }, 1200);
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
          maxWidth: '560px',
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
                background: extendConflictData?.conflict ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: extendConflictData?.conflict ? '#f87171' : 'var(--accent-primary)',
              }}
            >
              {extendConflictData?.conflict ? <AlertTriangle size={20} /> : <Clock size={20} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>
                {extendConflictData?.conflict ? 'Slot Conflict Resolution' : 'Extend Live Session'}
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {currentResource.name} • {currentResource.customerName || 'Active Player'}
              </p>
            </div>
          </div>
          <button
            onClick={closeExtendModal}
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
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

          {/* Time increment selector */}
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
              Select Extension Duration:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {[15, 30, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setExtraMinutes(mins)}
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    border: extraMinutes === mins ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    background: extraMinutes === mins ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    color: extraMinutes === mins ? '#818cf8' : 'var(--text-main)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  +{mins} Minutes
                </button>
              ))}
            </div>
          </div>

          {/* Conflict Alert View (Tier 2 / Tier 3) */}
          {extendConflictData?.conflict ? (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <ShieldAlert size={20} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ color: '#f87171', fontWeight: 700, fontSize: '0.92rem' }}>
                    Next Slot is Already Booked on Current Table!
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px' }}>
                    Another customer has reserved {currentResource.name} for the upcoming slot. You cannot extend on this exact table without collision.
                  </div>
                </div>
              </div>

              {/* Tier 2: Alternative Tables Available for Table Swap */}
              {sameSportAlternatives.length > 0 ? (
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#38bdf8', marginBottom: '8px' }}>
                    Available Alternative Tables of Same Sport (Instant Swap):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {sameSportAlternatives.map((alt) => (
                      <div
                        key={alt.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          background: 'rgba(15, 23, 42, 0.7)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{alt.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>
                            ● Ready & Available
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ padding: '6px 14px', fontSize: '0.8rem', gap: '6px' }}
                          disabled={isSubmitting}
                          onClick={() => handleSwapAndExtend(alt.id)}
                        >
                          <ArrowRightLeft size={14} />
                          <span>Move to {alt.name} & Extend</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Tier 3: Hard Stop Required */
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px dashed rgba(239, 68, 68, 0.4)',
                  }}
                >
                  <div style={{ color: '#fca5a5', fontWeight: 600, fontSize: '0.85rem' }}>
                    Tier 3 Graceful Hard Stop Required
                  </div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginTop: '4px' }}>
                    All {sessionToExtend.sport} tables and courts are booked for the next slot. Please alert the player to wrap up in 5-10 minutes for next customer arrival.
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Tier 1: In-place extension confirmation */
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} color="#34d399" />
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#34d399' }}>
                  Next Slot is Open for In-Place Extension
                </span>
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                No conflicting reservation exists on {currentResource.name}. The customer can continue playing without interruption.
              </p>
            </div>
          )}
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
            onClick={closeExtendModal}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          {!extendConflictData?.conflict && (
            <button
              type="button"
              className="btn btn-primary"
              disabled={isSubmitting}
              onClick={handleInPlaceExtend}
            >
              <Clock size={16} />
              <span>{isSubmitting ? 'Extending...' : `Extend In-Place (+${extraMinutes}m)`}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
