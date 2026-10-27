import React, { useState } from 'react';
import { X, Tag, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { CouponDto } from '../../types';

interface AddCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCouponCreated: (coupon: CouponDto) => void;
  sports?: Array<{ code: string; nameEn: string }>;
}

export const AddCouponModal: React.FC<AddCouponModalProps> = ({
  isOpen,
  onClose,
  onCouponCreated,
  sports = [],
}) => {
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FLAT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('20');
  const [minBookingRupees, setMinBookingRupees] = useState('500');
  const [maxDiscountRupees, setMaxDiscountRupees] = useState('250');
  const [sportCode, setSportCode] = useState<string>('ALL');
  const [validDays, setValidDays] = useState('30');
  const [maxUses, setMaxUses] = useState('500');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const val = Number(discountValue);
    if (!code.trim()) {
      setError('Please provide a coupon promo code');
      return;
    }
    if (isNaN(val) || val <= 0) {
      setError('Please enter a valid discount value');
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const validTo = new Date(now.getTime() + (Number(validDays) || 30) * 86400 * 1000);

      const created = await api.createCoupon({
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: discountType === 'PERCENTAGE' ? Math.round(val) : Math.round(val * 100),
        minBookingAmountPaise: minBookingRupees ? Math.round(Number(minBookingRupees) * 100) : 0,
        maxDiscountPaise: maxDiscountRupees ? Math.round(Number(maxDiscountRupees) * 100) : undefined,
        applicableSportCode: sportCode === 'ALL' ? undefined : sportCode,
        validFrom: now.toISOString(),
        validTo: validTo.toISOString(),
        maxUses: Number(maxUses) || 500,
      });

      onCouponCreated(created);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create promo coupon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050,
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          backgroundColor: '#0f172a',
          borderRadius: '16px',
          border: '1px solid #334155',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(99, 102, 241, 0.08))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Tag size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
                Create Promo Coupon
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                Generate promotional discount code for customer bookings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && (
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#f87171',
                fontSize: '0.875rem',
                marginBottom: '16px',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px' }}>
                Coupon Promo Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. APEX50, CRICKET20, DIWALI100"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px' }}>
                Discount Type
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FLAT">Flat Amount (₹)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px' }}>
                {discountType === 'PERCENTAGE' ? 'Discount Rate (%)' : 'Discount Value (₹)'}
              </label>
              <input
                type="number"
                min="1"
                max={discountType === 'PERCENTAGE' ? '100' : '10000'}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px' }}>
                Min Booking Value (₹)
              </label>
              <input
                type="number"
                min="0"
                value={minBookingRupees}
                onChange={(e) => setMinBookingRupees(e.target.value)}
                placeholder="0"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px' }}>
                Max Discount Cap (₹)
              </label>
              <input
                type="number"
                min="0"
                value={maxDiscountRupees}
                onChange={(e) => setMaxDiscountRupees(e.target.value)}
                placeholder="Optional"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px' }}>
                Sport Scope
              </label>
              <select
                value={sportCode}
                onChange={(e) => setSportCode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              >
                <option value="ALL">All Sports & Arenas</option>
                {sports.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.nameEn} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px' }}>
                Validity (Days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={validDays}
                onChange={(e) => setValidDays(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px' }}>
              Maximum Redemptions (Total Uses)
            </label>
            <input
              type="number"
              min="1"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '10px 18px',
                backgroundColor: '#1e293b',
                color: '#94a3b8',
                border: '1px solid #334155',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 22px',
                background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)',
              }}
            >
              <Sparkles size={16} />
              <span>{loading ? 'Creating...' : 'Create Promo Code'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
