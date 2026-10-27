import React, { useState, useEffect } from 'react';
import { X, UserPlus, Shield, Crown, User, Check, AlertCircle, Building2 } from 'lucide-react';
import { api } from '../../services/api';
import { StaffMemberDto, InviteStaffPayload, UpdateStaffPayload } from '../../types';

interface InviteStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingMember?: StaffMemberDto | null;
  venues: Array<{ id: number | string; name: string }>;
}

export const InviteStaffModal: React.FC<InviteStaffModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingMember,
  venues,
}) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'OWNER' | 'MANAGER' | 'STAFF'>('STAFF');
  const [allVenues, setAllVenues] = useState(true);
  const [selectedVenueIds, setSelectedVenueIds] = useState<number[]>([]);
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);

    if (editingMember) {
      setPhone(editingMember.phone || '');
      setName(editingMember.name || '');
      setEmail(editingMember.email || '');
      setRole(editingMember.role || 'STAFF');
      setActive(editingMember.active ?? true);

      if (editingMember.assignedVenues && editingMember.assignedVenues.trim()) {
        setAllVenues(false);
        const ids = editingMember.assignedVenues
          .split(',')
          .map((v) => parseInt(v.trim(), 10))
          .filter((v) => !isNaN(v));
        setSelectedVenueIds(ids);
      } else {
        setAllVenues(true);
        setSelectedVenueIds([]);
      }
    } else {
      setPhone('');
      setName('');
      setEmail('');
      setRole('STAFF');
      setAllVenues(true);
      setSelectedVenueIds([]);
      setActive(true);
    }
  }, [isOpen, editingMember]);

  if (!isOpen) return null;

  const toggleVenueId = (id: number) => {
    if (selectedVenueIds.includes(id)) {
      setSelectedVenueIds(selectedVenueIds.filter((v) => v !== id));
    } else {
      setSelectedVenueIds([...selectedVenueIds, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Please provide a valid 10-digit mobile number');
      return;
    }

    if (!allVenues && selectedVenueIds.length === 0) {
      setError('Please select at least one assigned venue, or enable access to all venues');
      return;
    }

    const assignedVenuesStr = allVenues ? '' : selectedVenueIds.join(',');

    setLoading(true);
    try {
      if (editingMember) {
        const payload: UpdateStaffPayload = {
          role,
          active,
          assignedVenues: assignedVenuesStr,
        };
        await api.updateStaffMember(editingMember.id, payload);
      } else {
        const payload: InviteStaffPayload = {
          phone: cleanPhone,
          name: name.trim() || undefined,
          email: email.trim() || undefined,
          role,
          assignedVenues: assignedVenuesStr,
        };
        await api.inviteStaffMember(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Operation failed. Please check input parameters.');
    } finally {
      setLoading(false);
    }
  };

  const isEdit = Boolean(editingMember);

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
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              {isEdit ? <Shield size={20} /> : <UserPlus size={20} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#f8fafc' }}>
                {isEdit ? 'Edit Staff Member' : 'Invite Staff Operator'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                {isEdit
                  ? 'Update roles, venue access, and operational status'
                  : 'Assign role permissions and venue operating boundaries'}
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
              gap: '1.25rem',
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

            {/* Phone Number */}
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
                Mobile Phone Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isEdit}
                placeholder="e.g. 9876543210"
                style={{
                  width: '100%',
                  padding: '0.7rem 0.9rem',
                  backgroundColor: isEdit ? 'rgba(30, 41, 59, 0.5)' : '#1e293b',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: isEdit ? '#94a3b8' : '#f8fafc',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                Used for OTP authentication and desk login credentials.
              </p>
            </div>

            {/* Name and Email */}
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
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isEdit}
                  placeholder="e.g. Rahul Sharma"
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.9rem',
                    backgroundColor: isEdit ? 'rgba(30, 41, 59, 0.5)' : '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: isEdit ? '#94a3b8' : '#f8fafc',
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
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isEdit}
                  placeholder="e.g. rahul@example.com"
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.9rem',
                    backgroundColor: isEdit ? 'rgba(30, 41, 59, 0.5)' : '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: isEdit ? '#94a3b8' : '#f8fafc',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  color: '#cbd5e1',
                  marginBottom: '0.6rem',
                }}
              >
                Access Role & Permissions <span style={{ color: '#ef4444' }}>*</span>
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {/* STAFF */}
                <div
                  onClick={() => setRole('STAFF')}
                  style={{
                    padding: '0.8rem 1rem',
                    borderRadius: '10px',
                    border:
                      role === 'STAFF'
                        ? '1.5px solid #3b82f6'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: role === 'STAFF' ? 'rgba(59, 130, 246, 0.12)' : '#1e293b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      marginTop: '2px',
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      color: '#60a5fa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <User size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f8fafc' }}>
                        STAFF (Counter Desk)
                      </span>
                      {role === 'STAFF' && <Check size={16} style={{ color: '#3b82f6' }} />}
                    </div>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                      Daily desk sessions, walk-in bookings, check-in QR codes, canteen sales, and cash collection.
                    </p>
                  </div>
                </div>

                {/* MANAGER */}
                <div
                  onClick={() => setRole('MANAGER')}
                  style={{
                    padding: '0.8rem 1rem',
                    borderRadius: '10px',
                    border:
                      role === 'MANAGER'
                        ? '1.5px solid #8b5cf6'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: role === 'MANAGER' ? 'rgba(139, 92, 246, 0.12)' : '#1e293b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      marginTop: '2px',
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(139, 92, 246, 0.2)',
                      color: '#a78bfa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Shield size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f8fafc' }}>
                        MANAGER (Shift Supervisor)
                      </span>
                      {role === 'MANAGER' && <Check size={16} style={{ color: '#8b5cf6' }} />}
                    </div>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                      All desk privileges + cancellation override approvals exceeding ₹500, schedule blocks, and dynamic rate configs.
                    </p>
                  </div>
                </div>

                {/* OWNER */}
                <div
                  onClick={() => setRole('OWNER')}
                  style={{
                    padding: '0.8rem 1rem',
                    borderRadius: '10px',
                    border:
                      role === 'OWNER'
                        ? '1.5px solid #f59e0b'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: role === 'OWNER' ? 'rgba(245, 158, 11, 0.12)' : '#1e293b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      marginTop: '2px',
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(245, 158, 11, 0.2)',
                      color: '#fbbf24',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Crown size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f8fafc' }}>
                        OWNER (Full Co-Administrator)
                      </span>
                      {role === 'OWNER' && <Check size={16} style={{ color: '#f59e0b' }} />}
                    </div>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                      Full administrative authority: invite staff, modify payment gateways, export financial audits, configure venues.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Venue Scope Assignment */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  color: '#cbd5e1',
                  marginBottom: '0.4rem',
                }}
              >
                Venue Access Scope
              </label>

              <div
                style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: '#1e293b',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    color: '#f8fafc',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={allVenues}
                    onChange={(e) => {
                      setAllVenues(e.target.checked);
                      if (e.target.checked) setSelectedVenueIds([]);
                    }}
                    style={{ width: '16px', height: '16px', accentColor: '#3b82f6', cursor: 'pointer' }}
                  />
                  <span>All Venues (Unrestricted Multi-Venue Access)</span>
                </label>

                {!allVenues && (
                  <div style={{ paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                      Select designated venues this staff member is allowed to operate:
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.4rem' }}>
                      {venues.map((venue) => {
                        const numId = typeof venue.id === 'string' ? parseInt(venue.id.replace(/\D/g, ''), 10) || 1 : venue.id;
                        const isChecked = selectedVenueIds.includes(numId);
                        return (
                          <label
                            key={venue.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.6rem',
                              padding: '0.4rem 0.6rem',
                              borderRadius: '6px',
                              backgroundColor: isChecked ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                              cursor: 'pointer',
                              fontSize: '0.82rem',
                              color: isChecked ? '#93c5fd' : '#cbd5e1',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleVenueId(numId)}
                              style={{ width: '15px', height: '15px', accentColor: '#3b82f6', cursor: 'pointer' }}
                            />
                            <Building2 size={14} style={{ color: '#64748b' }} />
                            <span>{venue.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Active / Inactive Status (When Editing) */}
            {isEdit && (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: '#1e293b',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                    Account Status
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {active ? 'Active (Allowed to sign in and run shifts)' : 'Suspended (Access blocked)'}
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.85rem', color: active ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                    {active ? 'Active' : 'Suspended'}
                  </span>
                </label>
              </div>
            )}
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
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35)',
              }}
            >
              {loading ? (
                'Processing...'
              ) : isEdit ? (
                'Save Changes'
              ) : (
                <>
                  <UserPlus size={16} />
                  <span>Send Invite & Grant Access</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
