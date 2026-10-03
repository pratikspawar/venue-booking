import { useState, FormEvent } from 'react';
import { useVenueStore } from '../../store/useVenueStore';
import { Gamepad2, Plus } from 'lucide-react';

export const AddResourceModal = () => {
  const {
    isAddResourceModalOpen,
    closeAddResourceModal,
    sports,
    openAddSportModal,
    addResource,
  } = useVenueStore();

  const [name, setName] = useState('');
  const [sport, setSport] = useState(sports[0]?.code || 'PLAYSTATION');
  const [billingMode, setBillingMode] = useState<'TIME_PLAYED' | 'FIXED_SLOT'>('TIME_PLAYED');
  const [ratePerHour, setRatePerHour] = useState('300');
  const [slotMinutes, setSlotMinutes] = useState('60');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAddResourceModalOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await addResource({
        name: name.trim(),
        sport,
        billingMode,
        ratePerHour: Number(ratePerHour) || 250,
        slotMinutes: Number(slotMinutes) || 60,
      });
      setName('');
      setRatePerHour('300');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 105,
      }}
    >
      <div className="glass-panel" style={{ width: '480px', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <Gamepad2 size={24} color="var(--accent-primary)" />
          <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Add New Resource / Table / Court</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
          Configure a playable unit under any registered sport with custom billing rules.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Resource Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
              Resource Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Badminton Court #1, VR Vive Pod #2, PS5 Console #3"
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

          {/* Sport Selector with quick Add Sport button */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Sport / Game Category *</label>
              <button
                type="button"
                onClick={openAddSportModal}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'none',
                  border: 'none',
                  color: '#818cf8',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <Plus size={14} />
                <span>+ Add New Sport</span>
              </button>
            </div>

            <select
              value={sport}
              onChange={(e) => setSport(e.target.value)}
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
              {sports.map((s) => (
                <option key={s.code} value={s.code} style={{ background: '#0f172a' }}>
                  {s.icon || '🏆'} {s.nameEn} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Billing Mode */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
              Billing & Play Mode
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setBillingMode('TIME_PLAYED')}
                style={{
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  border: billingMode === 'TIME_PLAYED' ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  background: billingMode === 'TIME_PLAYED' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: billingMode === 'TIME_PLAYED' ? '#818cf8' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontWeight: 700 }}>Time-Played Meter</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                  5-min rounding (PS5, Snooker, VR)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setBillingMode('FIXED_SLOT')}
                style={{
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  border: billingMode === 'FIXED_SLOT' ? '1px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
                  background: billingMode === 'FIXED_SLOT' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: billingMode === 'FIXED_SLOT' ? 'var(--accent-emerald)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontWeight: 700 }}>Fixed Slot Grid</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                  Per-slot booking (Turf, Badminton)
                </div>
              </button>
            </div>
          </div>

          {/* Rate and Slot duration */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
                Base Rate (₹/hour) *
              </label>
              <input
                type="number"
                required
                min={10}
                value={ratePerHour}
                onChange={(e) => setRatePerHour(e.target.value)}
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
                Slot Grid (Minutes)
              </label>
              <select
                value={slotMinutes}
                onChange={(e) => setSlotMinutes(e.target.value)}
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
                <option value="15" style={{ background: '#0f172a' }}>15 Minutes</option>
                <option value="30" style={{ background: '#0f172a' }}>30 Minutes</option>
                <option value="45" style={{ background: '#0f172a' }}>45 Minutes</option>
                <option value="60" style={{ background: '#0f172a' }}>60 Minutes (1 Hour)</option>
                <option value="90" style={{ background: '#0f172a' }}>90 Minutes (1.5 Hours)</option>
                <option value="120" style={{ background: '#0f172a' }}>120 Minutes (2 Hours)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={closeAddResourceModal}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1.5 }} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
