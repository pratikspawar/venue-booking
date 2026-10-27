import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Crown,
  User,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Building2,
  Phone,
  Mail,
  RefreshCw,
  AlertCircle,
  Power,
} from 'lucide-react';
import { api } from '../../services/api';
import { StaffMemberDto } from '../../types';
import { InviteStaffModal } from './InviteStaffModal';

interface VenueOption {
  id: number | string;
  name: string;
}

export const StaffManagement: React.FC = () => {
  const [members, setMembers] = useState<StaffMemberDto[]>([]);
  const [venues, setVenues] = useState<VenueOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'OWNER' | 'MANAGER' | 'STAFF'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');

  // Modals & Action States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMemberDto | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchVenues = async () => {
    try {
      const data = await api.getVenues();
      if (data && Array.isArray(data) && data.length > 0) {
        setVenues(data.map((v: any) => ({ id: v.id, name: v.name })));
      } else {
        setVenues([
          { id: 1, name: 'Main Gaming Lounge (FC Road)' },
          { id: 2, name: 'Kothrud Turf & Console Arena' },
          { id: 3, name: 'Viman Nagar Esports Hub' },
        ]);
      }
    } catch {
      setVenues([
        { id: 1, name: 'Main Gaming Lounge (FC Road)' },
        { id: 2, name: 'Kothrud Turf & Console Arena' },
        { id: 3, name: 'Viman Nagar Esports Hub' },
      ]);
    }
  };

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getStaffMembers();
      setMembers(data || []);
    } catch (err: any) {
      console.error('Failed to fetch staff members:', err);
      // Fallback sample data if backend connection is unavailable in dev
      if (members.length === 0) {
        setMembers([
          {
            id: 1,
            userId: 1,
            tenantId: 1,
            phone: '9876543210',
            name: 'Rahul Sharma',
            email: 'rahul.manager@venueops.in',
            role: 'MANAGER',
            active: true,
            assignedVenues: '',
            createdAt: new Date().toISOString(),
          },
          {
            id: 2,
            userId: 2,
            tenantId: 1,
            phone: '9822011223',
            name: 'Pooja Patil',
            email: 'pooja.desk@venueops.in',
            role: 'STAFF',
            active: true,
            assignedVenues: '1',
            createdAt: new Date().toISOString(),
          },
          {
            id: 3,
            userId: 3,
            tenantId: 1,
            phone: '9822998877',
            name: 'Amit Deshmukh',
            email: 'amit.owner@venueops.in',
            role: 'OWNER',
            active: true,
            assignedVenues: '',
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchVenues();
  }, []);

  // Filtered members calculation
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Role filter
      if (roleFilter !== 'ALL' && m.role !== roleFilter) return false;

      // Status filter
      if (statusFilter === 'ACTIVE' && !m.active) return false;
      if (statusFilter === 'SUSPENDED' && m.active) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = m.name?.toLowerCase().includes(q) ?? false;
        const matchesPhone = m.phone.includes(q);
        const matchesEmail = m.email?.toLowerCase().includes(q) ?? false;
        if (!matchesName && !matchesPhone && !matchesEmail) return false;
      }

      return true;
    });
  }, [members, roleFilter, statusFilter, searchQuery]);

  // Metric counts
  const totalCount = members.length;
  const activeCount = members.filter((m) => m.active).length;
  const managerCount = members.filter((m) => m.role === 'MANAGER' || m.role === 'OWNER').length;

  const handleToggleStatus = async (member: StaffMemberDto) => {
    setActionLoadingId(member.id);
    try {
      await api.updateStaffMember(member.id, {
        active: !member.active,
      });
      await fetchMembers();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteMember = async (member: StaffMemberDto) => {
    if (
      !window.confirm(
        `Are you sure you want to deactivate ${member.name || member.phone}? They will lose desk access.`
      )
    ) {
      return;
    }
    setActionLoadingId(member.id);
    try {
      await api.deleteStaffMember(member.id);
      await fetchMembers();
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate staff member');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getVenueNames = (assignedVenuesStr?: string) => {
    if (!assignedVenuesStr || assignedVenuesStr.trim() === '') {
      return 'All Venues (Unrestricted)';
    }
    const ids = assignedVenuesStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const names = ids.map((id) => {
      const found = venues.find((v: VenueOption) => String(v.id) === id);
      return found ? found.name : `Venue #${id}`;
    });
    return names.join(', ');
  };

  const renderRoleBadge = (role: 'OWNER' | 'MANAGER' | 'STAFF') => {
    switch (role) {
      case 'OWNER':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.25rem 0.6rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.3)',
            }}
          >
            <Crown size={12} />
            Owner
          </span>
        );
      case 'MANAGER':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.25rem 0.6rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: 'rgba(139, 92, 246, 0.15)',
              color: '#c4b5fd',
              border: '1px solid rgba(139, 92, 246, 0.3)',
            }}
          >
            <Shield size={12} />
            Manager
          </span>
        );
      case 'STAFF':
      default:
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.25rem 0.6rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              color: '#93c5fd',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}
          >
            <User size={12} />
            Staff Desk
          </span>
        );
    }
  };

  return (
    <div
      style={{
        padding: '1.75rem',
        maxWidth: '1300px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}
    >
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Users size={20} />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: '#f8fafc' }}>
              Staff & Operator Management
            </h1>
          </div>
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.88rem', color: '#94a3b8' }}>
            Authorize shift managers, assign counter desk operators, and configure multi-venue access boundaries
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={fetchMembers}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.65rem 0.9rem',
              backgroundColor: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#cbd5e1',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => {
              setEditingMember(null);
              setIsModalOpen(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
            }}
          >
            <UserPlus size={16} />
            <span>Invite Staff Member</span>
          </button>
        </div>
      </div>

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

      {/* Metric Cards Banner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        <div
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '1.1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              Total Members
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc' }}>
              {totalCount}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '1.1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              Active Operators
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc' }}>
              {activeCount}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '1.1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: 'rgba(139, 92, 246, 0.15)',
              color: '#a78bfa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Shield size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              Supervisors & Owners
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc' }}>
              {managerCount}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '1.1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Building2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              Venues Covered
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc' }}>
              {venues.length}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#0f172a',
          padding: '0.85rem 1.1rem',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '260px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#1e293b',
              padding: '0.5rem 0.8rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              width: '100%',
              maxWidth: '360px',
            }}
          >
            <Search size={16} style={{ color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#f8fafc',
                fontSize: '0.85rem',
                width: '100%',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Role Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter size={15} style={{ color: '#64748b' }} />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              style={{
                backgroundColor: '#1e293b',
                color: '#cbd5e1',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem',
                fontSize: '0.82rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Roles</option>
              <option value="OWNER">Owners Only</option>
              <option value="MANAGER">Managers Only</option>
              <option value="STAFF">Desk Staff Only</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{
              backgroundColor: '#1e293b',
              color: '#cbd5e1',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '0.5rem 0.75rem',
              fontSize: '0.82rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Staff Table / List */}
      <div
        style={{
          backgroundColor: '#0f172a',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          overflow: 'hidden',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
        }}
      >
        {filteredMembers.length === 0 ? (
          <div
            style={{
              padding: '3.5rem 1.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa',
                marginBottom: '1rem',
              }}
            >
              <Users size={26} />
            </div>
            <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.1rem', color: '#f8fafc' }}>
              No staff members match the criteria
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', maxWidth: '420px' }}>
              {searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'Try clearing the search filters to view all organization members.'
                : 'Click the button below to invite your first counter desk operator or shift manager.'}
            </p>
            {!searchQuery && roleFilter === 'ALL' && statusFilter === 'ALL' && (
              <button
                onClick={() => {
                  setEditingMember(null);
                  setIsModalOpen(true);
                }}
                style={{
                  marginTop: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 1.2rem',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <UserPlus size={16} />
                <span>Invite First Staff Operator</span>
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'rgba(30, 41, 59, 0.4)',
                    fontSize: '0.78rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#94a3b8',
                  }}
                >
                  <th style={{ padding: '0.9rem 1.25rem' }}>Staff Member</th>
                  <th style={{ padding: '0.9rem 1.25rem' }}>Contact</th>
                  <th style={{ padding: '0.9rem 1.25rem' }}>Role</th>
                  <th style={{ padding: '0.9rem 1.25rem' }}>Assigned Venue Scope</th>
                  <th style={{ padding: '0.9rem 1.25rem' }}>Status</th>
                  <th style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => {
                  const initials = member.name
                    ? member.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : member.phone.slice(-2);

                  const isLoading = actionLoadingId === member.id;

                  return (
                    <tr
                      key={member.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.3)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = 'transparent')
                      }
                    >
                      {/* Name & Avatar */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '10px',
                              background:
                                member.role === 'OWNER'
                                  ? 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)'
                                  : member.role === 'MANAGER'
                                  ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)'
                                  : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f8fafc' }}>
                              {member.name || 'Staff Member'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              User ID #{member.userId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              fontSize: '0.82rem',
                              color: '#cbd5e1',
                            }}
                          >
                            <Phone size={13} style={{ color: '#64748b' }} />
                            <span>+91 {member.phone}</span>
                          </div>
                          {member.email && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                fontSize: '0.75rem',
                                color: '#94a3b8',
                              }}
                            >
                              <Mail size={12} style={{ color: '#64748b' }} />
                              <span>{member.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        {renderRoleBadge(member.role)}
                      </td>

                      {/* Assigned Venues */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontSize: '0.82rem',
                            color: '#cbd5e1',
                          }}
                        >
                          <Building2 size={14} style={{ color: '#64748b', flexShrink: 0 }} />
                          <span style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {getVenueNames(member.assignedVenues)}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '9999px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            backgroundColor: member.active
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(239, 68, 68, 0.15)',
                            color: member.active ? '#34d399' : '#fca5a5',
                            border: `1px solid ${
                              member.active ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                            }`,
                          }}
                        >
                          {member.active ? (
                            <>
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor: '#10b981',
                                }}
                              />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle size={12} />
                              Suspended
                            </>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                          }}
                        >
                          <button
                            title="Edit Role & Venues"
                            disabled={isLoading}
                            onClick={() => {
                              setEditingMember(member);
                              setIsModalOpen(true);
                            }}
                            style={{
                              padding: '0.45rem',
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              border: '1px solid rgba(59, 130, 246, 0.25)',
                              borderRadius: '6px',
                              color: '#60a5fa',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Edit2 size={15} />
                          </button>

                          <button
                            title={member.active ? 'Suspend Access' : 'Reactivate Access'}
                            disabled={isLoading}
                            onClick={() => handleToggleStatus(member)}
                            style={{
                              padding: '0.45rem',
                              backgroundColor: member.active
                                ? 'rgba(239, 68, 68, 0.1)'
                                : 'rgba(16, 185, 129, 0.1)',
                              border: `1px solid ${
                                member.active
                                  ? 'rgba(239, 68, 68, 0.25)'
                                  : 'rgba(16, 185, 129, 0.25)'
                              }`,
                              color: member.active ? '#f87171' : '#34d399',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Power size={15} />
                          </button>

                          <button
                            title="Remove Member"
                            disabled={isLoading}
                            onClick={() => handleDeleteMember(member)}
                            style={{
                              padding: '0.45rem',
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              borderRadius: '6px',
                              color: '#f87171',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite / Edit Staff Modal */}
      <InviteStaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchMembers()}
        editingMember={editingMember}
        venues={venues}
      />
    </div>
  );
};
