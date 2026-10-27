import React, { useState, useEffect } from 'react';
import {
  Tag,
  Clock,
  Plus,
  Search,
  RefreshCw,
  Gift,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Trash2,
  Copy,
  Users,
} from 'lucide-react';
import { api } from '../../services/api';
import { CouponDto, PrepaidPackageDto, CustomerPrepaidPackageDto } from '../../types';
import { AddCouponModal } from './AddCouponModal';
import { AddPrepaidPackageModal } from './AddPrepaidPackageModal';

export const PromotionManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'COUPONS' | 'PACKAGES' | 'LEDGER'>('COUPONS');
  const [coupons, setCoupons] = useState<CouponDto[]>([]);
  const [packages, setPackages] = useState<PrepaidPackageDto[]>([]);
  const [customerPackages, setCustomerPackages] = useState<CustomerPrepaidPackageDto[]>([]);
  const [sports, setSports] = useState<Array<{ code: string; nameEn: string }>>([]);

  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [togglingPackageId, setTogglingPackageId] = useState<number | null>(null);

  const fetchCoupons = async () => {
    try {
      const data = await api.getCoupons();
      setCoupons(data);
    } catch {
      // Fallback demo mock
      setCoupons([
        {
          id: 1,
          code: 'SUMMER25',
          discountType: 'PERCENTAGE',
          discountValue: 25,
          minBookingAmountPaise: 50000,
          maxDiscountPaise: 25000,
          applicableSportCode: undefined,
          validFrom: new Date().toISOString(),
          validTo: new Date(Date.now() + 30 * 86400000).toISOString(),
          maxUses: 200,
          usedCount: 48,
          active: true,
        },
        {
          id: 2,
          code: 'TURF100',
          discountType: 'FLAT',
          discountValue: 10000,
          minBookingAmountPaise: 100000,
          applicableSportCode: 'TURF',
          validFrom: new Date().toISOString(),
          validTo: new Date(Date.now() + 14 * 86400000).toISOString(),
          maxUses: 100,
          usedCount: 12,
          active: true,
        },
      ]);
    }
  };

  const fetchPackages = async () => {
    try {
      const data = await api.getPrepaidPackages();
      setPackages(data);
    } catch {
      setPackages([
        {
          id: 1,
          name: 'Box Cricket 10-Hours Saver',
          sportCode: 'CRICKET',
          totalMinutes: 600,
          totalHours: 10,
          pricePaise: 450000,
          priceRupees: 4500,
          validityDays: 60,
          active: true,
        },
        {
          id: 2,
          name: 'Badminton Pro 20-Hours Bundle',
          sportCode: 'BADMINTON',
          totalMinutes: 1200,
          totalHours: 20,
          pricePaise: 600000,
          priceRupees: 6000,
          validityDays: 90,
          active: true,
        },
        {
          id: 3,
          name: 'All-Arena 5-Hours Flexi Pass',
          sportCode: undefined,
          totalMinutes: 300,
          totalHours: 5,
          pricePaise: 240000,
          priceRupees: 2400,
          validityDays: 30,
          active: false,
        },
      ]);
    }
  };

  const fetchLedger = async () => {
    try {
      const data = await api.getCustomerPrepaidLedger();
      setCustomerPackages(data);
    } catch {
      setCustomerPackages([
        {
          id: 101,
          userId: 54,
          packageId: 1,
          packageName: 'Box Cricket 10-Hours Saver',
          sportCode: 'CRICKET',
          totalMinutes: 600,
          totalHours: 10,
          remainingMinutes: 420,
          remainingHours: 7,
          purchasedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
          expiresAt: new Date(Date.now() + 55 * 86400000).toISOString(),
          status: 'ACTIVE',
        },
      ]);
    }
  };

  const fetchSports = async () => {
    try {
      const data = await api.getSports();
      setSports(data);
    } catch {
      setSports([
        { code: 'CRICKET', nameEn: 'Cricket' },
        { code: 'BADMINTON', nameEn: 'Badminton' },
        { code: 'TURF', nameEn: 'Football Turf' },
        { code: 'PLAYSTATION', nameEn: 'PlayStation Arena' },
      ]);
    }
  };

  useEffect(() => {
    fetchCoupons();
    fetchPackages();
    fetchLedger();
    fetchSports();
  }, []);

  const handleTogglePackage = async (id: number) => {
    setTogglingPackageId(id);
    try {
      const updated = await api.togglePrepaidPackage(id);
      setPackages((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (err: any) {
      alert(err.message || 'Failed to toggle package');
    } finally {
      setTogglingPackageId(null);
    }
  };

  const handleDeleteCoupon = async (id: number) => {
    if (!window.confirm('Are you sure you want to deactivate this promo code?')) return;
    try {
      await api.deleteCoupon(id);
      setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, active: false } : c)));
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate coupon');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.applicableSportCode && c.applicableSportCode.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredPackages = packages.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sportCode && p.sportCode.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredLedger = customerPackages.filter(
    (l) =>
      l.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(l.userId).includes(searchQuery)
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#f8fafc',
              margin: '0 0 6px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Gift style={{ color: '#ec4899' }} size={28} />
            Promotions & Prepaid Hours Engine
          </h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
            Drive customer retention with custom coupon discounts and bulk prepaid hour bundles.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {activeTab === 'COUPONS' && (
            <button
              onClick={() => setIsCouponModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)',
              }}
            >
              <Plus size={18} />
              <span>Create Coupon</span>
            </button>
          )}

          {activeTab === 'PACKAGES' && (
            <button
              onClick={() => setIsPackageModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              }}
            >
              <Plus size={18} />
              <span>New Hours Package</span>
            </button>
          )}

          <button
            onClick={() => {
              fetchCoupons();
              fetchPackages();
              fetchLedger();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              backgroundColor: '#1e293b',
              color: '#cbd5e1',
              border: '1px solid #334155',
              borderRadius: '10px',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '18px 20px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Active Promo Coupons</span>
            <Tag size={20} style={{ color: '#ec4899' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', marginTop: '10px' }}>
            {coupons.filter((c) => c.active).length}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle size={14} /> Total {coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0)} redemptions
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '18px 20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Prepaid Hour Packages</span>
            <Clock size={20} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', marginTop: '10px' }}>
            {packages.filter((p) => p.active).length} Active
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
            {packages.length} total package templates
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '18px 20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Customers With Hours</span>
            <Users size={20} style={{ color: '#6366f1' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', marginTop: '10px' }}>
            {customerPackages.filter((cp) => cp.status === 'ACTIVE').length}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#6366f1', marginTop: '4px' }}>
            Active hours balance held in customer accounts
          </div>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#0f172a',
          padding: '8px 12px',
          borderRadius: '12px',
          border: '1px solid #1e293b',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('COUPONS')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'COUPONS' ? '#ec4899' : 'transparent',
              color: activeTab === 'COUPONS' ? '#ffffff' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Tag size={16} />
            <span>Coupons ({coupons.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('PACKAGES')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'PACKAGES' ? '#10b981' : 'transparent',
              color: activeTab === 'PACKAGES' ? '#ffffff' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Clock size={16} />
            <span>Prepaid Hour Packages ({packages.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('LEDGER')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'LEDGER' ? '#6366f1' : 'transparent',
              color: activeTab === 'LEDGER' ? '#ffffff' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <TrendingUp size={16} />
            <span>Customer Hours Ledger ({customerPackages.length})</span>
          </button>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748b',
            }}
          />
          <input
            type="text"
            placeholder="Search code, sport, or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '0.85rem',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* TAB 1: COUPONS */}
      {activeTab === 'COUPONS' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredCoupons.length === 0 ? (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '48px',
                textAlign: 'center',
                backgroundColor: '#1e293b',
                borderRadius: '12px',
                border: '1px dashed #334155',
                color: '#94a3b8',
              }}
            >
              <Tag size={40} style={{ opacity: 0.4, marginBottom: '12px' }} />
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>No promo coupons found</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>Create a new promotional code to get started.</p>
            </div>
          ) : (
            filteredCoupons.map((coupon) => (
              <div
                key={coupon.id}
                style={{
                  backgroundColor: '#1e293b',
                  borderRadius: '12px',
                  border: `1px solid ${coupon.active ? 'rgba(236, 72, 153, 0.4)' : '#334155'}`,
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: coupon.active ? '0 4px 16px rgba(236, 72, 153, 0.08)' : 'none',
                  opacity: coupon.active ? 1 : 0.65,
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'rgba(236, 72, 153, 0.15)',
                        border: '1px dashed #ec4899',
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        letterSpacing: '1px',
                        color: '#f472b6',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                      }}
                      onClick={() => copyToClipboard(coupon.code)}
                      title="Click to copy promo code"
                    >
                      <span>{coupon.code}</span>
                      <Copy size={14} style={{ opacity: 0.8 }} />
                      {copiedCode === coupon.code && (
                        <span style={{ fontSize: '0.7rem', color: '#10b981' }}>Copied!</span>
                      )}
                    </div>

                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: coupon.active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                        color: coupon.active ? '#34d399' : '#94a3b8',
                      }}
                    >
                      {coupon.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>

                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>
                    {coupon.discountType === 'PERCENTAGE'
                      ? `${coupon.discountValue}% OFF`
                      : `₹${(coupon.discountValue / 100).toFixed(0)} OFF`}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: '#cbd5e1' }}>
                    {coupon.maxDiscountPaise && (
                      <div>Max Discount: <strong style={{ color: '#f8fafc' }}>₹{(coupon.maxDiscountPaise / 100).toFixed(0)}</strong></div>
                    )}
                    <div>
                      Min Booking: <strong style={{ color: '#f8fafc' }}>₹{((coupon.minBookingAmountPaise || 0) / 100).toFixed(0)}</strong>
                    </div>
                    <div>
                      Sport Scope:{' '}
                      <strong style={{ color: coupon.applicableSportCode ? '#60a5fa' : '#34d399' }}>
                        {coupon.applicableSportCode || 'All Sports'}
                      </strong>
                    </div>
                  </div>

                  {/* Usage Bar */}
                  <div style={{ marginTop: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
                      <span>Redemptions</span>
                      <span>
                        {coupon.usedCount} / {coupon.maxUses}
                      </span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#0f172a', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(100, ((coupon.usedCount || 0) / (coupon.maxUses || 1)) * 100)}%`,
                          background: 'linear-gradient(90deg, #ec4899, #8b5cf6)',
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '18px',
                    paddingTop: '12px',
                    borderTop: '1px solid #334155',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Valid till: {new Date(coupon.validTo).toLocaleDateString()}
                  </span>

                  {coupon.active && (
                    <button
                      onClick={() => handleDeleteCoupon(coupon.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#f87171',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem',
                      }}
                      title="Deactivate Promo Code"
                    >
                      <Trash2 size={14} />
                      <span>Deactivate</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: PREPAID PACKAGES */}
      {activeTab === 'PACKAGES' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredPackages.length === 0 ? (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '48px',
                textAlign: 'center',
                backgroundColor: '#1e293b',
                borderRadius: '12px',
                border: '1px dashed #334155',
                color: '#94a3b8',
              }}
            >
              <Clock size={40} style={{ opacity: 0.4, marginBottom: '12px' }} />
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>No prepaid hours packages created</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>Create bulk hours packages to increase upfront cash flow.</p>
            </div>
          ) : (
            filteredPackages.map((pkg) => (
              <div
                key={pkg.id}
                style={{
                  backgroundColor: '#1e293b',
                  borderRadius: '12px',
                  border: `1px solid ${pkg.active ? 'rgba(16, 185, 129, 0.4)' : '#334155'}`,
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: pkg.active ? '0 4px 16px rgba(16, 185, 129, 0.08)' : 'none',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        color: '#60a5fa',
                      }}
                    >
                      {pkg.sportCode || 'ALL SPORTS'}
                    </span>

                    <button
                      onClick={() => handleTogglePackage(pkg.id)}
                      disabled={togglingPackageId === pkg.id}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        color: pkg.active ? '#10b981' : '#64748b',
                      }}
                      title={pkg.active ? 'Click to deactivate' : 'Click to activate'}
                    >
                      {pkg.active ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                    </button>
                  </div>

                  <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
                    {pkg.name}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '14px' }}>
                    <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>
                      ₹{pkg.priceRupees.toLocaleString('en-IN')}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                      ({pkg.totalHours} hrs • ₹{Math.round(pkg.priceRupees / pkg.totalHours)}/hr)
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: '#cbd5e1' }}>
                    <div>Total Play Time: <strong style={{ color: '#f8fafc' }}>{pkg.totalHours} Hours</strong> ({pkg.totalMinutes} mins)</div>
                    <div>Validity Period: <strong style={{ color: '#f8fafc' }}>{pkg.validityDays} Days</strong></div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '20px',
                    paddingTop: '12px',
                    borderTop: '1px solid #334155',
                    fontSize: '0.75rem',
                  }}
                >
                  <span style={{ color: pkg.active ? '#34d399' : '#94a3b8', fontWeight: 600 }}>
                    {pkg.active ? '● Available in Customer App' : '○ Inactive / Hidden'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: CUSTOMER HOURS LEDGER */}
      {activeTab === 'LEDGER' && (
        <div
          style={{
            backgroundColor: '#1e293b',
            borderRadius: '12px',
            border: '1px solid #334155',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Record ID</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Customer ID</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Package Name</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Sport Scope</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Remaining Hours</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Expires At</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                      No customer packages purchased yet.
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map((item) => (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid #334155',
                        color: '#f8fafc',
                      }}
                    >
                      <td style={{ padding: '14px 16px', color: '#94a3b8' }}>#{item.id}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>Customer #{item.userId}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>{item.packageName}</td>
                      <td style={{ padding: '14px 16px', color: '#60a5fa' }}>{item.sportCode || 'ALL'}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <strong style={{ color: item.remainingHours > 0 ? '#10b981' : '#f87171' }}>
                          {item.remainingHours} hrs
                        </strong>{' '}
                        <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                          / {item.totalHours} hrs
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#cbd5e1' }}>
                        {new Date(item.expiresAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor:
                              item.status === 'ACTIVE'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : item.status === 'EXHAUSTED'
                                ? 'rgba(239, 68, 68, 0.15)'
                                : 'rgba(148, 163, 184, 0.15)',
                            color:
                              item.status === 'ACTIVE'
                                ? '#34d399'
                                : item.status === 'EXHAUSTED'
                                ? '#f87171'
                                : '#94a3b8',
                          }}
                        >
                          {item.status}
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

      {/* Modals */}
      <AddCouponModal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        onCouponCreated={(newCoupon) => setCoupons((prev) => [newCoupon, ...prev])}
        sports={sports}
      />

      <AddPrepaidPackageModal
        isOpen={isPackageModalOpen}
        onClose={() => setIsPackageModalOpen(false)}
        onPackageCreated={(newPkg) => setPackages((prev) => [newPkg, ...prev])}
        sports={sports}
      />
    </div>
  );
};
