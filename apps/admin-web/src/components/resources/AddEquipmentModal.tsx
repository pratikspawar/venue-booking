import React, { useState, useEffect } from 'react';
import { X, Shield, Plus, AlertCircle, Gamepad2, Sparkles, Tag, Layers } from 'lucide-react';
import { api } from '../../services/api';
import { EquipmentItemDto, CreateEquipmentPayload, UpdateEquipmentPayload } from '../../types';

interface AddEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  venueId: number;
  editingItem?: EquipmentItemDto | null;
}

const EQUIPMENT_PRESETS = [
  { name: 'PS5 DualSense Controller (Midnight Black)', rental: 50, deposit: 200, prefix: 'PS5-CTRL' },
  { name: 'PS5 DualSense Edge Pro Controller', rental: 100, deposit: 500, prefix: 'PS5-EDGE' },
  { name: 'Xbox Wireless Controller (Carbon Black)', rental: 50, deposit: 200, prefix: 'XBX-CTRL' },
  { name: 'Professional Snooker Cue (Ash Wood 57")', rental: 40, deposit: 150, prefix: 'CUE-PRO' },
  { name: 'English Willow Cricket Bat (Grade 1)', rental: 100, deposit: 500, prefix: 'BAT-EW' },
  { name: 'Yonex Astrox 88D Pro Badminton Racket', rental: 60, deposit: 250, prefix: 'BADM-RK' },
  { name: 'Meta Quest 3 VR Headset & Touch Plus', rental: 250, deposit: 1000, prefix: 'VR-Q3' },
  { name: 'Cosco FIFA Pro Turf Match Football', rental: 30, deposit: 100, prefix: 'BALL-FB' },
];

export const AddEquipmentModal: React.FC<AddEquipmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  venueId,
  editingItem,
}) => {
  const [name, setName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [conditionStatus, setConditionStatus] = useState<'EXCELLENT' | 'GOOD' | 'FAIR' | 'MAINTENANCE' | 'DAMAGED'>('GOOD');
  const [rentalRateRupees, setRentalRateRupees] = useState<number>(50);
  const [depositRupees, setDepositRupees] = useState<number>(200);
  const [stockCount, setStockCount] = useState<number>(2);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);

    if (editingItem) {
      setName(editingItem.name || '');
      setSerialNumber(editingItem.serialNumber || '');
      setConditionStatus(editingItem.conditionStatus || 'GOOD');
      setRentalRateRupees(Math.round((editingItem.pricePaise || 0) / 100));
      setDepositRupees(Math.round((editingItem.depositPaise || 0) / 100));
      setStockCount(editingItem.stockCount ?? 1);
      setLowStockThreshold(editingItem.lowStockThreshold ?? 1);
    } else {
      setName('');
      setSerialNumber('');
      setConditionStatus('GOOD');
      setRentalRateRupees(50);
      setDepositRupees(200);
      setStockCount(2);
      setLowStockThreshold(1);
    }
  }, [isOpen, editingItem]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof EQUIPMENT_PRESETS[0]) => {
    setName(preset.name);
    setRentalRateRupees(preset.rental);
    setDepositRupees(preset.deposit);
    if (!serialNumber) {
      setSerialNumber(`${preset.prefix}-${Math.floor(10 + Math.random() * 90)}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Equipment name is required');
      return;
    }

    if (rentalRateRupees < 0 || depositRupees < 0 || stockCount < 0) {
      setError('Rates, deposits, and stock count must be non-negative values');
      return;
    }

    setLoading(true);
    try {
      if (editingItem) {
        const payload: UpdateEquipmentPayload = {
          name: name.trim(),
          pricePaise: Math.round(rentalRateRupees * 100),
          depositPaise: Math.round(depositRupees * 100),
          stockCount,
          lowStockThreshold,
          conditionStatus,
          serialNumber: serialNumber.trim() || undefined,
        };
        await api.updateEquipment(venueId, editingItem.id, payload);
      } else {
        const payload: CreateEquipmentPayload = {
          name: name.trim(),
          category: 'EQUIPMENT_RENTAL',
          pricePaise: Math.round(rentalRateRupees * 100),
          depositPaise: Math.round(depositRupees * 100),
          stockCount,
          lowStockThreshold,
          conditionStatus,
          serialNumber: serialNumber.trim() || undefined,
        };
        await api.createEquipment(venueId, payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save equipment');
    } finally {
      setLoading(false);
    }
  };

  const isEdit = Boolean(editingItem);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 15, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.4) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Gamepad2 size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#f8fafc' }}>
                {isEdit ? 'Edit Equipment Asset' : 'Add Rentable Equipment'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                {isEdit
                  ? 'Update condition, stock units, and security deposit'
                  : 'Register controllers, cues, rackets, and VR gear'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '8px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div
            style={{
              padding: '1.5rem',
              maxHeight: 'calc(85vh - 140px)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.2rem',
            }}
          >
            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '10px',
                  color: '#fca5a5',
                  fontSize: '0.85rem',
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Quick Presets (Only when adding new) */}
            {!isEdit && (
              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#94a3b8',
                    marginBottom: '0.4rem',
                  }}
                >
                  <Sparkles size={13} style={{ color: '#10b981' }} />
                  <span>Popular Gear Presets</span>
                </label>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {EQUIPMENT_PRESETS.slice(0, 4).map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      style={{
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.75rem',
                        backgroundColor: '#1e293b',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        color: '#cbd5e1',
                        cursor: 'pointer',
                      }}
                    >
                      {p.name.split(' (')[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Name */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  color: '#cbd5e1',
                  marginBottom: '0.35rem',
                }}
              >
                Equipment / Gear Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. PS5 DualSense Controller (Midnight Black)"
                style={{
                  width: '100%',
                  padding: '0.7rem 0.9rem',
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Serial / Tag and Condition */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    color: '#cbd5e1',
                    marginBottom: '0.35rem',
                  }}
                >
                  <Tag size={13} style={{ color: '#64748b' }} />
                  <span>Asset Tag / Serial</span>
                </label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g. PS5-CTRL-01"
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.9rem',
                    backgroundColor: '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    color: '#cbd5e1',
                    marginBottom: '0.35rem',
                  }}
                >
                  <Shield size={13} style={{ color: '#64748b' }} />
                  <span>Physical Condition</span>
                </label>
                <select
                  value={conditionStatus}
                  onChange={(e) => setConditionStatus(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.9rem',
                    backgroundColor: '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                  }}
                >
                  <option value="EXCELLENT">Excellent (Brand New / Mint)</option>
                  <option value="GOOD">Good (Normal Wear)</option>
                  <option value="FAIR">Fair (Visible Scuffs)</option>
                  <option value="MAINTENANCE">Maintenance (In Repair)</option>
                  <option value="DAMAGED">Damaged (Out of Service)</option>
                </select>
              </div>
            </div>

            {/* Pricing & Deposit */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    color: '#cbd5e1',
                    marginBottom: '0.35rem',
                  }}
                >
                  Rental Fee (₹ / session)
                </label>
                <input
                  type="number"
                  min="0"
                  value={rentalRateRupees}
                  onChange={(e) => setRentalRateRupees(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.9rem',
                    backgroundColor: '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    color: '#cbd5e1',
                    marginBottom: '0.35rem',
                  }}
                >
                  Security Deposit (₹ Refundable)
                </label>
                <input
                  type="number"
                  min="0"
                  value={depositRupees}
                  onChange={(e) => setDepositRupees(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.9rem',
                    backgroundColor: '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Quantity and Low Stock Threshold */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    color: '#cbd5e1',
                    marginBottom: '0.35rem',
                  }}
                >
                  <Layers size={13} style={{ color: '#64748b' }} />
                  <span>Total Available Units</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={stockCount}
                  onChange={(e) => setStockCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.9rem',
                    backgroundColor: '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    color: '#cbd5e1',
                    marginBottom: '0.35rem',
                  }}
                >
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  min="0"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.9rem',
                    backgroundColor: '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              backgroundColor: '#090d16',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '0.6rem 1.1rem',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#cbd5e1',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.6rem 1.3rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
              }}
            >
              {loading ? (
                'Processing...'
              ) : isEdit ? (
                'Save Equipment'
              ) : (
                <>
                  <Plus size={16} />
                  <span>Register Gear</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
