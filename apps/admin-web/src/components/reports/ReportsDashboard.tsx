import React, { useEffect, useMemo, useState } from 'react';
import { Download, TrendingUp, Users, Percent, CreditCard, Coins } from 'lucide-react';
import { api } from '../../services/api';
import { useVenueStore } from '../../store/useVenueStore';
import { PeakHourHeatmapMatrix } from './PeakHourHeatmapMatrix';

type Report = {
  summary: {
    totalGrossRevenuePaise: number;
    gameTimeRevenuePaise: number;
    canteenRevenuePaise: number;
    totalBookingsCount: number;
    completedCount: number;
    activeCount: number;
    cancelledCount: number;
    noShowCount: number;
    overallUtilizationPercent: number;
    averageSessionMinutes: number;
    cashCollectionPaise: number;
    upiCollectionPaise: number;
    onlineCollectionPaise: number;
  };
  sportBreakdown: Array<{ sportName: string; revenuePaise: number; bookingCount: number; percentage: number }>;
  peakHours: Array<{ hourLabel: string; bookingCount: number; peakLevel: string }>;
  resourceUtilization: Array<{ resourceName: string; totalBookedMinutes: number; utilizationPercent: number }>;
  periodStart: string;
  periodEnd: string;
};

const formatRupees = (paise = 0) => `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

function rangeBounds(range: 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH') {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  if (range === 'YESTERDAY') {
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() - 1);
  } else if (range === 'WEEK') {
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else if (range === 'MONTH') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setHours(0, 0, 0, 0);
  }
  return { start: start.toISOString(), end: end.toISOString() };
}

export const ReportsDashboard: React.FC = () => {
  const { reportDateRange, setReportDateRange, tenant, setActiveTab } = useVenueStore();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bounds = useMemo(() => rangeBounds(reportDateRange), [reportDateRange]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api.getComprehensiveReport(undefined, bounds.start, bounds.end)
      .then((data) => {
        if (active) setReport(data as Report | null);
        if (active && !data) setError('The report service returned no data.');
      })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : 'Could not load report data.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [bounds.end, bounds.start]);

  const summary = report?.summary;
  const kpis = [
    { label: 'Gross Revenue', value: formatRupees(summary?.totalGrossRevenuePaise), detail: `Game time ${formatRupees(summary?.gameTimeRevenuePaise)} · Canteen ${formatRupees(summary?.canteenRevenuePaise)}`, icon: TrendingUp },
    { label: 'Bookings', value: summary?.totalBookingsCount ?? '—', detail: `${summary?.completedCount ?? 0} completed · ${summary?.activeCount ?? 0} active · ${summary?.noShowCount ?? 0} no-shows`, icon: Users },
    { label: 'Utilization', value: summary ? `${summary.overallUtilizationPercent}%` : '—', detail: summary ? `Average session ${summary.averageSessionMinutes} min` : 'No utilization data', icon: Percent },
    { label: 'Collections', value: formatRupees((summary?.cashCollectionPaise ?? 0) + (summary?.upiCollectionPaise ?? 0) + (summary?.onlineCollectionPaise ?? 0)), detail: `Cash ${formatRupees(summary?.cashCollectionPaise)} · UPI ${formatRupees(summary?.upiCollectionPaise)} · Online ${formatRupees(summary?.onlineCollectionPaise)}`, icon: CreditCard },
  ];

  return <section style={{ maxWidth: 1400, margin: '0 auto' }}>
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
      <div>
        <h2 style={{ margin: '0 0 6px', fontSize: '1.6rem' }}>Operations & Utilization Reports</h2>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{tenant.name} · Peak hours and resource occupancy analytics</span>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          className="btn btn-primary"
          onClick={() => setActiveTab('earnings')}
          style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none' }}
        >
          <Coins size={16} /> Detailed Earnings Dashboard
        </button>
        <select aria-label="Report date range" value={reportDateRange} onChange={(event) => setReportDateRange(event.target.value as typeof reportDateRange)}>
          <option value="TODAY">Today</option><option value="YESTERDAY">Yesterday</option><option value="WEEK">Last 7 days</option><option value="MONTH">Month to date</option>
        </select>
        <button className="btn btn-secondary" onClick={() => api.downloadReportCsv(undefined, bounds.start, bounds.end)} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Download size={16} /> Export CSV
        </button>
      </div>
    </header>


    {error && <p role="alert" style={{ color: '#f87171' }}>{error}</p>}
    {loading && <p style={{ color: 'var(--text-muted)' }}>Loading report…</p>}
    {!loading && !error && summary && <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        {kpis.map(({ label, value, detail, icon: Icon }) => <article className="glass-panel" key={label} style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}><span>{label}</span><Icon size={18} /></div>
          <strong style={{ display: 'block', fontSize: '1.8rem', marginTop: 10 }}>{value}</strong>
          <small style={{ color: 'var(--text-muted)' }}>{detail}</small>
        </article>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
        <article className="glass-panel" style={{ padding: 22 }}>
          <h3>Revenue by sport</h3>
          {report.sportBreakdown.length === 0 ? <p>No bookings in this period.</p> : report.sportBreakdown.map((row) => <div key={row.sportName} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}><span>{row.sportName} · {row.bookingCount} bookings</span><strong>{formatRupees(row.revenuePaise)}</strong></div>)}
        </article>
        <article className="glass-panel" style={{ padding: 22 }}>
          <h3>Resource utilization</h3>
          {report.resourceUtilization.length === 0 ? <p>No resource activity in this period.</p> : report.resourceUtilization.map((row) => <div key={row.resourceName} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}><span>{row.resourceName} · {row.totalBookedMinutes} min</span><strong>{row.utilizationPercent}%</strong></div>)}
        </article>
        <article className="glass-panel" style={{ padding: 22 }}>
          <h3>Peak booking hours</h3>
          {report.peakHours.filter((row) => row.bookingCount > 0).map((row) => <div key={row.hourLabel} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}><span>{row.hourLabel}</span><strong>{row.bookingCount} · {row.peakLevel}</strong></div>)}
        </article>
      </div>

      {/* 2D Interactive Peak-Hour Heatmap Matrix (Task 2.5) */}
      <PeakHourHeatmapMatrix />
    </>}
  </section>;
};
