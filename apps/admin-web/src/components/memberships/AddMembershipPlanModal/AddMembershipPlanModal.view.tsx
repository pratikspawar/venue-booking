import React from 'react';
import { X, Crown, Sparkles, AlertCircle } from 'lucide-react';
import { AddMembershipPlanModalController } from './AddMembershipPlanModal.controller';
import './AddMembershipPlanModal.css';

export interface AddMembershipPlanModalViewProps {
  isOpen: boolean;
  onClose: () => void;
  sports?: Array<{ code: string; nameEn: string }>;
  controller: AddMembershipPlanModalController;
}

export const AddMembershipPlanModalView: React.FC<AddMembershipPlanModalViewProps> = ({
  isOpen,
  onClose,
  sports = [],
  controller,
}) => {
  const {
    name,
    setName,
    sportCode,
    setSportCode,
    priceRupees,
    setPriceRupees,
    durationDays,
    setDurationDays,
    discountPercent,
    setDiscountPercent,
    freeMinutes,
    setFreeMinutes,
    loading,
    error,
    handleSubmit,
  } = controller;

  if (!isOpen) return null;

  return (
    <div className="add-membership-modal-backdrop">
      <div className="add-membership-modal-card">
        {/* Modal Header */}
        <div className="add-membership-modal-header" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(234, 179, 8, 0.08))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(234, 179, 8, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#eab308',
              }}
            >
              <Crown size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
                New Membership Tier
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                Define perks, complimentary hours & automatic checkout discounts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'transparent',
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && (
            <div
              style={{
                backgroundColor: '#7f1d1d',
                color: '#fca5a5',
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Tier Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Tier Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Gold VIP Pass, Weekend Turf Club"
                required
                className="add-membership-input"
              />
            </div>

            {/* Sport Coverage Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Sport Coverage
              </label>
              <select
                value={sportCode}
                onChange={(e) => setSportCode(e.target.value)}
                className="add-membership-input"
              >
                <option value="ALL">All Sports & Gaming Consoles (Universal)</option>
                <option value="PLAYSTATION">PlayStation 5 Only</option>
                <option value="POOL">Snooker & Pool Only</option>
                <option value="TURF">Box Turf Only</option>
                <option value="CARROM">Carrom Only</option>
                <option value="BADMINTON">Badminton Only</option>
                {sports.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Price & Validity Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Subscription Price (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={priceRupees}
                  onChange={(e) => setPriceRupees(e.target.value)}
                  placeholder="1499"
                  required
                  className="add-membership-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Validity (Days) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  placeholder="30"
                  required
                  className="add-membership-input"
                />
              </div>
            </div>

            {/* Discount % & Free Minutes Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Auto Slot Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  placeholder="20"
                  className="add-membership-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Complimentary Free Mins
                </label>
                <input
                  type="number"
                  min="0"
                  step="15"
                  value={freeMinutes}
                  onChange={(e) => setFreeMinutes(e.target.value)}
                  placeholder="120 (2 hrs)"
                  className="add-membership-input"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: '1px solid #334155',
                background: 'transparent',
                color: '#cbd5e1',
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
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #eab308, #ca8a04)',
                color: '#0f172a',
                cursor: 'pointer',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(234, 179, 8, 0.3)',
              }}
            >
              <Sparkles size={16} />
              <span>{loading ? 'Creating...' : 'Create Membership Tier'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
