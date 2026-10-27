import React from 'react';
import {
  History,
  Search,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  UtensilsCrossed,
  Receipt,
  AlertTriangle,
  Download,
  ShieldCheck,
  User,
} from 'lucide-react';
import { ActivityAuditLogController } from './ActivityAuditLog.controller';
import { AuditLogEntry } from '../../../types';
import './ActivityAuditLog.css';

export interface ActivityAuditLogViewProps {
  controller: ActivityAuditLogController;
}

const renderIcon = (type: AuditLogEntry['type']) => {
  switch (type) {
    case 'CHECKIN':
      return <CheckCircle2 size={14} />;
    case 'EXTEND':
      return <Clock size={14} />;
    case 'SWAP':
      return <ArrowRightLeft size={14} />;
    case 'CANTEEN':
      return <UtensilsCrossed size={14} />;
    case 'SETTLE':
      return <Receipt size={14} />;
    case 'CANCEL':
      return <AlertTriangle size={14} />;
    default:
      return <ShieldCheck size={14} />;
  }
};

export const ActivityAuditLogView: React.FC<ActivityAuditLogViewProps> = ({ controller }) => {
  const {
    filterType,
    setFilterType,
    searchTerm,
    setSearchTerm,
    filteredLogs,
    handleExportLogs,
    getBadgeInfo,
  } = controller;

  return (
    <div className="audit-log-container">
      {/* Header Bar */}
      <div className="audit-log-header">
        <div className="audit-log-header-left">
          <div className="audit-log-icon-box">
            <History size={20} />
          </div>
          <div>
            <h3 className="audit-log-title">Operational Audit & History Trail</h3>
            <p className="audit-log-subtitle">
              Immutable record of all QR check-ins, extensions, table swaps, and canteen bills
            </p>
          </div>
        </div>

        <button className="btn btn-secondary" style={{ gap: '8px' }} onClick={handleExportLogs}>
          <Download size={15} />
          <span>Export Audit CSV</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="audit-log-search-row">
        <div className="audit-log-search-input-wrapper">
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
          <input
            type="text"
            placeholder="Search by action, customer, or table..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="audit-log-search-input"
          />
        </div>

        {/* Filter Chips */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { label: 'All Events', val: 'ALL' },
            { label: 'QR Check-in', val: 'CHECKIN' },
            { label: 'Extensions', val: 'EXTEND' },
            { label: 'Table Swaps', val: 'SWAP' },
            { label: 'Canteen Bills', val: 'CANTEEN' },
            { label: 'Settlements', val: 'SETTLE' },
          ].map((item) => (
            <button
              key={item.val}
              type="button"
              onClick={() => setFilterType(item.val)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: filterType === item.val ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                background: filterType === item.val ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                color: filterType === item.val ? '#a5b4fc' : 'var(--text-muted)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Log Feed Table */}
      <div className="glass-panel audit-log-table-wrapper">
        <table className="audit-log-table">
          <thead>
            <tr style={{ background: 'rgba(0, 0, 0, 0.4)', borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ padding: '12px 16px', color: 'var(--text-dim)', fontWeight: 600 }}>EVENT</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-dim)', fontWeight: 600 }}>DETAILS</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-dim)', fontWeight: 600 }}>OPERATOR</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-dim)', fontWeight: 600 }}>TIMESTAMP</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-dim)', fontWeight: 600 }}>LOG ID</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No audit logs matching search filter.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const info = getBadgeInfo(log.type);
                return (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background var(--transition-fast)',
                    }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div
                        className="audit-log-badge-pill"
                        style={{
                          background: info.bg,
                          color: info.color,
                        }}
                      >
                        {renderIcon(log.type)}
                        <span>{log.action}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-main)', maxWidth: '420px' }}>
                      {log.details}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={13} />
                        <span>{log.user}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                      {log.timestamp}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--accent-primary)', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {log.id}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
