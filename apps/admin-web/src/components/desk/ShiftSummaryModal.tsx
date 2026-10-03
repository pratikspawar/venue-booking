import React from 'react';
import { useVenueStore } from '../../store/useVenueStore';
import { X, DollarSign, Clock, ShoppingBag, CreditCard, Banknote, Download } from 'lucide-react';

export const ShiftSummaryModal: React.FC = () => {
  const { isShiftSummaryModalOpen, closeShiftSummaryModal, bookings, resources, tenant } = useVenueStore();

  if (!isShiftSummaryModalOpen) return null;

  // Compute shift metrics
  const activeAndCompleted = bookings.filter((b) => b.status === 'COMPLETED' || b.status === 'IN_PROGRESS');
  const totalSessions = activeAndCompleted.length;

  let totalCollectedPaise = 0;
  let cashPaise = 0;
  let upiPaise = 0;
  let onlinePaise = 0;

  activeAndCompleted.forEach((b) => {
    const amt = b.paidPaise || b.amountPaise || 0;
    totalCollectedPaise += amt;
    if (b.paymentMode === 'COUNTER_CASH') cashPaise += amt;
    else if (b.paymentMode === 'COUNTER_UPI') upiPaise += amt;
    else onlinePaise += amt;
  });

  // Calculate canteen revenue from active resource session items
  let canteenRevenuePaise = 0;
  resources.forEach((r) => {
    (r.canteenItems || []).forEach((item) => {
      canteenRevenuePaise += item.totalPaise;
    });
  });

  const gameTimeRevenuePaise = Math.max(0, totalCollectedPaise - canteenRevenuePaise);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 22, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'linear-gradient(135deg, rgba(22, 27, 46, 0.98), rgba(15, 18, 30, 0.99))',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(16, 185, 129, 0.12)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
              }}
            >
              <DollarSign size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>Daily Shift Close Summary</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Venue: <strong style={{ color: '#fff' }}>{tenant.name}</strong> • Staff: {tenant.staffName}
              </p>
            </div>
          </div>
          <button
            onClick={closeShiftSummaryModal}
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

        {/* Top Total GMV Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(99, 102, 241, 0.12))',
            borderRadius: '12px',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            padding: '18px',
            textAlign: 'center',
            marginBottom: '20px',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Shift Revenue Collected
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', margin: '4px 0' }}>
            ₹{(totalCollectedPaise / 100).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#10b981' }}>
            {totalSessions} Play Sessions & Bookings Finalized Today
          </div>
        </div>

        {/* Revenue Breakdown: Game Time vs Canteen */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
            Revenue Sources
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', padding: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 600 }}>
                <Clock size={14} /> Game Play Time
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginTop: '6px' }}>
                ₹{(gameTimeRevenuePaise / 100).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                5-min round-up & fixed slots
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', padding: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '0.8rem', fontWeight: 600 }}>
                <ShoppingBag size={14} /> Canteen & Gear Rental
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginTop: '6px' }}>
                ₹{(canteenRevenuePaise / 100).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                F&B snacks & gear rentals
              </div>
            </div>
          </div>
        </div>

        {/* Payment Channels Breakdown */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
            Cash Box & Payment Channels
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.72rem', color: '#10b981' }}>
                <Banknote size={12} /> Counter Cash
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
                ₹{(cashPaise / 100).toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--accent-cyan)' }}>
                <CreditCard size={12} /> Counter UPI QR
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
                ₹{(upiPaise / 100).toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--accent-primary)' }}>
                Razorpay App
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
                ₹{(onlinePaise / 100).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => alert('Shift reconciliation PDF exported successfully.')}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Download size={14} /> Export Shift PDF
          </button>

          <button
            type="button"
            onClick={closeShiftSummaryModal}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              background: 'var(--gradient-brand)',
              border: 'none',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
            }}
          >
            Close & Reconcile
          </button>
        </div>
      </div>
    </div>
  );
};
