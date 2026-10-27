import React from 'react';
import { Crown, Users, Percent } from 'lucide-react';

interface MembershipStatsCardsProps {
  plansCount: number;
  activeSubscribersCount: number;
}

export const MembershipStatsCards: React.FC<MembershipStatsCardsProps> = ({
  plansCount,
  activeSubscribersCount,
}) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
      }}
    >
      {/* Plans Count Card */}
      <div
        style={{
          backgroundColor: '#0f172a',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'rgba(234, 179, 8, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#eab308',
          }}
        >
          <Crown size={26} />
        </div>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
            Membership Plans
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>
            {plansCount}
          </div>
        </div>
      </div>

      {/* Active Subscribers Card */}
      <div
        style={{
          backgroundColor: '#0f172a',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#818cf8',
          }}
        >
          <Users size={26} />
        </div>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
            Active Subscribers
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>
            {activeSubscribersCount}
          </div>
        </div>
      </div>

      {/* Auto-Discount Engine Status */}
      <div
        style={{
          backgroundColor: '#0f172a',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#34d399',
          }}
        >
          <Percent size={26} />
        </div>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
            Auto-Discount Engine
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
            ● Synchronized
          </div>
        </div>
      </div>
    </div>
  );
};
