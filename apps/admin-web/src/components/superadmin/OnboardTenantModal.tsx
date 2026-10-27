import React, { useState } from 'react';
import { X, Building2, Globe, Shield, CreditCard, Mail, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { OnboardTenantRequestDto, PlatformTenantDto } from '../../types';

interface OnboardTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTenantOnboarded: (tenant: PlatformTenantDto) => void;
}

export const OnboardTenantModal: React.FC<OnboardTenantModalProps> = ({
  isOpen,
  onClose,
  onTenantOnboarded,
}) => {
  const [formData, setFormData] = useState<OnboardTenantRequestDto>({
    name: '',
    slug: '',
    logoUrl: '',
    planId: 1, // Default Starter
    gstNumber: '',
    razorpayAccountId: '',
    contactEmail: '',
    contactPhone: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    // Auto-generate slug if slug wasn't manually edited
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    setFormData((prev) => ({
      ...prev,
      name: val,
      slug: prev.slug === '' || prev.slug === prev.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') ? autoSlug : prev.slug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Business / Arena name is required');
      return;
    }
    if (!formData.slug.trim()) {
      setError('Custom URL slug is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const created = await api.onboardTenant(formData);
      onTenantOnboarded(created);
      onClose();
    } catch (err: any) {
      console.error('Failed to onboard tenant:', err);
      setError(err.message || 'Failed to onboard tenant');
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
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          color: '#f8fafc',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(168, 85, 247, 0.2)',
                color: '#c084fc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Building2 size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Onboard New Venue Business</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                Provision dedicated database tenant context & billing workspace
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {error && (
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#f87171',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Name & Slug */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Venue / Business Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Apex Gaming & Turf Lounge"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Platform URL Slug *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="apex-gaming"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 1.8rem',
                    backgroundColor: '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#c084fc',
                    fontSize: '0.88rem',
                    fontFamily: 'monospace',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <Globe size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              </div>
            </div>
          </div>

          {/* Subscription Tier Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.5rem' }}>
              SaaS Subscription Plan
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div
                onClick={() => setFormData({ ...formData, planId: 1 })}
                style={{
                  border: formData.planId === 1 ? '2px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: formData.planId === 1 ? 'rgba(99, 102, 241, 0.12)' : '#1e293b',
                  borderRadius: '10px',
                  padding: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>Starter Arena</span>
                  {formData.planId === 1 && <CheckCircle size={16} color="#818cf8" />}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#818cf8', marginTop: '0.2rem' }}>₹4,999/mo</div>
                <p style={{ margin: '0.3rem 0 0', fontSize: '0.74rem', color: '#94a3b8' }}>
                  Up to 10 Consoles & Turfs, Live Timers, Daily Ledger
                </p>
              </div>

              <div
                onClick={() => setFormData({ ...formData, planId: 2 })}
                style={{
                  border: formData.planId === 2 ? '2px solid #c084fc' : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: formData.planId === 2 ? 'rgba(168, 85, 247, 0.12)' : '#1e293b',
                  borderRadius: '10px',
                  padding: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>Pro Enterprise</span>
                  {formData.planId === 2 && <CheckCircle size={16} color="#c084fc" />}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#c084fc', marginTop: '0.2rem' }}>₹9,999/mo</div>
                <p style={{ margin: '0.3rem 0 0', fontSize: '0.74rem', color: '#94a3b8' }}>
                  Unlimited Resources, BYOK Gateway, Auto No-Show Release
                </p>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Owner / Contact Email
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  placeholder="owner@arena.com"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 1.8rem',
                    backgroundColor: '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <Mail size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Contact Phone (+91)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="tel"
                  placeholder="+919876543210"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 1.8rem',
                    backgroundColor: '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <Phone size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              </div>
            </div>
          </div>

          {/* GST & Custom Razorpay Account */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                GSTIN / Tax Registration
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="27ABCDE1234F1Z5"
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 1.8rem',
                    backgroundColor: '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <Shield size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Razorpay Account ID (Optional)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="acc_custom_12345"
                  value={formData.razorpayAccountId}
                  onChange={(e) => setFormData({ ...formData, razorpayAccountId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 1.8rem',
                    backgroundColor: '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <CreditCard size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              </div>
            </div>
          </div>

          {/* Logo URL */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Brand Logo URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://cdn.example.com/logo.png"
              value={formData.logoUrl}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                backgroundColor: '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '0.88rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Submit Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '0.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '0.65rem 1.25rem',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#cbd5e1',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.65rem 1.4rem',
                backgroundColor: '#9333ea',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 4px 14px rgba(147, 51, 234, 0.4)',
              }}
            >
              {loading ? 'Provisioning...' : 'Complete Onboarding'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
