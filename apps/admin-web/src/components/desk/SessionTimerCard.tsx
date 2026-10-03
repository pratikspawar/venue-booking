import { Clock, Play, Square, UtensilsCrossed } from 'lucide-react';
import { ResourceSession } from '../../types';
import { useVenueStore } from '../../store/useVenueStore';

interface SessionTimerCardProps {
  session: ResourceSession;
}

export const SessionTimerCard = ({ session }: SessionTimerCardProps) => {
  const { calculateElapsedMinutes, calculateCurrentBill, startSession, openSettlementModal, openCanteenModal } = useVenueStore();

  const elapsedMins = calculateElapsedMinutes(session.startedAt);
  const currentBill = calculateCurrentBill(session);
  const hours = Math.floor(elapsedMins / 60);
  const mins = elapsedMins % 60;

  const canteenTotal = (session.canteenItems || []).reduce((acc, it) => acc + it.totalPaise / 100, 0);

  const getBorderColor = () => {
    switch (session.status) {
      case 'IN_PROGRESS':
        return '4px solid var(--accent-emerald)';
      case 'HELD':
        return '4px solid var(--accent-amber)';
      case 'MAINTENANCE':
        return '4px solid var(--accent-rose)';
      default:
        return '4px solid rgba(255, 255, 255, 0.1)';
    }
  };

  const getSportColor = () => {
    switch (session.sport) {
      case 'PLAYSTATION':
        return 'var(--accent-primary)';
      case 'POOL':
        return 'var(--accent-cyan)';
      case 'TURF':
        return 'var(--accent-emerald)';
      default:
        return 'var(--accent-amber)';
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderLeft: getBorderColor(),
      }}
    >
      <div>
        {/* Card Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: getSportColor(),
                marginBottom: '4px',
              }}
            >
              {session.sport} • {session.billingMode.replace('_', ' ')}
            </div>
            <h3 style={{ fontSize: '1.15rem', margin: 0 }}>{session.name}</h3>
          </div>

          {session.status === 'IN_PROGRESS' ? (
            <span className="badge-live">Active</span>
          ) : session.status === 'HELD' ? (
            <span
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                color: 'var(--accent-amber)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: '1px solid rgba(245, 158, 11, 0.3)',
              }}
            >
              Held (8m)
            </span>
          ) : (
            <span
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-muted)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: '1px solid var(--border-subtle)',
              }}
            >
              Available
            </span>
          )}
        </div>

        {/* Content depending on status */}
        {session.status === 'IN_PROGRESS' ? (
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Player / Guest</span>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{session.customerName}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Elapsed Time</span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--accent-emerald)',
                  fontWeight: 700,
                  fontSize: '1.25rem',
                }}
              >
                <Clock size={16} />
                <span>
                  {String(hours).padStart(2, '0')}:{String(mins).padStart(2, '0')}
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '10px',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Rate: ₹{session.ratePerHour}/hr
              </span>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  ₹{currentBill}
                </span>
                {canteenTotal > 0 && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)' }}>
                    (incl. ₹{canteenTotal} items)
                  </div>
                )}
              </div>
            </div>

            {/* Attached Canteen Items List */}
            {session.canteenItems && session.canteenItems.length > 0 && (
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--border-subtle)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
                  Attached Add-ons & Gear:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {session.canteenItems.map((item, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.72rem',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: '#a5b4fc',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                      }}
                    >
                      {item.itemName} ×{item.quantity} (+₹{item.totalPaise / 100})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : session.status === 'HELD' ? (
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.08)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px',
              marginBottom: '20px',
              border: '1px dashed rgba(245, 158, 11, 0.3)',
            }}
          >
            <div style={{ color: 'var(--accent-amber)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
              Online Payment in Progress
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Slot: {session.scheduledSlot}
            </div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '6px' }}>
              Auto-release if Razorpay webhook not received within hold limit.
            </div>
          </div>
        ) : (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px 16px',
              marginBottom: '20px',
              textAlign: 'center',
              border: '1px dashed var(--border-subtle)',
            }}
          >
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Console / Table is Ready
            </div>
            <div style={{ color: 'var(--accent-primary)', fontSize: '0.82rem', fontWeight: 600, marginTop: '4px' }}>
              Rate: ₹{session.ratePerHour}/hour (5-min billing step)
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div>
        {session.status === 'IN_PROGRESS' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              style={{ width: '100%', gap: '8px', padding: '8px 12px', fontSize: '0.85rem' }}
              onClick={() => openCanteenModal(session)}
            >
              <UtensilsCrossed size={15} />
              <span>+ Canteen / Gear Rental</span>
            </button>
            <button
              className="btn btn-danger"
              style={{ width: '100%', gap: '8px' }}
              onClick={() => openSettlementModal(session)}
            >
              <Square size={16} />
              <span>Stop & Settle (₹{currentBill})</span>
            </button>
          </div>
        ) : session.status === 'AVAILABLE' ? (
          <button
            className="btn btn-secondary"
            style={{ width: '100%', gap: '8px' }}
            onClick={() => startSession(session.id)}
          >
            <Play size={16} />
            <span>Quick Start Session</span>
          </button>
        ) : (
          <button className="btn btn-secondary" style={{ width: '100%', opacity: 0.6, cursor: 'not-allowed' }} disabled>
            <span>Awaiting Online Payment</span>
          </button>
        )}
      </div>
    </div>
  );
};
