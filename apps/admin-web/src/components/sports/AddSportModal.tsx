import { useState, FormEvent } from 'react';
import { useVenueStore } from '../../store/useVenueStore';
import { Trophy, Globe2 } from 'lucide-react';

export const AddSportModal = () => {
  const { isAddSportModalOpen, closeAddSportModal, addSport } = useVenueStore();

  const [nameEn, setNameEn] = useState('');
  const [code, setCode] = useState('');
  const [nameMr, setNameMr] = useState('');
  const [nameHi, setNameHi] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAddSportModalOpen) return null;

  const handleNameChange = (val: string) => {
    setNameEn(val);
    if (!code || code === nameEn.toUpperCase().replace(/\s+/g, '_')) {
      setCode(val.toUpperCase().replace(/[^A-Z0-9]/g, '_'));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() || !code.trim()) return;

    setIsSubmitting(true);
    try {
      await addSport({
        code: code.trim(),
        nameEn: nameEn.trim(),
        nameMr: nameMr.trim() || undefined,
        nameHi: nameHi.trim() || undefined,
      });
      setNameEn('');
      setCode('');
      setNameMr('');
      setNameHi('');
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
        zIndex: 110,
      }}
    >
      <div className="glass-panel" style={{ width: '460px', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <Trophy size={22} color="var(--accent-primary)" />
          <h2 style={{ fontSize: '1.35rem', margin: 0 }}>Register New Sport / Game</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '22px' }}>
          Add custom games (e.g. Badminton, Pickleball, Bowling, VR) to your venue catalog without hardcoded limits.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
              Sport / Game Name (English) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Pickleball, Badminton, VR Gaming, Bowling"
              value={nameEn}
              onChange={(e) => handleNameChange(e.target.value)}
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
              Unique System Code / Key *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. PICKLEBALL, BADMINTON, VR_GAMING"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: '#818cf8',
                fontFamily: 'monospace',
                fontWeight: 700,
                fontSize: '0.9rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Regional Multi-language inputs */}
          <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '10px' }}>
              <Globe2 size={14} />
              <span>Multi-language Display Names (Customer App)</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  मराठी नाव
                </label>
                <input
                  type="text"
                  placeholder="उदा. बॅडमिंटन"
                  value={nameMr}
                  onChange={(e) => setNameMr(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  हिंदी नाम
                </label>
                <input
                  type="text"
                  placeholder="उदा. बैडमिंटन"
                  value={nameHi}
                  onChange={(e) => setNameHi(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={closeAddSportModal}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1.5 }} disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Save & Register Sport'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
