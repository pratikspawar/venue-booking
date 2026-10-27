import React from 'react';
import { X, Key, ShieldCheck, CheckCircle2, AlertCircle, Copy, Eye, EyeOff, Loader2 } from 'lucide-react';
import { PaymentGatewaySettingsModalController } from './PaymentGatewaySettingsModal.controller';
import './PaymentGatewaySettingsModal.css';

export interface PaymentGatewaySettingsModalViewProps {
  isOpen: boolean;
  onClose: () => void;
  controller: PaymentGatewaySettingsModalController;
}

export const PaymentGatewaySettingsModalView: React.FC<PaymentGatewaySettingsModalViewProps> = ({
  isOpen,
  onClose,
  controller,
}) => {
  const {
    loading,
    saving,
    testing,
    testResult,
    saveSuccess,
    keyId,
    setKeyId,
    keySecret,
    setKeySecret,
    webhookSecret,
    setWebhookSecret,
    isActive,
    setIsActive,
    webhookUrl,
    showKeySecret,
    setShowKeySecret,
    showWebhookSecret,
    setShowWebhookSecret,
    copied,
    handleTest,
    handleSave,
    copyWebhookUrl,
  } = controller;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content glass-panel gateway-modal-card">
        <div className="gateway-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="gateway-modal-icon-badge">
              <Key size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                Payment Gateway Configuration
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Merchant Self-Service • Bring Your Own Razorpay Account
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 12px' }} />
            <p>Loading current merchant configuration...</p>
          </div>
        ) : (
          <form onSubmit={handleSave}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Info banner */}
              <div className="gateway-info-banner">
                <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Encrypted Multi-Tenant Storage:</strong> Your API secret keys are encrypted at rest with AES-GCM-256 and used exclusively for your venue's customer transactions.
                </div>
              </div>

              {/* Gateway Provider */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                  Gateway Provider
                </label>
                <select
                  className="input-field"
                  disabled
                  value="RAZORPAY"
                  style={{ width: '100%', opacity: 0.8 }}
                >
                  <option value="RAZORPAY">Razorpay (India UPI, Cards, NetBanking)</option>
                </select>
              </div>

              {/* Key ID */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                  Razorpay Key ID <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="rzp_live_xxxxxxxxxxxxxxxxxx"
                  value={keyId}
                  onChange={(e) => setKeyId(e.target.value)}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              {/* Key Secret */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                  Razorpay Key Secret <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div className="gateway-secret-input-wrapper">
                  <input
                    type={showKeySecret ? 'text' : 'password'}
                    className="input-field"
                    placeholder="Enter Key Secret (e.g. ••••••••••••••••)"
                    value={keySecret}
                    onChange={(e) => setKeySecret(e.target.value)}
                    required
                    style={{ width: '100%', paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeySecret((prev) => !prev)}
                    className="gateway-secret-toggle-btn"
                  >
                    {showKeySecret ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Webhook Secret */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                  Webhook Secret (Optional)
                </label>
                <div className="gateway-secret-input-wrapper">
                  <input
                    type={showWebhookSecret ? 'text' : 'password'}
                    className="input-field"
                    placeholder="Webhook secret configured in Razorpay dashboard"
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    style={{ width: '100%', paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowWebhookSecret((prev) => !prev)}
                    className="gateway-secret-toggle-btn"
                  >
                    {showWebhookSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Webhook Callback URL */}
              {webhookUrl && (
                <div className="gateway-webhook-box">
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px', textTransform: 'uppercase' }}>
                    Webhook Endpoint for Razorpay Dashboard
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      readOnly
                      value={webhookUrl}
                      className="input-field"
                      style={{ fontSize: '0.8rem', flex: 1, background: 'rgba(0, 0, 0, 0.2)' }}
                    />
                    <button
                      type="button"
                      onClick={copyWebhookUrl}
                      className="btn btn-secondary"
                      style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                    >
                      <Copy size={14} />
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Active Toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Enable online payments for this venue</span>
              </label>

              {/* Test Connection Result Alert */}
              {testResult && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: testResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: testResult.success ? '#34d399' : '#f87171',
                    border: testResult.success ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                  }}
                >
                  {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>{testResult.message}</span>
                </div>
              )}

              {/* Save Success Alert */}
              {saveSuccess && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Gateway credentials saved & encrypted successfully!</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '24px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleTest}
                disabled={testing || saving}
              >
                {testing ? <Loader2 className="animate-spin" size={16} /> : null}
                <span>{testing ? 'Testing...' : 'Test Connection'}</span>
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Close
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving || testing}>
                  {saving ? <Loader2 className="animate-spin" size={16} /> : null}
                  <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
