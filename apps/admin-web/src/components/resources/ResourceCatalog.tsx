import { useState } from 'react';
import { useVenueStore } from '../../store/useVenueStore';
import { Plus, Search, Gamepad2, Settings, Trophy } from 'lucide-react';

export const ResourceCatalog = () => {
  const { resources, sports, openAddResourceModal, openAddSportModal } = useVenueStore();
  const [filterSport, setFilterSport] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filterList = ['ALL', ...sports.map((s) => s.code)];

  const filtered = resources.filter((r) => {
    if (filterSport !== 'ALL' && r.sport !== filterSport) return false;
    if (searchTerm && !r.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="glass-panel" style={{ padding: '28px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Venue Resource & Game Catalog</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
            Manage PlayStation consoles, pool tables, courts, and configure slot lengths and billing modes.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-dim)',
              }}
            />
            <input
              type="text"
              placeholder="Search resource..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px 8px 36px',
                color: '#fff',
                fontSize: '0.85rem',
              }}
            />
          </div>

          <button
            className="btn btn-secondary"
            onClick={openAddSportModal}
            style={{ gap: '6px' }}
          >
            <Trophy size={16} color="var(--accent-primary)" />
            <span>+ Add Sport</span>
          </button>

          <button
            className="btn btn-primary"
            onClick={openAddResourceModal}
            style={{ gap: '6px' }}
          >
            <Plus size={16} />
            <span>+ Add Resource</span>
          </button>
        </div>
      </div>

      {/* Dynamic Sport Category Filter Chips */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {filterList.map((code) => {
          const sportObj = sports.find((s) => s.code === code);
          const label = code === 'ALL' ? 'All Games' : (sportObj?.nameEn || code);
          const icon = sportObj?.icon || (code === 'ALL' ? '⚡' : '🏆');

          return (
            <button
              key={code}
              onClick={() => setFilterSport(code)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem',
                fontWeight: 600,
                border: filterSport === code ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                background: filterSport === code ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                color: filterSport === code ? '#818cf8' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              {icon} {label}
            </button>
          );
        })}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
        <thead>
          <tr
            style={{
              borderBottom: '1px solid var(--border-subtle)',
              color: 'var(--text-dim)',
              fontSize: '0.78rem',
              textTransform: 'uppercase',
            }}
          >
            <th style={{ padding: '12px 16px' }}>Resource Name</th>
            <th style={{ padding: '12px 16px' }}>Sport / Category</th>
            <th style={{ padding: '12px 16px' }}>Billing Mode</th>
            <th style={{ padding: '12px 16px' }}>Slot Duration</th>
            <th style={{ padding: '12px 16px' }}>Base Rate</th>
            <th style={{ padding: '12px 16px' }}>Status</th>
            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => {
            const sportObj = sports.find((s) => s.code === r.sport);
            return (
              <tr key={r.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Gamepad2 size={16} color="var(--accent-primary)" />
                    <span>{r.name}</span>
                  </div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    {sportObj?.icon || '🏆'} {sportObj?.nameEn || r.sport}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                  {r.billingMode.replace('_', ' ')}
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--text-dim)' }}>
                  {r.slotMinutes || 60} mins
                </td>
                <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                  ₹{r.ratePerHour}/hr
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span
                    style={{
                      color:
                        r.status === 'IN_PROGRESS'
                          ? 'var(--accent-emerald)'
                          : r.status === 'HELD'
                          ? 'var(--accent-amber)'
                          : 'var(--text-muted)',
                    }}
                  >
                    ● {r.status}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: '0.8rem', gap: '6px' }}>
                    <Settings size={14} />
                    <span>Configure</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
