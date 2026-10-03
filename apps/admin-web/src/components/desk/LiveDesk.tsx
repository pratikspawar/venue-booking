import { useVenueStore } from '../../store/useVenueStore';
import { SessionTimerCard } from './SessionTimerCard';
import { Gamepad2, Receipt } from 'lucide-react';

export const LiveDesk = () => {
  const { resources, sports, filterSport, setFilterSport, openShiftSummaryModal } = useVenueStore();

  const sportsList = ['ALL', ...sports.map((s) => s.code)];

  const filteredResources = resources.filter((r) => {
    if (filterSport !== 'ALL' && r.sport !== filterSport) return false;
    return true;
  });

  const activeCount = resources.filter((r) => r.status === 'IN_PROGRESS').length;
  const availableCount = resources.filter((r) => r.status === 'AVAILABLE').length;

  return (
    <div>
      {/* Category Pills & Quick Filter Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {sportsList.map((sportCode) => {
            const sportObj = sports.find((s) => s.code === sportCode);
            const label = sportCode === 'ALL' ? 'All Units' : (sportObj?.nameEn || sportCode);
            const icon = sportObj?.icon || (sportCode === 'ALL' ? '⚡' : '🏆');

            return (
              <button
                key={sportCode}
                onClick={() => setFilterSport(sportCode)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: filterSport === sportCode ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  background: filterSport === sportCode ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  color: filterSport === sportCode ? '#818cf8' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {icon} {label}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          <div>
            Active Sessions: <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>{activeCount}</span>
          </div>
          <div>
            Available Units: <span style={{ color: '#fff', fontWeight: 700 }}>{availableCount}</span>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => openShiftSummaryModal()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              borderColor: 'var(--accent-primary)',
              color: '#a5b4fc',
            }}
          >
            <Receipt size={14} />
            <span>Shift Cash Summary</span>
          </button>
        </div>
      </div>

      {/* Grid of Consoles and Tables */}
      {filteredResources.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: '48px',
            textAlign: 'center',
            color: 'var(--text-dim)',
          }}
        >
          <Gamepad2 size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <div>No active units found matching the selected game filter.</div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '24px',
          }}
        >
          {filteredResources.map((session) => (
            <SessionTimerCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
};
