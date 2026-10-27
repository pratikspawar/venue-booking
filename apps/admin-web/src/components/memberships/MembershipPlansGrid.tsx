import React from 'react';
import { ToggleLeft, ToggleRight, Percent, Clock } from 'lucide-react';
import { MembershipPlan } from '../../types';

interface MembershipPlansGridProps {
  plans: MembershipPlan[];
  togglingId: number | null;
  onTogglePlan: (planId: number) => void;
}

export const MembershipPlansGrid: React.FC<MembershipPlansGridProps> = ({
  plans,
  togglingId,
  onTogglePlan,
}) => {
  if (plans.length === 0) {
    return (
      <div
        style={{
          padding: '48px 24px',
          textAlign: 'center',
          backgroundColor: '#0f172a',
          borderRadius: '16px',
          border: '1px solid #1e293b',
          color: '#94a3b8',
        }}
      >
        No membership plans configured yet. Click "New Membership Tier" above to create one.
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px',
      }}
    >
      {plans.map((plan) => {
        const isToggling = togglingId === plan.id;
        return (
          <div
            key={plan.id}
            style={{
              backgroundColor: '#0f172a',
              borderRadius: '18px',
              border: plan.active ? '1px solid rgba(234, 179, 8, 0.35)' : '1px solid #1e293b',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: plan.active ? '0 10px 25px -5px rgba(234, 179, 8, 0.08)' : 'none',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Active Status Badge & Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    backgroundColor: plan.active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: plan.active ? '#34d399' : '#f87171',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {plan.active ? 'Active Tier' : 'Paused'}
                </div>
                {plan.sportCode ? (
                  <div
                    style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      backgroundColor: '#1e293b',
                      color: '#94a3b8',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                    }}
                  >
                    {plan.sportCode}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      backgroundColor: 'rgba(99, 102, 241, 0.15)',
                      color: '#818cf8',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                    }}
                  >
                    All Sports
                  </div>
                )}
              </div>

              <button
                onClick={() => onTogglePlan(plan.id)}
                disabled={isToggling}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: plan.active ? '#34d399' : '#64748b',
                  cursor: isToggling ? 'not-allowed' : 'pointer',
                  padding: 0,
                  opacity: isToggling ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                }}
                title={plan.active ? 'Click to Pause' : 'Click to Activate'}
              >
                {plan.active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
              </button>
            </div>

            {/* Plan Name & Price */}
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                {plan.name}
              </h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
                <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#eab308' }}>
                  ₹{plan.priceRupees || (plan.pricePaise / 100).toFixed(0)}
                </span>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                  / {plan.durationDays} days
                </span>
              </div>
            </div>

            {/* Benefits / Perks */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                padding: '14px',
                backgroundColor: '#1e293b',
                borderRadius: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Percent size={16} color="#34d399" />
                <span style={{ fontSize: '0.875rem', color: '#f8fafc', fontWeight: 600 }}>
                  {plan.discountPercent}% Instant Checkout Discount
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={16} color="#38bdf8" />
                <span style={{ fontSize: '0.875rem', color: '#f8fafc', fontWeight: 600 }}>
                  {plan.freeMinutes} Mins Complimentary Free Hours
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
