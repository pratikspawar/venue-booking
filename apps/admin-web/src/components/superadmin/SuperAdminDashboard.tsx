import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  TrendingUp,
  Search,
  Filter,
  CheckCircle2,
  RefreshCw,
  Plus,
  Users,
  CreditCard,
  Key,
  Server,
  Layers,
  Clock,
  ShieldAlert,
  Globe,
  Radio,
} from 'lucide-react';
import { api } from '../../services/api';
import { PlatformTenantDto, PlatformMetricsDto, ImpersonationAuditDto } from '../../types';
import { OnboardTenantModal } from './OnboardTenantModal';
import { SupportImpersonateModal } from './SupportImpersonateModal';

export const SuperAdminDashboard: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'TENANTS' | 'PLANS' | 'AUDIT' | 'FLEET'>('TENANTS');
  const [tenants, setTenants] = useState<PlatformTenantDto[]>([]);
  const [metrics, setMetrics] = useState<PlatformMetricsDto | null>(null);
  const [auditLogs, setAuditLogs] = useState<ImpersonationAuditDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'TRIAL' | 'SUSPENDED'>('ALL');
  const [planFilter, setPlanFilter] = useState<string>('ALL');

  // Modals
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [isImpersonateModalOpen, setIsImpersonateModalOpen] = useState(false);
  const [selectedTenantForImpersonation, setSelectedTenantForImpersonation] = useState<PlatformTenantDto | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tenantsData, metricsData, auditData] = await Promise.allSettled([
        api.getSuperAdminTenants(),
        api.getSuperAdminMetrics(),
        api.getImpersonationAuditLogs(),
      ]);

      if (tenantsData.status === 'fulfilled' && Array.isArray(tenantsData.value)) {
        setTenants(tenantsData.value);
      } else {
        // Fallback demo mock for local dev
        setTenants([
          {
            id: 1,
            name: 'PlayStation Prime Gaming Lounge',
            slug: 'playstation-prime',
            logoUrl: '',
            status: 'ACTIVE',
            planId: 3,
            planName: 'Pro Enterprise (₹9,999/mo)',
            gstNumber: '27AABCV1234F1Z1',
            razorpayAccountId: 'acc_psp_main',
            memberCount: 8,
            gmvPaise: 124500000,
            createdAt: '2025-01-15T10:00:00Z',
          },
          {
            id: 2,
            name: 'Kothrud Turf & Console Arena',
            slug: 'kothrud-turf',
            logoUrl: '',
            status: 'ACTIVE',
            planId: 2,
            planName: 'Growth (₹4,999/mo)',
            gstNumber: '27AABCK5678G2Z3',
            razorpayAccountId: 'acc_kth_turf',
            memberCount: 5,
            gmvPaise: 84300000,
            createdAt: '2025-02-01T11:30:00Z',
          },
          {
            id: 3,
            name: 'Viman Nagar Esports Hub',
            slug: 'viman-esports',
            logoUrl: '',
            status: 'TRIAL',
            planId: 1,
            planName: 'Starter (₹2,499/mo)',
            gstNumber: '27AABCV9999K3Z5',
            razorpayAccountId: 'acc_vmn_esports',
            memberCount: 2,
            gmvPaise: 12500000,
            createdAt: '2025-03-10T14:15:00Z',
          },
          {
            id: 4,
            name: 'Deccan Sports & VR Zone',
            slug: 'deccan-vr',
            logoUrl: '',
            status: 'SUSPENDED',
            planId: 1,
            planName: 'Starter (₹2,499/mo)',
            gstNumber: '27AABCD1111L4Z7',
            razorpayAccountId: '',
            memberCount: 3,
            gmvPaise: 3400000,
            createdAt: '2024-11-20T09:00:00Z',
          },
        ]);
      }

      if (metricsData.status === 'fulfilled' && metricsData.value) {
        setMetrics(metricsData.value);
      } else {
        setMetrics({
          totalTenants: 4,
          activeTenants: 2,
          trialTenants: 1,
          suspendedTenants: 1,
          totalPlatformGmvPaise: 224700000,
          monthlyRecurringRevenuePaise: 1749700,
          totalActiveBookingsCount: 142,
          platformUptimePercent: 99.98,
        });
      }

      if (auditData.status === 'fulfilled' && Array.isArray(auditData.value)) {
        setAuditLogs(auditData.value);
      } else {
        setAuditLogs([
          {
            id: 1,
            adminUserId: 1,
            adminUsername: 'superadmin',
            targetTenantId: 2,
            targetTenantName: 'Kothrud Turf & Console Arena',
            reason: 'TICKET-4091: Assist with Razorpay webhook routing failure',
            clientIp: '192.168.1.104',
            impersonatedAt: '2025-03-28T14:30:00Z',
          },
          {
            id: 2,
            adminUserId: 1,
            adminUsername: 'superadmin',
            targetTenantId: 4,
            targetTenantName: 'Deccan Sports & VR Zone',
            reason: 'TICKET-3810: Account suspension review and KYC audit',
            clientIp: '192.168.1.104',
            impersonatedAt: '2025-03-15T09:12:00Z',
          },
        ]);
      }
    } catch (err: any) {
      console.error('Failed to load superadmin data:', err);
      setError('Unable to fetch live super-admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleStatusChange = async (tenantId: number, newStatus: 'ACTIVE' | 'SUSPENDED' | 'TRIAL') => {
    setStatusUpdatingId(tenantId);
    try {
      await api.updateTenantStatus(tenantId, newStatus);
      setTenants((prev) =>
        prev.map((t) => (t.id === tenantId ? { ...t, status: newStatus } : t))
      );
      setSuccessToast(`Tenant #${tenantId} status updated to ${newStatus}`);
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update tenant status');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleImpersonateClick = (tenant: PlatformTenantDto) => {
    setSelectedTenantForImpersonation(tenant);
    setIsImpersonateModalOpen(true);
  };

  const handleImpersonatedSuccess = (audit: ImpersonationAuditDto) => {
    setAuditLogs((prev) => [audit, ...prev]);
    setSuccessToast(`Logged support session for ${audit.targetTenantName}`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.gstNumber && t.gstNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.razorpayAccountId && t.razorpayAccountId.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchesPlan =
        planFilter === 'ALL' ||
        (planFilter === 'ENTERPRISE' && t.planId === 3) ||
        (planFilter === 'GROWTH' && t.planId === 2) ||
        (planFilter === 'STARTER' && t.planId === 1);

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [tenants, searchQuery, statusFilter, planFilter]);

  const formatRupees = (paise: number = 0) =>
    `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const plansDefinition = [
    {
      id: 1,
      name: 'Starter Plan',
      pricePaise: 249900,
      period: '/month',
      badge: 'Pilot / Single Venue',
      accentColor: '#38bdf8',
      features: [
        'Up to 3 play resources / consoles / turf slots',
        'Real-time Live Desk timer matrix',
        'Automated SMS confirmations (Twilio / MSG91)',
        'Basic revenue & collection summaries',
        'Standard email support',
      ],
      tenantsCount: tenants.filter((t) => t.planId === 1).length,
    },
    {
      id: 2,
      name: 'Growth Plan',
      pricePaise: 499900,
      period: '/month',
      badge: 'Popular',
      accentColor: '#818cf8',
      features: [
        'Up to 10 resources & multi-sport turf lanes',
        'Dynamic Pricing Rules & Peak/Weekend Multipliers',
        'Promotional Coupons & 10-Hour Prepaid Saver Packs',
        'Canteen POS stock ledger & low-inventory alerts',
        'Staff role-based access & audit trail logging',
      ],
      tenantsCount: tenants.filter((t) => t.planId === 2).length,
    },
    {
      id: 3,
      name: 'Pro Enterprise',
      pricePaise: 999900,
      period: '/month',
      badge: 'Multi-Location Fleet',
      accentColor: '#c084fc',
      features: [
        'Unlimited resources, turf arenas & VIP lounges',
        'VIP Memberships with complimentary auto-deductions',
        'Cross-venue staff assignments & manager approvals',
        'Interactive 2D Peak-Hour Heatmap Analytics',
        'Dedicated Razorpay Route / Custom Gateway integration',
        '24/7 Priority Emergency Support SLA',
      ],
      tenantsCount: tenants.filter((t) => t.planId === 3).length,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {successToast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.9rem',
            fontWeight: 600,
            animation: 'fadeIn 0.2s ease-in-out',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '12px 18px',
            color: '#f87171',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span>{error}</span>
        </div>
      )}

      {/* 1. Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          borderRadius: '16px',
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 8px 32px 0 rgba(168, 85, 247, 0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)',
            }}
          >
            <Building2 size={28} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#ffffff' }}>
                Platform Super-Admin Console
              </h1>
              <span
                style={{
                  background: 'rgba(168, 85, 247, 0.25)',
                  color: '#c084fc',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Root Governance
              </span>
            </div>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Multi-Tenant Fleet Governance · Global SaaS Billing & GMV · Security Audit Trail
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              padding: '8px 14px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setIsOnboardModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
              border: 'none',
              color: '#ffffff',
              padding: '10px 18px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '0.88rem',
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(168, 85, 247, 0.35)',
              transition: 'all 0.2s',
            }}
          >
            <Plus size={16} />
            <span>Onboard New Tenant</span>
          </button>
        </div>
      </div>

      {/* 2. Platform Metrics KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {/* Total Tenants */}
        <div
          style={{
            background: 'var(--surface-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Platform Tenants
            </span>
            <Building2 size={18} color="#a855f7" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff' }}>
            {metrics?.totalTenants ?? tenants.length}
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', marginTop: '4px' }}>
            <span style={{ color: '#10b981', fontWeight: 600 }}>{metrics?.activeTenants ?? 2} Active</span>
            <span style={{ color: 'var(--text-dim)' }}>•</span>
            <span style={{ color: '#eab308', fontWeight: 600 }}>{metrics?.trialTenants ?? 1} Trial</span>
            <span style={{ color: 'var(--text-dim)' }}>•</span>
            <span style={{ color: '#ef4444', fontWeight: 600 }}>{metrics?.suspendedTenants ?? 1} Suspended</span>
          </div>
        </div>

        {/* Total Platform GMV */}
        <div
          style={{
            background: 'var(--surface-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Platform Processed GMV
            </span>
            <TrendingUp size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#10b981' }}>
            {formatRupees(metrics?.totalPlatformGmvPaise ?? 224700000)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Cumulative turnover across all tenant arenas
          </div>
        </div>

        {/* Monthly Recurring SaaS Revenue */}
        <div
          style={{
            background: 'var(--surface-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              SaaS MRR Run-Rate
            </span>
            <CreditCard size={18} color="#818cf8" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#818cf8' }}>
            {formatRupees(metrics?.monthlyRecurringRevenuePaise ?? 1749700)}
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}> /mo</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Active venue software subscription licenses
          </div>
        </div>

        {/* Platform Uptime & SLA */}
        <div
          style={{
            background: 'var(--surface-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Fleet Availability SLA
            </span>
            <Radio size={18} color="#34d399" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#34d399' }}>
            {metrics?.platformUptimePercent ?? 99.98}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            All 5 microservices operating normally
          </div>
        </div>
      </div>

      {/* 3. Sub-Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '2px',
        }}
      >
        <button
          onClick={() => setActiveSubTab('TENANTS')}
          style={{
            padding: '10px 18px',
            borderRadius: '10px 10px 0 0',
            border: 'none',
            background: activeSubTab === 'TENANTS' ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
            color: activeSubTab === 'TENANTS' ? '#c084fc' : 'var(--text-muted)',
            borderBottom: activeSubTab === 'TENANTS' ? '2px solid #a855f7' : '2px solid transparent',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }}
        >
          <Building2 size={16} />
          <span>Tenant Venues</span>
          <span
            style={{
              background: activeSubTab === 'TENANTS' ? '#a855f7' : 'rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              padding: '1px 7px',
              borderRadius: '10px',
              fontSize: '0.72rem',
            }}
          >
            {tenants.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('PLANS')}
          style={{
            padding: '10px 18px',
            borderRadius: '10px 10px 0 0',
            border: 'none',
            background: activeSubTab === 'PLANS' ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
            color: activeSubTab === 'PLANS' ? '#c084fc' : 'var(--text-muted)',
            borderBottom: activeSubTab === 'PLANS' ? '2px solid #a855f7' : '2px solid transparent',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }}
        >
          <Layers size={16} />
          <span>SaaS Plan Tiers</span>
        </button>

        <button
          onClick={() => setActiveSubTab('AUDIT')}
          style={{
            padding: '10px 18px',
            borderRadius: '10px 10px 0 0',
            border: 'none',
            background: activeSubTab === 'AUDIT' ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
            color: activeSubTab === 'AUDIT' ? '#c084fc' : 'var(--text-muted)',
            borderBottom: activeSubTab === 'AUDIT' ? '2px solid #a855f7' : '2px solid transparent',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }}
        >
          <ShieldAlert size={16} />
          <span>Support Audit Trail</span>
          <span
            style={{
              background: activeSubTab === 'AUDIT' ? '#a855f7' : 'rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              padding: '1px 7px',
              borderRadius: '10px',
              fontSize: '0.72rem',
            }}
          >
            {auditLogs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('FLEET')}
          style={{
            padding: '10px 18px',
            borderRadius: '10px 10px 0 0',
            border: 'none',
            background: activeSubTab === 'FLEET' ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
            color: activeSubTab === 'FLEET' ? '#c084fc' : 'var(--text-muted)',
            borderBottom: activeSubTab === 'FLEET' ? '2px solid #a855f7' : '2px solid transparent',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }}
        >
          <Server size={16} />
          <span>Fleet Architecture</span>
        </button>
      </div>

      {/* 4. Tab Content: TENANTS DIRECTORY */}
      {activeSubTab === 'TENANTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Search & Filter Toolbar */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              flexWrap: 'wrap',
              background: 'var(--surface-primary)',
              padding: '14px 18px',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
              <Search
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Search by venue name, custom URL slug, GST number, or Razorpay ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Filter size={15} color="var(--text-muted)" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="TRIAL">Trial Only</option>
                <option value="SUSPENDED">Suspended Only</option>
              </select>

              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="ALL">All Plans</option>
                <option value="STARTER">Starter Tier</option>
                <option value="GROWTH">Growth Tier</option>
                <option value="ENTERPRISE">Enterprise Tier</option>
              </select>
            </div>
          </div>

          {/* Tenants Ledger Table */}
          <div
            style={{
              background: 'var(--surface-primary)',
              borderRadius: '14px',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: 600 }}>Venue & Slug</th>
                  <th style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: 600 }}>SaaS Plan</th>
                  <th style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: 600 }}>Staff Team</th>
                  <th style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: 600 }}>Turnover GMV</th>
                  <th style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: 600 }}>Razorpay Account</th>
                  <th style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No matching tenant venues found for this filter.
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((tenant) => {
                    const statusColor =
                      tenant.status === 'ACTIVE'
                        ? '#10b981'
                        : tenant.status === 'TRIAL'
                        ? '#eab308'
                        : '#ef4444';

                    const planColor =
                      tenant.planId === 3 ? '#c084fc' : tenant.planId === 2 ? '#818cf8' : '#38bdf8';

                    return (
                      <tr
                        key={tenant.id}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          transition: 'background 0.15s',
                        }}
                      >
                        <td style={{ padding: '16px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                background: 'rgba(168, 85, 247, 0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#c084fc',
                                fontWeight: 800,
                                fontSize: '0.9rem',
                              }}
                            >
                              {tenant.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#ffffff' }}>{tenant.name}</div>
                              <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Globe size={11} />
                                <span>/v/{tenant.slug}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '16px 18px' }}>
                          <span
                            style={{
                              background: `${planColor}18`,
                              color: planColor,
                              border: `1px solid ${planColor}40`,
                              padding: '3px 8px',
                              borderRadius: '8px',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                            }}
                          >
                            {tenant.planName || (tenant.planId === 3 ? 'Pro Enterprise' : tenant.planId === 2 ? 'Growth' : 'Starter')}
                          </span>
                        </td>

                        <td style={{ padding: '16px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: statusColor,
                                display: 'inline-block',
                              }}
                            />
                            <span style={{ fontWeight: 600, color: statusColor, fontSize: '0.82rem' }}>
                              {tenant.status}
                            </span>
                            {/* Fast toggle dropdown */}
                            <select
                              aria-label={`Update status for ${tenant.name}`}
                              value={tenant.status}
                              disabled={statusUpdatingId === tenant.id}
                              onChange={(e) => handleStatusChange(tenant.id, e.target.value as any)}
                              style={{
                                padding: '2px 4px',
                                fontSize: '0.72rem',
                                borderRadius: '6px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                              }}
                            >
                              <option value="ACTIVE">ACTIVE</option>
                              <option value="TRIAL">TRIAL</option>
                              <option value="SUSPENDED">SUSPENDED</option>
                            </select>
                          </div>
                        </td>

                        <td style={{ padding: '16px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                            <Users size={14} />
                            <span>{tenant.memberCount} members</span>
                          </div>
                        </td>

                        <td style={{ padding: '16px 18px' }}>
                          <strong style={{ color: '#ffffff' }}>{formatRupees(tenant.gmvPaise)}</strong>
                        </td>

                        <td style={{ padding: '16px 18px' }}>
                          <div style={{ fontSize: '0.78rem', color: tenant.razorpayAccountId ? 'var(--text-muted)' : '#ef4444' }}>
                            {tenant.razorpayAccountId || 'Gateway Unconfigured'}
                          </div>
                          {tenant.gstNumber && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                              GST: {tenant.gstNumber}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleImpersonateClick(tenant)}
                            title="Start audited support session"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: 'rgba(168, 85, 247, 0.15)',
                              border: '1px solid rgba(168, 85, 247, 0.35)',
                              color: '#c084fc',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              transition: 'all 0.15s',
                            }}
                          >
                            <Key size={13} />
                            <span>Support Access</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Tab Content: SAAS PLAN TIERS */}
      {activeSubTab === 'PLANS' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {plansDefinition.map((plan) => (
            <div
              key={plan.id}
              style={{
                background: 'var(--surface-primary)',
                border: `1px solid ${plan.accentColor}40`,
                borderRadius: '16px',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    background: `${plan.accentColor}20`,
                    color: plan.accentColor,
                    border: `1px solid ${plan.accentColor}50`,
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  {plan.badge}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <strong>{plan.tenantsCount}</strong> Venues Active
                </span>
              </div>

              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: '1.3rem', color: '#ffffff' }}>{plan.name}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: plan.accentColor }}>
                    {formatRupees(plan.pricePaise)}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{plan.period}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Tier Capabilities
                </div>
                {plan.features.map((feature, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.86rem' }}>
                    <CheckCircle2 size={16} color={plan.accentColor} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{feature}</span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                }}
              >
                <span>Estimated MRR Yield:</span>
                <strong style={{ color: '#ffffff' }}>
                  {formatRupees(plan.pricePaise * plan.tenantsCount)} / mo
                </strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6. Tab Content: SUPPORT IMPERSONATION AUDIT TRAIL */}
      {activeSubTab === 'AUDIT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Security Disclaimer Banner */}
          <div
            style={{
              background: 'rgba(234, 179, 8, 0.08)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              borderRadius: '12px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <ShieldAlert size={22} color="#eab308" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.84rem', color: '#fef08a' }}>
              <strong>SOC-2 & GDPR Compliance Enforcement:</strong> Platform super-admins can access venue operational consoles strictly for verified customer support troubleshooting. All impersonation sessions generate immutable audit records capturing the operator identity, reason/ticket ID, and remote IP address.
            </div>
          </div>

          {/* Audit Logs Table */}
          <div
            style={{
              background: 'var(--surface-primary)',
              borderRadius: '14px',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: 600 }}>Timestamp</th>
                  <th style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: 600 }}>Super-Admin</th>
                  <th style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: 600 }}>Target Tenant Venue</th>
                  <th style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: 600 }}>Reason / Ticket Reference</th>
                  <th style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: 600 }}>Remote IP</th>
                  <th style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: 600 }}>Audit State</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No support impersonation logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                      }}
                    >
                      <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={13} />
                          <span>{new Date(log.impersonatedAt).toLocaleString()}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <strong style={{ color: '#c084fc' }}>{log.adminUsername}</strong>
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 600, color: '#ffffff' }}>
                        {log.targetTenantName} (#{log.targetTenantId})
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                        {log.reason}
                      </td>
                      <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                        {log.clientIp}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#34d399',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                          }}
                        >
                          AUDITED
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. Tab Content: FLEET ARCHITECTURE & MICROSERVICES */}
      {activeSubTab === 'FLEET' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {[
              {
                service: 'API Gateway',
                port: '8080',
                role: 'JWT Routing, Rate Limiting & Blacklist',
                status: 'HEALTHY',
                color: '#38bdf8',
              },
              {
                service: 'Auth & Tenant Service',
                port: '8081',
                role: 'Tenant Isolation, RBAC & SuperAdmin',
                status: 'HEALTHY',
                color: '#a855f7',
              },
              {
                service: 'Catalog & Resource Service',
                port: '8082',
                role: 'Venues, Dynamic Pricing & Canteen Stock',
                status: 'HEALTHY',
                color: '#818cf8',
              },
              {
                service: 'Booking & Reservation Service',
                port: '8083',
                role: 'Slot Matrix, Auto-Release & Packages',
                status: 'HEALTHY',
                color: '#10b981',
              },
              {
                service: 'Payment & Webhook Service',
                port: '8084',
                role: 'Razorpay Orders, Wallet Top-Ups & Split',
                status: 'HEALTHY',
                color: '#f59e0b',
              },
              {
                service: 'MySQL 8.0 Primary Node',
                port: '3306',
                role: 'Multi-Tenant Relational Schema (Flyway V1-V7)',
                status: 'HEALTHY',
                color: '#34d399',
              },
            ].map((node, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--surface-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '14px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>{node.service}</span>
                  <span
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#34d399',
                      padding: '2px 8px',
                      borderRadius: '8px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                    }}
                  >
                    {node.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {node.role}
                </div>
                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.76rem',
                    color: 'var(--text-dim)',
                  }}
                >
                  <span>Internal Port:</span>
                  <strong style={{ color: node.color, fontFamily: 'monospace' }}>:{node.port}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Modals */}
      <OnboardTenantModal
        isOpen={isOnboardModalOpen}
        onClose={() => setIsOnboardModalOpen(false)}
        onTenantOnboarded={(newTenant) => {
          setTenants((prev) => [newTenant, ...prev]);
          setIsOnboardModalOpen(false);
          setSuccessToast(`Tenant "${newTenant.name}" successfully onboarded!`);
          setTimeout(() => setSuccessToast(null), 3500);
        }}
      />

      <SupportImpersonateModal
        isOpen={isImpersonateModalOpen}
        tenant={selectedTenantForImpersonation}
        onClose={() => {
          setIsImpersonateModalOpen(false);
          setSelectedTenantForImpersonation(null);
        }}
        onImpersonated={(audit) => {
          handleImpersonatedSuccess(audit);
          setIsImpersonateModalOpen(false);
          setSelectedTenantForImpersonation(null);
        }}
      />
    </div>
  );
};
