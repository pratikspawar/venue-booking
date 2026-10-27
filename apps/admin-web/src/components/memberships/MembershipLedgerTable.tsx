import React from 'react';
import { Search } from 'lucide-react';
import { CustomerMembership } from '../../types';

interface MembershipLedgerTableProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  members: CustomerMembership[];
}

export const MembershipLedgerTable: React.FC<MembershipLedgerTableProps> = ({
  searchQuery,
  onSearchChange,
  members,
}) => {
  return (
    <div
      style={{
        backgroundColor: '#0f172a',
        borderRadius: '16px',
        border: '1px solid #1e293b',
        overflow: 'hidden',
      }}
    >
      {/* Search Bar */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <Search size={18} color="#64748b" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter by customer ID, plan name or sport..."
          style={{
            background: 'transparent',
            border: 'none',
            color: '#f8fafc',
            fontSize: '0.9rem',
            outline: 'none',
            width: '100%',
          }}
        />
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e293b', backgroundColor: '#090d16' }}>
              <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Customer
              </th>
              <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Plan Name
              </th>
              <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Coverage
              </th>
              <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Auto Discount
              </th>
              <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Remaining Free Mins
              </th>
              <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Valid Until
              </th>
              <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: '36px 20px',
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: '0.9rem',
                  }}
                >
                  No member subscriptions found matching your query.
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr key={m.id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '16px 20px', fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc' }}>
                    User #{m.userId}
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '0.9rem', fontWeight: 700, color: '#eab308' }}>
                    {m.planName}
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '0.85rem', color: '#94a3b8' }}>
                    {m.sportCode || 'All Sports'}
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '0.9rem', fontWeight: 700, color: '#34d399' }}>
                    {m.discountPercent}% OFF
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '0.9rem', fontWeight: 600, color: '#38bdf8' }}>
                    {m.remainingFreeMinutes} mins
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '0.85rem', color: '#94a3b8' }}>
                    {new Date(m.endDate).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        backgroundColor:
                          m.status === 'ACTIVE'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(239, 68, 68, 0.15)',
                        color: m.status === 'ACTIVE' ? '#34d399' : '#f87171',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
