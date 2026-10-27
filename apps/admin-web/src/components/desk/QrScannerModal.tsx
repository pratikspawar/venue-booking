import { useState } from 'react';
import { X, QrCode, CheckCircle2, AlertCircle, Camera, Sparkles, User, Gamepad2 } from 'lucide-react';
import { useVenueStore } from '../../store/useVenueStore';

export const QrScannerModal = () => {
  const {
    isQrCheckinModalOpen,
    closeQrCheckinModal,
    processQrCheckin,
    bookings,
  } = useVenueStore();

  const [qrInput, setQrInput] = useState('');
  const isScanning = true;
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verifiedResult, setVerifiedResult] = useState<{
    customerName: string;
    resourceName: string;
    sportName: string;
    message: string;
  } | null>(null);

  if (!isQrCheckinModalOpen) return null;

  const handleScanSubmit = async (codeToVerify?: string) => {
    const code = (codeToVerify || qrInput).trim();
    if (!code) {
      setErrorMsg('Please enter or scan a ticket code');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setVerifiedResult(null);

    try {
      const res = await processQrCheckin(code);
      setVerifiedResult({
        customerName: res.customerName || 'Customer',
        resourceName: res.resourceName || 'Booked Resource',
        sportName: 'Active Session',
        message: res.message || 'Check-in verified! Live play timer started.',
      });
      setQrInput('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or unverified ticket QR code');
    } finally {
      setIsProcessing(false);
    }
  };

  // Preset fast test tickets from bookings
  const sampleTickets = bookings.slice(0, 3);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-emerald)',
              }}
            >
              <QrCode size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Merchant QR Check-in</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Scan customer digital ticket to activate live session
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setVerifiedResult(null);
              setErrorMsg(null);
              closeQrCheckinModal();
            }}
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

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Verified Confirmation Card */}
          {verifiedResult ? (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#34d399',
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#34d399' }}>Ticket Verified Successfully!</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{verifiedResult.message}</p>

              <div
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px',
                  textAlign: 'left',
                  marginTop: '8px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={15} color="var(--accent-primary)" />
                  <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
                  <span style={{ fontWeight: 600 }}>{verifiedResult.customerName}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Gamepad2 size={15} color="var(--accent-cyan)" />
                  <span style={{ color: 'var(--text-muted)' }}>Assigned:</span>
                  <span style={{ fontWeight: 600, color: '#38bdf8' }}>{verifiedResult.resourceName}</span>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                style={{ marginTop: '10px', width: '100%' }}
                onClick={() => {
                  setVerifiedResult(null);
                  closeQrCheckinModal();
                }}
              >
                Done • View Live Timer
              </button>
            </div>
          ) : (
            <>
              {/* Simulated Camera Viewfinder */}
              <div
                style={{
                  height: '180px',
                  background: 'radial-gradient(circle at center, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95))',
                  borderRadius: 'var(--radius-md)',
                  border: '2px dashed var(--border-subtle)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    width: '120px',
                    height: '120px',
                    border: '2px solid rgba(99, 102, 241, 0.6)',
                    borderRadius: '12px',
                    boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isScanning && (
                    <div
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '2px',
                        background: 'var(--accent-primary)',
                        boxShadow: '0 0 10px var(--accent-primary)',
                        animation: 'pulse 1.5s infinite',
                      }}
                    />
                  )}
                </div>
                <Camera size={32} color="var(--text-muted)" style={{ opacity: 0.6 }} />
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '12px', zIndex: 1 }}>
                  {isScanning ? 'Scanning camera stream...' : 'Ready to scan ticket QR code'}
                </div>
              </div>

              {errorMsg && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#f87171',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Direct Input Field */}
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Direct Ticket Barcode / QR String:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleScanSubmit();
                    }}
                    placeholder="e.g. BK-8492 or BOOKING:8492"
                    style={{
                      flex: 1,
                      background: 'rgba(0, 0, 0, 0.3)',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      color: '#fff',
                      fontSize: '0.9rem',
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={isProcessing}
                    onClick={() => handleScanSubmit()}
                  >
                    {isProcessing ? 'Verifying...' : 'Check In'}
                  </button>
                </div>
              </div>

              {/* Quick Preset Test Tickets */}
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={13} color="var(--accent-amber)" />
                  <span>Quick Test Advance Bookings:</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {sampleTickets.map((bk) => (
                    <button
                      key={bk.id}
                      type="button"
                      onClick={() => {
                        setQrInput(bk.id);
                        handleScanSubmit(bk.id);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-main)',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{bk.id}</span>
                      <span>({bk.customerName.split(' ')[0]})</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
