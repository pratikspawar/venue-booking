import React, { useState, useEffect } from 'react';
import { 
  Gamepad2, 
  Calendar, 
  Clock, 
  Play, 
  Square, 
  Plus, 
  TrendingUp, 
  Timer,
  Search
} from 'lucide-react';

interface ResourceSession {
  id: number;
  name: string;
  sport: 'PLAYSTATION' | 'POOL' | 'TURF';
  billingMode: 'TIME_PLAYED' | 'FIXED_SLOT';
  status: 'IN_PROGRESS' | 'AVAILABLE' | 'HELD' | 'MAINTENANCE';
  ratePerHour: number;
  ratePerSlot?: number;
  customerName?: string;
  customerPhone?: string;
  startedAt?: Date;
  scheduledSlot?: string;
}

const INITIAL_RESOURCES: ResourceSession[] = [
  {
    id: 1,
    name: 'PlayStation 5 Console #1 (4K OLED)',
    sport: 'PLAYSTATION',
    billingMode: 'TIME_PLAYED',
    status: 'IN_PROGRESS',
    ratePerHour: 250,
    customerName: 'Aditya Verma',
    customerPhone: '+91 98201 12345',
    startedAt: new Date(Date.now() - 48 * 60 * 1000) // 48 mins ago
  },
  {
    id: 2,
    name: 'PlayStation 5 Console #2',
    sport: 'PLAYSTATION',
    billingMode: 'TIME_PLAYED',
    status: 'AVAILABLE',
    ratePerHour: 250
  },
  {
    id: 3,
    name: 'Tournament Pool Table A (8-Ball)',
    sport: 'POOL',
    billingMode: 'TIME_PLAYED',
    status: 'IN_PROGRESS',
    ratePerHour: 300,
    customerName: 'Karan Mehra',
    customerPhone: '+91 98199 67890',
    startedAt: new Date(Date.now() - 85 * 60 * 1000) // 85 mins ago
  },
  {
    id: 4,
    name: 'Standard Pool Table B',
    sport: 'POOL',
    billingMode: 'FIXED_SLOT',
    status: 'HELD',
    ratePerHour: 240,
    ratePerSlot: 150,
    customerName: 'Online App Hold (Pay Pending)',
    scheduledSlot: '12:00 PM - 01:00 PM'
  },
  {
    id: 5,
    name: 'Indoor Turf Ground (5-A-Side)',
    sport: 'TURF',
    billingMode: 'FIXED_SLOT',
    status: 'AVAILABLE',
    ratePerHour: 1200,
    ratePerSlot: 1200
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'desk' | 'resources' | 'bookings' | 'reports'>('desk');
  const [resources, setResources] = useState<ResourceSession[]>(INITIAL_RESOURCES);
  const [now, setNow] = useState(new Date());
  const [isWalkinModalOpen, setIsWalkinModalOpen] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState<number>(2);
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');

  // Live timer tick every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const calculateElapsedMinutes = (startedAt?: Date) => {
    if (!startedAt) return 0;
    return Math.max(0, Math.floor((now.getTime() - startedAt.getTime()) / 60000));
  };

  const calculateCurrentBill = (session: ResourceSession) => {
    if (session.status !== 'IN_PROGRESS' || !session.startedAt) return 0;
    const mins = calculateElapsedMinutes(session.startedAt);
    // 5 min rounding per technical design spec
    const roundedMins = Math.ceil(mins / 5) * 5;
    return Math.round((roundedMins / 60) * session.ratePerHour);
  };

  const handleStartSession = (id: number) => {
    setResources(prev =>
      prev.map(r =>
        r.id === id
          ? {
              ...r,
              status: 'IN_PROGRESS',
              startedAt: new Date(),
              customerName: r.customerName || 'Walk-in Guest'
            }
          : r
      )
    );
  };

  const handleStopSession = (id: number) => {
    const target = resources.find(r => r.id === id);
    if (!target) return;
    const bill = calculateCurrentBill(target);
    alert(`Session ended for ${target.name}!\nBilled Amount: ₹${bill}\nStatus: Ready for Payment Collection`);
    setResources(prev =>
      prev.map(r =>
        r.id === id
          ? {
              ...r,
              status: 'AVAILABLE',
              startedAt: undefined,
              customerName: undefined,
              customerPhone: undefined
            }
          : r
      )
    );
  };

  const handleCreateWalkin = (e: React.FormEvent) => {
    e.preventDefault();
    setResources(prev =>
      prev.map(r =>
        r.id === selectedResourceId
          ? {
              ...r,
              status: 'IN_PROGRESS',
              startedAt: new Date(),
              customerName: walkinName || 'Walk-in Guest',
              customerPhone: walkinPhone || 'Counter Walk-in'
            }
          : r
      )
    );
    setWalkinName('');
    setWalkinPhone('');
    setIsWalkinModalOpen(false);
  };

  const activeSessionsCount = resources.filter(r => r.status === 'IN_PROGRESS').length;
  const currentTotalRevenue = resources.reduce((acc, r) => acc + calculateCurrentBill(r), 18450);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar Navigation */}
      <aside style={{
        width: '260px',
        background: 'rgba(15, 23, 42, 0.95)',
        borderRight: '1px solid var(--border-subtle)',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        height: '100vh'
      }}>
        <div>
          {/* Logo & Branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', paddingLeft: '8px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'var(--gradient-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)'
            }}>
              <Gamepad2 size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
                Venue<span style={{ color: 'var(--accent-primary)' }}>Ops</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Multi-Tenant Desk
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              onClick={() => setActiveTab('desk')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: activeTab === 'desk' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: activeTab === 'desk' ? '#818cf8' : 'var(--text-muted)',
                border: activeTab === 'desk' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                textAlign: 'left',
                transition: 'all var(--transition-fast)'
              }}
            >
              <Timer size={18} />
              <span>Live Desk & Timers</span>
              {activeSessionsCount > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  background: 'var(--accent-primary)',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '1px 7px',
                  fontSize: '0.72rem'
                }}>
                  {activeSessionsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('resources')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: activeTab === 'resources' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: activeTab === 'resources' ? '#818cf8' : 'var(--text-muted)',
                border: activeTab === 'resources' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                textAlign: 'left'
              }}
            >
              <Gamepad2 size={18} />
              <span>Venues & Resources</span>
            </button>

            <button
              onClick={() => setActiveTab('bookings')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: activeTab === 'bookings' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: activeTab === 'bookings' ? '#818cf8' : 'var(--text-muted)',
                border: activeTab === 'bookings' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                textAlign: 'left'
              }}
            >
              <Calendar size={18} />
              <span>Bookings Ledger</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: activeTab === 'reports' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: activeTab === 'reports' ? '#818cf8' : 'var(--text-muted)',
                border: activeTab === 'reports' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                textAlign: 'left'
              }}
            >
              <TrendingUp size={18} />
              <span>Revenue Reports</span>
            </button>
          </nav>
        </div>

        {/* Current Tenant & Staff Badge */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--accent-emerald)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-emerald)' }}></span>
            <span>MySQL & Flyway V1 Active</span>
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
            Apex Gaming & Snooker
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Staff: Rahul S. (Desk Lead)
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
        {/* Top Header Bar */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Desk Operations & Sessions</h1>
              <span className="badge-live">Live Sync</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
              Real-time slot engine, time-played session billing, and walk-in dispatch.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Shift Cash Balance Box */}
            <div className="glass-panel" style={{ padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Shift Collection
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                  ₹{currentTotalRevenue.toLocaleString('en-IN')}
                </div>
              </div>
              <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '14px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Cash: ₹5,800<br/>UPI: ₹12,650
              </div>
            </div>

            <button 
              className="btn btn-primary"
              onClick={() => setIsWalkinModalOpen(true)}
            >
              <Plus size={18} />
              <span>New Walk-in</span>
            </button>
          </div>
        </header>

        {/* Tab 1: Live Desk & Timers */}
        {activeTab === 'desk' && (
          <div>
            {/* Resource Session Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
              {resources.map(session => {
                const elapsedMins = calculateElapsedMinutes(session.startedAt);
                const currentBill = calculateCurrentBill(session);
                const hours = Math.floor(elapsedMins / 60);
                const mins = elapsedMins % 60;

                return (
                  <div 
                    key={session.id} 
                    className="glass-panel"
                    style={{
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderLeft: session.status === 'IN_PROGRESS' 
                        ? '4px solid var(--accent-emerald)' 
                        : session.status === 'HELD' 
                        ? '4px solid var(--accent-amber)'
                        : '4px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <div>
                      {/* Card Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div>
                          <div style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            color: session.sport === 'PLAYSTATION' ? 'var(--accent-primary)' : session.sport === 'POOL' ? 'var(--accent-cyan)' : 'var(--accent-emerald)',
                            marginBottom: '4px'
                          }}>
                            {session.sport} • {session.billingMode.replace('_', ' ')}
                          </div>
                          <h3 style={{ fontSize: '1.15rem' }}>{session.name}</h3>
                        </div>

                        {session.status === 'IN_PROGRESS' ? (
                          <span className="badge-live">Active</span>
                        ) : session.status === 'HELD' ? (
                          <span style={{
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: 'var(--accent-amber)',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            border: '1px solid rgba(245, 158, 11, 0.3)'
                          }}>
                            Held (8m)
                          </span>
                        ) : (
                          <span style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: 'var(--text-muted)',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            border: '1px solid var(--border-subtle)'
                          }}>
                            Available
                          </span>
                        )}
                      </div>

                      {/* Customer / Session Details */}
                      {session.status === 'IN_PROGRESS' ? (
                        <div style={{
                          background: 'rgba(0, 0, 0, 0.3)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '16px',
                          marginBottom: '20px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Player</span>
                            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{session.customerName}</span>
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Elapsed Time</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '1.25rem' }}>
                              <Clock size={16} />
                              <span>{String(hours).padStart(2, '0')}:{String(mins).padStart(2, '0')}</span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Current Charge (₹{session.ratePerHour}/hr)</span>
                            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                              ₹{currentBill}
                            </span>
                          </div>
                        </div>
                      ) : session.status === 'HELD' ? (
                        <div style={{
                          background: 'rgba(245, 158, 11, 0.08)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '16px',
                          marginBottom: '20px',
                          border: '1px dashed rgba(245, 158, 11, 0.3)'
                        }}>
                          <div style={{ color: 'var(--accent-amber)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                            Online Payment in Progress
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            Slot: {session.scheduledSlot}
                          </div>
                          <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '6px' }}>
                            Auto-release if Razorpay webhook not received within hold limit.
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          background: 'rgba(255, 255, 255, 0.02)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '24px 16px',
                          marginBottom: '20px',
                          textAlign: 'center',
                          border: '1px dashed var(--border-subtle)'
                        }}>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            Table / Console is Ready
                          </div>
                          <div style={{ color: 'var(--accent-primary)', fontSize: '0.82rem', fontWeight: 600, marginTop: '4px' }}>
                            Rate: ₹{session.ratePerHour}/hour (Min 30 mins)
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div>
                      {session.status === 'IN_PROGRESS' ? (
                        <button
                          className="btn btn-danger"
                          style={{ width: '100%', gap: '8px' }}
                          onClick={() => handleStopSession(session.id)}
                        >
                          <Square size={16} />
                          <span>Stop & Collect (₹{currentBill})</span>
                        </button>
                      ) : session.status === 'AVAILABLE' ? (
                        <button
                          className="btn btn-secondary"
                          style={{ width: '100%', gap: '8px' }}
                          onClick={() => handleStartSession(session.id)}
                        >
                          <Play size={16} />
                          <span>Quick Start Session</span>
                        </button>
                      ) : (
                        <button
                          className="btn btn-secondary"
                          style={{ width: '100%', opacity: 0.6, cursor: 'not-allowed' }}
                          disabled
                        >
                          <span>Awaiting Payment</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Venues & Resources */}
        {activeTab === 'resources' && (
          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2>Venue Resource Catalog</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  Manage tables, consoles, turf pitches and configure slot lengths and billing modes.
                </p>
              </div>
              <button className="btn btn-primary">
                <Plus size={16} />
                <span>Add Resource</span>
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Resource Name</th>
                  <th style={{ padding: '12px 16px' }}>Sport / Category</th>
                  <th style={{ padding: '12px 16px' }}>Billing Mode</th>
                  <th style={{ padding: '12px 16px' }}>Base Rate</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {resources.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600 }}>{r.name}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.06)'
                      }}>
                        {r.sport}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{r.billingMode}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 600 }}>₹{r.ratePerHour}/hr</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ color: r.status === 'MAINTENANCE' ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                        ● {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Bookings Ledger */}
        {activeTab === 'bookings' && (
          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2>Today's Bookings Ledger</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  Unified records of mobile app bookings, walk-ins, and counter payments.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input 
                    type="text" 
                    placeholder="Search phone or name..."
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px 8px 36px',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Booking ID</th>
                  <th style={{ padding: '12px 16px' }}>Customer</th>
                  <th style={{ padding: '12px 16px' }}>Resource</th>
                  <th style={{ padding: '12px 16px' }}>Time Window</th>
                  <th style={{ padding: '12px 16px' }}>Amount</th>
                  <th style={{ padding: '12px 16px' }}>Payment Mode</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '14px 16px', fontFamily: 'monospace' }}>#BK-8492</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600 }}>Aditya Verma</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>+91 98201 12345</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>PlayStation 5 #1</td>
                  <td style={{ padding: '14px 16px' }}>11:00 AM - Live</td>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>₹250</td>
                  <td style={{ padding: '14px 16px' }}><span style={{ color: 'var(--accent-cyan)' }}>COUNTER UPI</span></td>
                  <td style={{ padding: '14px 16px' }}><span style={{ color: 'var(--accent-emerald)' }}>IN PROGRESS</span></td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '14px 16px', fontFamily: 'monospace' }}>#BK-8488</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600 }}>Rohan Joshi</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>+91 98765 43210</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>Turf Ground (5-A-Side)</td>
                  <td style={{ padding: '14px 16px' }}>09:00 AM - 10:00 AM</td>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>₹1,200</td>
                  <td style={{ padding: '14px 16px' }}><span style={{ color: 'var(--accent-primary)' }}>RAZORPAY ONLINE</span></td>
                  <td style={{ padding: '14px 16px' }}><span style={{ color: 'var(--text-muted)' }}>COMPLETED</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Revenue & Reports */}
        {activeTab === 'reports' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '28px' }}>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Total Day Revenue</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px', color: 'var(--accent-emerald)' }}>₹18,450</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '4px' }}>↑ 22% vs yesterday</div>
              </div>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Bookings Completed</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px' }}>24 Slots</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>0 No-shows</div>
              </div>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Resource Utilization</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px', color: 'var(--accent-cyan)' }}>76.4%</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>Peak hours: 5 PM - 10 PM</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '28px' }}>
              <h3 style={{ marginBottom: '14px' }}>Revenue Breakdown by Sport</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
                Directly calculated from booking_slots, payments, and play_sessions database records.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <span>PlayStation 5 Lounges</span>
                    <span style={{ fontWeight: 600 }}>₹7,800 (42%)</span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '42%', height: '100%', background: 'var(--accent-primary)' }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <span>Pool & Snooker Tables</span>
                    <span style={{ fontWeight: 600 }}>₹5,850 (32%)</span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '32%', height: '100%', background: 'var(--accent-cyan)' }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <span>Box Turf Grounds</span>
                    <span style={{ fontWeight: 600 }}>₹4,800 (26%)</span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '26%', height: '100%', background: 'var(--accent-emerald)' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Walk-in Booking Modal */}
        {isWalkinModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100
          }}>
            <div className="glass-panel" style={{ width: '440px', padding: '32px' }}>
              <h2 style={{ fontSize: '1.35rem', marginBottom: '8px' }}>Create Walk-in Session</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
                Instant table / console assignment. Starts live billing immediately.
              </p>

              <form onSubmit={handleCreateWalkin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
                    Select Resource
                  </label>
                  <select
                    value={selectedResourceId}
                    onChange={e => setSelectedResourceId(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#fff',
                      fontSize: '0.9rem'
                    }}
                  >
                    {resources.filter(r => r.status === 'AVAILABLE').map(r => (
                      <option key={r.id} value={r.id} style={{ background: '#0f172a' }}>
                        {r.name} (₹{r.ratePerHour}/hr)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
                    Customer Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Vicky R."
                    value={walkinName}
                    onChange={e => setWalkinName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#fff',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
                    Mobile Number (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98..."
                    value={walkinPhone}
                    onChange={e => setWalkinPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#fff',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ flex: 1 }}
                    onClick={() => setIsWalkinModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ flex: 1 }}
                  >
                    Start Session
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
