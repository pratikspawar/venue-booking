import { useState } from 'react';
import { useVenueStore } from '../../store/useVenueStore';
import { CheckCircle2, Banknote, QrCode } from 'lucide-react';

export const SettlementModal = () => {
  const {
    isSettlementModalOpen,
    closeSettlementModal,
    sessionToSettle,
    calculateElapsedMinutes,
    calculateCurrentBill,
    completeSettlement,
  } = useVenueStore();

  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI_COUNTER' | 'WALLET'>('UPI_COUNTER');
  const [discountRupees, setDiscountRupees] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isSettlementModalOpen || !sessionToSettle) return null;

  const elapsedMins = calculateElapsedMinutes(sessionToSettle.startedAt);
  const roundedMins = Math.ceil(Math.max(15, elapsedMins) / 5) * 5;
  const timePaise = Math.round((roundedMins / 60) * sessionToSettle.ratePerHour * 100);
  const gamePlayAmount = Math.round(timePaise / 100);
  const canteenTotal = (sessionToSettle.canteenItems || []).reduce((acc, it) => acc + it.totalPaise / 100, 0);
  const baseBill = calculateCurrentBill(sessionToSettle);
  const finalAmount = Math.max(0, baseBill - discountRupees);

  const handleSettle = async () => {
    setIsProcessing(true);
    try {
      await completeSettlement(paymentMethod, discountRupees * 100);
    } finally {
      setIsProcessing(false);
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
        zIndex: 100,
      }}
    >
      <div className="glass-panel" style={{ width: '480px', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <CheckCircle2 size={24} color="var(--accent-emerald)" />
          <h2 style={{ fontSize: '1.4rem', margin: 0 }}>End Session & Settle Bill</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
          {sessionToSettle.name} • Customer: {sessionToSettle.customerName || 'Walk-in Guest'}
        </p>

        {/* Bill Breakdown Box */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px',
            marginBottom: '20px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Actual Play Time:</span>
            <span style={{ fontWeight: 600 }}>{elapsedMins} mins</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Billed Duration (5-min round-up):</span>
            <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{roundedMins} mins</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Game Play Charge:</span>
            <span style={{ fontWeight: 600 }}>₹{gamePlayAmount}</span>
          </div>
          {canteenTotal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--accent-cyan)' }}>
                Canteen & Gear Items ({sessionToSettle.canteenItems?.length || 0}):
              </span>
              <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>+₹{canteenTotal}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Gross Base Amount:</span>
            <span style={{ fontWeight: 600 }}>₹{baseBill}</span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '12px',
              marginTop: '8px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <span style={{ fontSize: '1rem', fontWeight: 700 }}>Total Payable:</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
              ₹{finalAmount}
            </span>
          </div>
        </div>

        {/* Discount Input */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
            Discount / Courtesy Waiver (₹)
          </label>
          <input
            type="number"
            min={0}
            max={baseBill}
            value={discountRupees}
            onChange={(e) => setDiscountRupees(Math.max(0, Number(e.target.value)))}
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

        {/* Payment Method Selector */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
            Payment Collection Mode
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setPaymentMethod('UPI_COUNTER')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                border: paymentMethod === 'UPI_COUNTER' ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                background: paymentMethod === 'UPI_COUNTER' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                color: paymentMethod === 'UPI_COUNTER' ? '#818cf8' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              <QrCode size={16} />
              <span>Counter UPI QR</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('CASH')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                border: paymentMethod === 'CASH' ? '1px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
                background: paymentMethod === 'CASH' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                color: paymentMethod === 'CASH' ? 'var(--accent-emerald)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              <Banknote size={16} />
              <span>Cash Register</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ flex: 1 }}
            onClick={closeSettlementModal}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ flex: 1.5 }}
            onClick={handleSettle}
            disabled={isProcessing}
          >
            {isProcessing ? 'Settling...' : `Collect ₹${finalAmount} & Close`}
          </button>
        </div>
      </div>
    </div>
  );
};
