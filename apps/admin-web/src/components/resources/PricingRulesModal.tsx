import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, TrendingUp, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { api } from '../../services/api';
import { PricingRuleDto } from '../../types';

interface PricingRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: {
    id: number | string;
    name: string;
    sport: string;
    ratePerHour: number;
    billingMode?: string;
  } | null;
}

export const PricingRulesModal: React.FC<PricingRulesModalProps> = ({ isOpen, onClose, resource }) => {
  const [rules, setRules] = useState<PricingRuleDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Live Rate Simulator State
  const [testDay, setTestDay] = useState<'WEEKDAY' | 'WEEKEND'>('WEEKDAY');
  const [testTime, setTestTime] = useState<string>('20:00');

  useEffect(() => {
    if (!isOpen || !resource) return;

    setStatusMsg(null);
    const numericId = typeof resource.id === 'string'
      ? parseInt(resource.id.replace(/\D/g, ''), 10) || 1
      : resource.id;

    setLoading(true);
    api.getResourcePricingRules(numericId)
      .then((data) => {
        if (data && data.length > 0) {
          setRules(data);
        } else {
          // Provide sensible default rules based on resource's base rate
          const basePaise = (resource.ratePerHour || 300) * 100;
          setRules([
            {
              dayType: 'WEEKDAY',
              startTime: '09:00',
              endTime: '18:00',
              pricePerHourPaise: basePaise,
              pricePerSlotPaise: Math.round(basePaise / 2),
              priority: 1,
            },
            {
              dayType: 'WEEKDAY',
              startTime: '18:00',
              endTime: '23:59',
              pricePerHourPaise: Math.round(basePaise * 1.3),
              pricePerSlotPaise: Math.round((basePaise * 1.3) / 2),
              priority: 2,
            },
            {
              dayType: 'WEEKEND',
              startTime: '09:00',
              endTime: '23:59',
              pricePerHourPaise: Math.round(basePaise * 1.5),
              pricePerSlotPaise: Math.round((basePaise * 1.5) / 2),
              priority: 2,
            },
          ]);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch pricing rules:', err);
      })
      .finally(() => setLoading(false));
  }, [isOpen, resource]);

  if (!isOpen || !resource) return null;

  const numericId = typeof resource.id === 'string'
    ? parseInt(resource.id.replace(/\D/g, ''), 10) || 1
    : resource.id;

  const handleAddRule = () => {
    const basePaise = (resource.ratePerHour || 300) * 100;
    setRules([
      ...rules,
      {
        dayType: 'WEEKDAY',
        startTime: '18:00',
        endTime: '23:59',
        pricePerHourPaise: basePaise,
        pricePerSlotPaise: Math.round(basePaise / 2),
        priority: rules.length + 1,
      },
    ]);
  };

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleRuleChange = (index: number, field: keyof PricingRuleDto, val: any) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], [field]: val };
    setRules(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      await api.updateResourcePricingRules(numericId, rules);
      setStatusMsg({ type: 'success', text: 'Pricing rules published successfully!' });
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update pricing rules.' });
    } finally {
      setSaving(false);
    }
  };

  // Calculate simulated rate based on test day & time
  const getSimulatedRate = () => {
    const matching = rules
      .filter((r) => r.dayType === 'ANY' || r.dayType === testDay)
      .filter((r) => {
        const start = r.startTime || '00:00';
        const end = r.endTime || '23:59';
        return testTime >= start && testTime <= end;
      })
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    if (matching.length > 0 && matching[0].pricePerHourPaise) {
      return matching[0].pricePerHourPaise / 100;
    }
    return resource.ratePerHour;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 22, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '16px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, rgba(20, 24, 42, 0.98), rgba(12, 15, 26, 0.99))',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(99, 102, 241, 0.15)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
              }}
            >
              <TrendingUp size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>
                Dynamic Pricing Rules: {resource.name}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Configure peak vs. off-peak hours and weekend rates (Base: ₹{resource.ratePerHour}/hr)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
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

        {/* Live Simulator Widget */}
        <div
          style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#c7d2fe' }}>
              Live Rate Simulator:
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setTestDay('WEEKDAY')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: testDay === 'WEEKDAY' ? '1px solid var(--accent-primary)' : '1px solid transparent',
                  background: testDay === 'WEEKDAY' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                  color: testDay === 'WEEKDAY' ? '#fff' : 'var(--text-muted)',
                }}
              >
                Weekday
              </button>
              <button
                type="button"
                onClick={() => setTestDay('WEEKEND')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: testDay === 'WEEKEND' ? '1px solid var(--accent-primary)' : '1px solid transparent',
                  background: testDay === 'WEEKEND' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                  color: testDay === 'WEEKEND' ? '#fff' : 'var(--text-muted)',
                }}
              >
                Weekend
              </button>
            </div>
            <input
              type="time"
              value={testTime}
              onChange={(e) => setTestTime(e.target.value)}
              style={{
                background: '#0d111e',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '4px 8px',
                color: '#fff',
                fontSize: '0.82rem',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Effective Rate:</span>
            <strong style={{ fontSize: '1.2rem', color: '#10b981', fontWeight: 800 }}>
              ₹{getSimulatedRate()}/hr
            </strong>
          </div>
        </div>

        {/* Status Alert Banner */}
        {statusMsg && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '14px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: statusMsg.type === 'success' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
              color: statusMsg.type === 'success' ? '#34d399' : '#f87171',
            }}
          >
            {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Pricing Rules Table */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Loading existing pricing rules...
            </div>
          ) : rules.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '10px',
                border: '1px dashed var(--border-subtle)',
              }}
            >
              <p style={{ color: 'var(--text-muted)', margin: '0 0 12px 0', fontSize: '0.9rem' }}>
                No custom pricing rules defined. Standard base rate (₹{resource.ratePerHour}/hr) will apply at all times.
              </p>
              <button
                type="button"
                onClick={handleAddRule}
                className="btn btn-secondary"
                style={{ fontSize: '0.84rem' }}
              >
                + Add First Rule
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {rules.map((rule, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '120px 100px 100px 130px 120px 40px',
                    gap: '10px',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                  }}
                >
                  {/* Day Type */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '3px' }}>
                      Applicable Day
                    </label>
                    <select
                      value={rule.dayType}
                      onChange={(e) => handleRuleChange(idx, 'dayType', e.target.value)}
                      style={{
                        width: '100%',
                        background: '#0d111e',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        color: '#fff',
                        fontSize: '0.82rem',
                      }}
                    >
                      <option value="ANY">Any Day</option>
                      <option value="WEEKDAY">Weekday (Mon-Fri)</option>
                      <option value="WEEKEND">Weekend (Sat-Sun)</option>
                    </select>
                  </div>

                  {/* Start Time */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '3px' }}>
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={rule.startTime || '00:00'}
                      onChange={(e) => handleRuleChange(idx, 'startTime', e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        background: '#0d111e',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '6px 6px',
                        color: '#fff',
                        fontSize: '0.82rem',
                      }}
                    />
                  </div>

                  {/* End Time */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '3px' }}>
                      End Time
                    </label>
                    <input
                      type="time"
                      value={rule.endTime || '23:59'}
                      onChange={(e) => handleRuleChange(idx, 'endTime', e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        background: '#0d111e',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '6px 6px',
                        color: '#fff',
                        fontSize: '0.82rem',
                      }}
                    />
                  </div>

                  {/* Rate Per Hour */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '3px' }}>
                      Hourly Rate (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={rule.pricePerHourPaise ? rule.pricePerHourPaise / 100 : ''}
                      onChange={(e) => handleRuleChange(idx, 'pricePerHourPaise', Math.round(Number(e.target.value) * 100))}
                      placeholder="e.g. 450"
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        background: '#0d111e',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        color: '#10b981',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                      }}
                    />
                  </div>

                  {/* Slot Rate */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '3px' }}>
                      Slot Rate (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={rule.pricePerSlotPaise ? rule.pricePerSlotPaise / 100 : ''}
                      onChange={(e) => handleRuleChange(idx, 'pricePerSlotPaise', Math.round(Number(e.target.value) * 100))}
                      placeholder="Optional"
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        background: '#0d111e',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        color: '#fff',
                        fontSize: '0.85rem',
                      }}
                    />
                  </div>

                  {/* Delete button */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', paddingBottom: '3px' }}>
                    <button
                      type="button"
                      onClick={() => handleRemoveRule(idx)}
                      title="Remove pricing rule"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            type="button"
            onClick={handleAddRule}
            className="btn btn-secondary"
            style={{ fontSize: '0.84rem', gap: '6px' }}
          >
            <Plus size={15} />
            <span>Add Rule Tier</span>
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn btn-secondary"
              style={{ fontSize: '0.88rem' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="btn btn-primary"
              style={{ fontSize: '0.88rem', gap: '6px' }}
            >
              <Save size={16} />
              <span>{saving ? 'Publishing...' : 'Save & Publish Rates'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
