import { useState, useEffect } from 'react';
import { useVenueStore } from '../../../store/useVenueStore';
import { AuditLogEntry } from '../../../types';

export interface BadgeStyleInfo {
  color: string;
  bg: string;
}

export interface ActivityAuditLogController {
  filterType: string;
  setFilterType: (type: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredLogs: AuditLogEntry[];
  handleExportLogs: () => void;
  getBadgeInfo: (type: AuditLogEntry['type']) => BadgeStyleInfo;
}

export const useActivityAuditLogController = (): ActivityAuditLogController => {
  const { auditLogs, fetchAuditLogs } = useVenueStore();
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const filteredLogs = auditLogs.filter((log) => {
    if (filterType !== 'ALL' && log.type !== filterType) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.user.toLowerCase().includes(q) ||
        log.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getBadgeInfo = (type: AuditLogEntry['type']): BadgeStyleInfo => {
    switch (type) {
      case 'CHECKIN':
        return { color: '#34d399', bg: 'rgba(16, 185, 129, 0.15)' };
      case 'EXTEND':
        return { color: '#818cf8', bg: 'rgba(99, 102, 241, 0.15)' };
      case 'SWAP':
        return { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' };
      case 'CANTEEN':
        return { color: '#f472b6', bg: 'rgba(244, 114, 182, 0.15)' };
      case 'SETTLE':
        return { color: '#facc15', bg: 'rgba(234, 179, 8, 0.15)' };
      case 'CANCEL':
        return { color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)' };
      default:
        return { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' };
    }
  };

  const handleExportLogs = () => {
    const headers = ['Log ID', 'Timestamp', 'Action', 'Details', 'Operator', 'Type'];
    const rows = filteredLogs.map((l) => [
      l.id,
      `"${l.timestamp}"`,
      `"${l.action}"`,
      `"${l.details}"`,
      `"${l.user}"`,
      l.type,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `venue-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    filterType,
    setFilterType,
    searchTerm,
    setSearchTerm,
    filteredLogs,
    handleExportLogs,
    getBadgeInfo,
  };
};
