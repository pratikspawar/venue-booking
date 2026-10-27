import React from 'react';
import { X, AlertCircle, ShieldCheck, ArrowRight, RotateCcw } from 'lucide-react';
import { RefundPolicyModalController } from './RefundPolicyModal.controller';
import { styles } from './RefundPolicyModal.styles';
import './RefundPolicyModal.css';

interface RefundPolicyModalViewProps {
  controller: RefundPolicyModalController;
}

export const RefundPolicyModalView: React.FC<RefundPolicyModalViewProps> = ({ controller }) => {
  const {
    isOpen,
    booking,
    reason,
    setReason,
    reasonCode,
    setReasonCode,
    managerApprovalCode,
    setManagerApprovalCode,
    errorMsg,
    isProcessing,
    paidAmount,
    isHighValue,
    refundPercent,
    refundAmount,
    retentionFee,
    handleConfirm,
    closeModal,
  } = controller;

  if (!isOpen || !booking) return null;

  return (
    <div style={styles.backdrop}>
      <div className="glass-panel" style={styles.modalCard}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={styles.iconBox}>
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
            onClick={closeModal}
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
        <div style={styles.snapshotBox}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Booking Reference:</span>
            <strong style={{ color: 'var(--accent-primary)' }}>#{booking.id}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
            <span style={{ color: '#fff' }}>{booking.customerName} ({booking.customerPhone})</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Resource & Slot:</span>
            <span style={{ color: '#fff' }}>{booking.resourceName} • {booking.timeWindow}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Payment Mode:</span>
            <span style={{ color: 'var(--accent-cyan)' }}>{booking.paymentMode}</span>
          </div>
        </div>

        {/* Policy Refund Calculation Breakdown */}
        <div style={styles.policyBox}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <ShieldCheck size={18} color="#818cf8" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#c7d2fe' }}>
              Tiered Cancellation Policy (Venue Rule Active)
            </span>
          </div>

          <div style={styles.statsGrid}>
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

        {/* Reason Code & Audit Note */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Reason Category
            </label>
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              style={styles.selectInput}
            >
              <option value="CUSTOMER_REQUEST">Customer Request</option>
              <option value="EQUIPMENT_ISSUE">Equipment Issue</option>
              <option value="WEATHER_EMERGENCY">Weather / Force Majeure</option>
              <option value="OPERATIONAL_RELOAD">Double-Booking / Reschedule</option>
              <option value="OTHER">Other Operational</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Cancellation Reason & Audit Log Note
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={styles.textInput}
            />
          </div>
        </div>

        {/* Manager Approval Code */}
        {isHighValue && (
          <div style={styles.managerCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fbbf24' }}>
                Manager Authorization Required (Amount &gt; ₹500)
              </span>
              <span style={{ fontSize: '0.74rem', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.2)', padding: '2px 6px', borderRadius: '4px' }}>
                Role Policy Guard
              </span>
            </div>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              Standard desk staff cannot cancel bookings exceeding ₹500 without a designated Manager or Owner approval code.
            </p>
            <input
              type="password"
              placeholder="Enter Manager Approval Code or PIN"
              value={managerApprovalCode}
              onChange={(e) => setManagerApprovalCode(e.target.value)}
              style={styles.managerPinInput}
            />
          </div>
        )}

        {/* Error message banner */}
        {errorMsg && (
          <div style={styles.errorBanner}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Warning Note */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '20px', color: '#94a3b8', fontSize: '0.78rem' }}>
          <AlertCircle size={16} color="#fbbf24" style={{ flexShrink: 0 }} />
          <span>Confirming will immediately release the reserved slot cells in the database and issue refund via gateway.</span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={closeModal}
            disabled={isProcessing}
            style={styles.cancelBtn}
          >
            Keep Booking
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            style={styles.confirmBtn}
          >
            {isProcessing ? 'Processing Refund...' : 'Confirm Cancellation & Refund'}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
