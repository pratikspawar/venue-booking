import React from 'react';
import {
  Gamepad2,
  Calendar,
  Timer,
  ShieldCheck,
  Coins,
  BarChart3,
  Key,
  LayoutGrid,
  LogOut,
  Users,
  Globe,
  Crown,
  Tag,
  Building2,
} from 'lucide-react';
import { SidebarController } from './Sidebar.controller';
import './Sidebar.css';

export interface SidebarViewProps {
  controller: SidebarController;
}

export const SidebarView: React.FC<SidebarViewProps> = ({ controller }) => {
  const {
    activeTab,
    setActiveTab,
    activeSessionsCount,
    tenant,
    openGatewaySettingsModal,
    language,
    setLanguage,
    langOptions,
    t,
    handleLogout,
  } = controller;

  return (
    <aside className="app-sidebar">
      <div>
        {/* Brand & Logo */}
        <div className="sidebar-brand">
          <div className="sidebar-logo-icon">
            <Gamepad2 size={24} color="#ffffff" />
          </div>
          <div>
            <div className="sidebar-title">
              Venue<span style={{ color: 'var(--accent-primary)' }}>Ops</span>
            </div>
            <div className="sidebar-subtitle">Multi-Tenant Desk</div>
          </div>
        </div>

        {/* Language Selector Pills */}
        <div className="sidebar-lang-container">
          <div style={{ padding: '0 4px', display: 'flex', alignItems: 'center', color: 'var(--text-dim)' }}>
            <Globe size={13} />
          </div>
          {langOptions.map((opt) => (
            <button
              key={opt.code}
              onClick={() => setLanguage(opt.code)}
              className="sidebar-lang-btn"
              style={{
                fontWeight: language === opt.code ? 700 : 500,
                background: language === opt.code ? 'var(--accent-primary)' : 'transparent',
                color: language === opt.code ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <button
            onClick={() => setActiveTab('desk')}
            className="sidebar-nav-item"
            style={{
              background: activeTab === 'desk' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: activeTab === 'desk' ? '#818cf8' : 'var(--text-muted)',
              border: activeTab === 'desk' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
            }}
          >
            <Timer size={18} />
            <span>{t('nav_desk')}</span>
            {activeSessionsCount > 0 && (
              <span
                style={{
                  marginLeft: 'auto',
                  background: 'var(--accent-primary)',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '1px 7px',
                  fontSize: '0.72rem',
                }}
              >
                {activeSessionsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className="sidebar-nav-item"
            style={{
              background: activeTab === 'timeline' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: activeTab === 'timeline' ? '#818cf8' : 'var(--text-muted)',
              border: activeTab === 'timeline' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
            }}
          >
            <LayoutGrid size={18} />
            <span>{t('nav_timeline')}</span>
          </button>

          <button
            onClick={() => setActiveTab('resources')}
            className="sidebar-nav-item"
            style={{
              background: activeTab === 'resources' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: activeTab === 'resources' ? '#818cf8' : 'var(--text-muted)',
              border: activeTab === 'resources' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
            }}
          >
            <Gamepad2 size={18} />
            <span>{t('nav_resources')}</span>
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className="sidebar-nav-item"
            style={{
              background: activeTab === 'bookings' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: activeTab === 'bookings' ? '#818cf8' : 'var(--text-muted)',
              border: activeTab === 'bookings' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
            }}
          >
            <Calendar size={18} />
            <span>{t('nav_bookings')}</span>
          </button>

          <button
            onClick={() => setActiveTab('earnings')}
            className="sidebar-nav-item"
            style={{
              background: activeTab === 'earnings' ? 'rgba(16, 185, 129, 0.16)' : 'transparent',
              color: activeTab === 'earnings' ? '#34d399' : 'var(--text-muted)',
              border: activeTab === 'earnings' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid transparent',
            }}
          >
            <Coins size={18} />
            <span>{t('nav_earnings')}</span>
            <span
              className="sidebar-badge"
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
              }}
            >
              Audited
            </span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className="sidebar-nav-item"
            style={{
              background: activeTab === 'reports' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: activeTab === 'reports' ? '#818cf8' : 'var(--text-muted)',
              border: activeTab === 'reports' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
            }}
          >
            <BarChart3 size={18} />
            <span>{t('nav_reports')}</span>
          </button>

          <button
            onClick={() => setActiveTab('staff')}
            className="sidebar-nav-item"
            style={{
              background: activeTab === 'staff' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: activeTab === 'staff' ? '#818cf8' : 'var(--text-muted)',
              border: activeTab === 'staff' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
            }}
          >
            <Users size={18} />
            <span>{t('nav_staff')}</span>
          </button>

          <button
            onClick={() => setActiveTab('memberships')}
            className="sidebar-nav-item"
            style={{
              background: activeTab === 'memberships' ? 'rgba(234, 179, 8, 0.15)' : 'transparent',
              color: activeTab === 'memberships' ? '#eab308' : 'var(--text-muted)',
              border: activeTab === 'memberships' ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid transparent',
            }}
          >
            <Crown size={18} />
            <span>{t('nav_memberships')}</span>
            <span
              className="sidebar-badge"
              style={{
                background: 'rgba(234, 179, 8, 0.2)',
                color: '#eab308',
              }}
            >
              VIP
            </span>
          </button>

          <button
            onClick={() => setActiveTab('promotions')}
            className="sidebar-nav-item"
            style={{
              background: activeTab === 'promotions' ? 'rgba(236, 72, 153, 0.15)' : 'transparent',
              color: activeTab === 'promotions' ? '#f472b6' : 'var(--text-muted)',
              border: activeTab === 'promotions' ? '1px solid rgba(236, 72, 153, 0.3)' : '1px solid transparent',
            }}
          >
            <Tag size={18} />
            <span>{t('nav_promotions')}</span>
            <span
              className="sidebar-badge"
              style={{
                background: 'rgba(236, 72, 153, 0.2)',
                color: '#f472b6',
              }}
            >
              Promo
            </span>
          </button>

          <button
            onClick={() => setActiveTab('superadmin')}
            className="sidebar-nav-item"
            style={{
              background: activeTab === 'superadmin' ? 'rgba(168, 85, 247, 0.18)' : 'transparent',
              color: activeTab === 'superadmin' ? '#c084fc' : 'var(--text-muted)',
              border: activeTab === 'superadmin' ? '1px solid rgba(168, 85, 247, 0.35)' : '1px solid transparent',
            }}
          >
            <Building2 size={18} />
            <span>{t('nav_superadmin')}</span>
            <span
              className="sidebar-badge"
              style={{
                background: 'rgba(168, 85, 247, 0.25)',
                color: '#c084fc',
              }}
            >
              SUPER
            </span>
          </button>

          <button
            onClick={openGatewaySettingsModal}
            className="sidebar-nav-item"
            style={{
              background: 'rgba(234, 179, 8, 0.1)',
              color: '#facc15',
              border: '1px solid rgba(234, 179, 8, 0.25)',
              marginTop: '4px',
            }}
          >
            <Key size={18} />
            <span>{t('nav_gateway')}</span>
            <span
              className="sidebar-badge"
              style={{
                background: 'rgba(234, 179, 8, 0.2)',
                color: '#fde047',
              }}
            >
              BYOK
            </span>
          </button>
        </nav>
      </div>

      {/* Tenant & Operator Badge */}
      <div className="sidebar-tenant-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--accent-emerald)' }}>
          <ShieldCheck size={14} />
          <span>Microservices Cloud Active</span>
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
          {tenant.name}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {tenant.staffName}
        </div>
        <button
          onClick={handleLogout}
          className="sidebar-logout-btn"
          title="Sign out & revoke access tokens"
        >
          <LogOut size={13} />
          <span>{t('nav_logout')}</span>
        </button>
      </div>
    </aside>
  );
};
