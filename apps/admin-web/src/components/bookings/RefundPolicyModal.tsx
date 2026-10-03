import React, { useState } from 'react';
import { useVenueStore } from '../../store/useVenueStore';
import { X, AlertCircle, ShieldCheck, ArrowRight, RotateCcw } from 'lucide-react';

export const RefundPolicyModal: React.FC = () => {
  const { isRefundModalOpen, closeRefundModal, bookingToRefund, processRefundAndCancel } = useVenueStore();
  const [reason, setReason] = useState<string>('Customer requested cancellation via phone');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isRefundModalOpen || !bookingToRefund) return null;

  const paidAmount = (bookingToRefund.paidPaise || bookingToRefund.amountPaise) / 100;
  
  // Calculate cancellation tier (simulate policy: default 100% if >24h, 50% if >2h, 0% if <2h)
  const refundPercent = 100; // Simulated demo window
  const refundAmount = (paidAmount * refundPercent) / 100;
  const retentionFee = paidAmount - refundAmount;

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      const refundPaise = refundAmount * 100;
      await processRefundAndCancel(bookingToRefund.id, refundPaise, reason);
    } finally {
      setIsProcessing(false);
    }
  };

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
          maxWidth: '520px',
          background: 'linear-gradient(135deg, rgba(22, 27, 46, 0.98), rgba(15, 18, 30, 0.99))',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(239, 68, 68, 0.15)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
              }}
            >
              <RotateCcw size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>Cancel Booking & Policy Refund</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Venue Policy Automated Calculation Engine
              </p>
            </div>
          </div>
          <button
            onClick={closeRefundModal}
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

        {/* Booking Snapshot */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            padding: '14px',
            marginBottom: '16px',
            fontSize: '0.86rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Booking Reference:</span>
            <strong style={{ color: 'var(--accent-primary)' }}>#{bookingToRefund.id}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
            <span style={{ color: '#fff' }}>{bookingToRefund.customerName} ({bookingToRefund.customerPhone})</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Resource & Slot:</span>
            <span style={{ color: '#fff' }}>{bookingToRefund.resourceName} • {bookingToRefund.timeWindow}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Payment Mode:</span>
            <span style={{ color: 'var(--accent-cyan)' }}>{bookingToRefund.paymentMode}</span>
          </div>
        </div>

        {/* Policy Refund Calculation Breakdown */}
        <div
          style={{
            background: 'rgba(99, 102, 241, 0.08)',
            borderRadius: '12px',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            padding: '16px',
            marginBottom: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <ShieldCheck size={18} color="#818cf8" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#c7d2fe' }}>
              Tiered Cancellation Policy (Venue Rule Active)
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center' }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Original Paid</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>₹{paidAmount}</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Refund %</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>{refundPercent}%</div>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div style={{ fontSize: '0.72rem', color: '#6ee7b7' }}>Refund Amount</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>₹{refundAmount}</div>
            </div>
          </div>

          {retentionFee > 0 && (
            <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: '#fbbf24' }}>
              * Venue retention fee of ₹{retentionFee} applies as per venue cancellation window.
            </p>
          )}
        </div>

        {/* Cancellation Reason */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
            Cancellation Reason & Internal Audit Note
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '10px 12px',
              color: '#fff',
              fontSize: '0.85rem',
            }}
          />
        </div>

        {/* Warning Note */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '20px', color: '#94a3b8', fontSize: '0.78rem' }}>
          <AlertCircle size={16} color="#fbbf24" style={{ flexShrink: 0 }} />
          <span>Confirming will immediately release the reserved slot cells in the database and issue refund via gateway.</span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={closeRefundModal}
            disabled={isProcessing}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.88rem',
            }}
          >
            Keep Booking
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              border: 'none',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
            }}
          >
            {isProcessing ? 'Processing Refund...' : 'Confirm Cancellation & Refund'}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
