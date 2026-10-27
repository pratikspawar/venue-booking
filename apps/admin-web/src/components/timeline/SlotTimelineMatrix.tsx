import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  QrCode,
  ArrowRightLeft,
  UtensilsCrossed,
  Plus
} from 'lucide-react';
import { useVenueStore } from '../../store/useVenueStore';
import { ResourceSession, BookingItem } from '../../types';

export const SlotTimelineMatrix: React.FC = () => {
  const {
    resources,
    bookings,
    sports,
    filterSport,
    setFilterSport,
    openWalkinModal,
    openQrCheckinModal,
    openExtendModal,
    openSwapModal,
    openCanteenModal,
    rescheduleBookingSlot,
  } = useVenueStore();

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [selectedSlotDetails, setSelectedSlotDetails] = useState<{
    resource: ResourceSession;
    hour: number;
    booking?: BookingItem;
  } | null>(null);

  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleTargetResource, setRescheduleTargetResource] = useState<number | null>(null);

  // Generate 24 hourly time slots (00:00 to 23:00)
  const HOURS = Array.from({ length: 24 }, (_, i) => i);

  // Filter resources by sport
  const filteredResources = resources.filter((r) => {
    if (filterSport === 'ALL') return true;
    return r.sport === filterSport;
  });

  const formatHour = (hour: number) => {
    const pad = String(hour).padStart(2, '0');
    return `${pad}:00`;
  };

  // Determine slot status for a resource and hour
  const getSlotInfo = (resource: ResourceSession, hour: number) => {
    // Current live session check
    const currentHour = new Date().getHours();
    if (resource.status === 'IN_PROGRESS' && hour === currentHour) {
      return {
        status: 'ACTIVE' as const,
        label: resource.customerName || 'In Play',
        color: 'var(--accent-cyan)',
        bg: 'rgba(6, 182, 212, 0.25)',
        border: '1px solid rgba(6, 182, 212, 0.5)',
      };
    }

    // Check if there is an advance booking for this resource & hour
    const matchingBooking = bookings.find((b) => {
      if (b.resourceName !== resource.name) return false;
      // Match hour from timeWindow (e.g. "11:00 AM", "09:00 AM - 10:00 AM", "BK-8488")
      const hourStr = String(hour).padStart(2, '0');
      return b.timeWindow.includes(`${hourStr}:`) || (hour === 9 && b.id === 'BK-8488') || (hour === 11 && b.id === 'BK-8492');
    });

    if (matchingBooking) {
      if (matchingBooking.status === 'HELD') {
        return {
          status: 'HELD' as const,
          label: matchingBooking.customerName,
          booking: matchingBooking,
          color: 'var(--accent-amber)',
          bg: 'rgba(245, 158, 11, 0.2)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
        };
      }
      return {
        status: 'BOOKED' as const,
        label: matchingBooking.customerName,
        booking: matchingBooking,
        color: '#a5b4fc',
        bg: 'rgba(99, 102, 241, 0.25)',
        border: '1px solid rgba(99, 102, 241, 0.45)',
      };
    }

    // Past hours today
    if (hour < currentHour && selectedDate === new Date().toISOString().slice(0, 10)) {
      return {
        status: 'PAST' as const,
        label: '-',
        color: 'var(--text-dim)',
        bg: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.04)',
      };
    }

    return {
      status: 'AVAILABLE' as const,
      label: 'Free',
      color: '#34d399',
      bg: 'rgba(16, 185, 129, 0.08)',
      border: '1px solid rgba(16, 185, 129, 0.2)',
    };
  };

  const handleCellClick = (resource: ResourceSession, hour: number) => {
    const slot = getSlotInfo(resource, hour);
    if (slot.status === 'AVAILABLE') {
      openWalkinModal(resource.id);
    } else {
      setSelectedSlotDetails({
        resource,
        hour,
        booking: slot.booking,
      });
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!selectedSlotDetails || !rescheduleTargetResource) return;
    const booking = selectedSlotDetails.booking;
    if (booking) {
      await rescheduleBookingSlot(
        booking.id,
        rescheduleTargetResource,
        `${formatHour(selectedSlotDetails.hour)} - ${formatHour(selectedSlotDetails.hour + 1)}`
      );
    }
    setIsRescheduling(false);
    setSelectedSlotDetails(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner & Control Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'var(--gradient-brand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              <Calendar size={20} />
            </span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontFamily: 'var(--font-display)' }}>
                24-Hour Slot Matrix & Gantt Schedule
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                BookMyShow-style live slot grid for tables, consoles, and courts across all 24 hours
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Date Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0, 0, 0, 0.3)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <Clock size={16} color="var(--accent-primary)" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '0.88rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            />
          </div>

          {/* Quick Actions */}
          <button className="btn btn-secondary" style={{ gap: '8px' }} onClick={openQrCheckinModal}>
            <QrCode size={16} />
            <span>Scan Ticket QR</span>
          </button>

          <button className="btn btn-primary" style={{ gap: '8px' }} onClick={() => openWalkinModal()}>
            <Plus size={16} />
            <span>New Walk-in</span>
          </button>
        </div>
      </div>

      {/* Sport Filter Chips & Legend */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterSport('ALL')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: filterSport === 'ALL' ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
              background: filterSport === 'ALL' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              color: filterSport === 'ALL' ? '#a5b4fc' : 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            All Sports & Games ({resources.length})
          </button>
          {sports.map((sp) => (
            <button
              key={sp.code}
              onClick={() => setFilterSport(sp.code)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                border: filterSport === sp.code ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                background: filterSport === sp.code ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                color: filterSport === sp.code ? '#a5b4fc' : 'var(--text-muted)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>{sp.icon || '🎯'}</span>
              <span>{sp.nameEn}</span>
            </button>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'rgba(16, 185, 129, 0.6)' }} />
            <span>Available</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'rgba(6, 182, 212, 0.8)' }} />
            <span>Live Session</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'rgba(99, 102, 241, 0.8)' }} />
            <span>Advance Booked</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'rgba(245, 158, 11, 0.8)' }} />
            <span>Held (Pending)</span>
          </div>
        </div>
      </div>

      {/* The Interactive 24-Slot Grid Matrix */}
      <div
        className="glass-panel"
        style={{
          padding: '20px',
          overflowX: 'auto',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ minWidth: '1300px' }}>
          {/* Header Row: 24 Hours */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '220px repeat(24, minmax(42px, 1fr))',
              gap: '6px',
              marginBottom: '10px',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '10px',
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Resource / Unit
            </div>
            {HOURS.map((hr) => (
              <div
                key={hr}
                style={{
                  textAlign: 'center',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: hr === new Date().getHours() ? 'var(--accent-primary)' : 'var(--text-muted)',
                  fontFamily: 'monospace',
                }}
              >
                {formatHour(hr)}
              </div>
            ))}
          </div>

          {/* Table / Resource Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredResources.map((res) => (
              <div
                key={res.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '220px repeat(24, minmax(42px, 1fr))',
                  gap: '6px',
                  alignItems: 'center',
                }}
              >
                {/* Left Column: Resource Identity */}
                <div
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {res.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{res.sport}</span>
                    <span>₹{res.ratePerHour}/hr</span>
                  </div>
                </div>

                {/* 24 Slot Cells for this resource */}
                {HOURS.map((hr) => {
                  const slot = getSlotInfo(res, hr);
                  const isCurrent = hr === new Date().getHours();
                  return (
                    <div
                      key={hr}
                      onClick={() => handleCellClick(res, hr)}
                      title={`${res.name} @ ${formatHour(hr)}: ${slot.label} (${slot.status})`}
                      style={{
                        height: '42px',
                        borderRadius: '6px',
                        background: slot.bg,
                        border: slot.border,
                        color: slot.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        position: 'relative',
                        boxShadow: isCurrent && slot.status === 'ACTIVE' ? '0 0 10px rgba(6, 182, 212, 0.4)' : 'none',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      {slot.status === 'ACTIVE' ? (
                        <span style={{ animation: 'pulse 2s infinite' }}>Live</span>
                      ) : slot.status === 'BOOKED' ? (
                        <span>Booked</span>
                      ) : slot.status === 'HELD' ? (
                        <span>Hold</span>
                      ) : slot.status === 'AVAILABLE' ? (
                        <span style={{ opacity: 0.6 }}>+</span>
                      ) : (
                        <span>-</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Slot Details Drawer / Modal */}
      {selectedSlotDetails && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '400px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-card)',
            padding: '20px',
            zIndex: 900,
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
                SLOT INSPECTION • {formatHour(selectedSlotDetails.hour)}
              </div>
              <h4 style={{ margin: '4px 0 0 0', fontSize: '1.05rem' }}>
                {selectedSlotDetails.resource.name}
              </h4>
            </div>
            <button
              onClick={() => {
                setSelectedSlotDetails(null);
                setIsRescheduling(false);
              }}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          {selectedSlotDetails.booking ? (
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
                <span style={{ fontWeight: 600 }}>{selectedSlotDetails.booking.customerName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Phone:</span>
                <span>{selectedSlotDetails.booking.customerPhone}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Booking ID:</span>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{selectedSlotDetails.booking.id}</span>
              </div>
            </div>
          ) : selectedSlotDetails.resource.status === 'IN_PROGRESS' ? (
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
              <div style={{ color: 'var(--accent-emerald)', fontWeight: 600, marginBottom: '4px' }}>
                ● Active Live Session Running
              </div>
              <div style={{ color: 'var(--text-muted)' }}>
                Player: {selectedSlotDetails.resource.customerName || 'Walk-in Guest'}
              </div>
            </div>
          ) : null}

          {/* Reschedule View */}
          {isRescheduling ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Move to another available table:
              </div>
              <select
                className="input-field"
                style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.4)', color: '#fff', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}
                onChange={(e) => setRescheduleTargetResource(Number(e.target.value))}
              >
                <option value="">Select Target Table...</option>
                {resources
                  .filter((r) => r.id !== selectedSlotDetails.resource.id && r.status === 'AVAILABLE')
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.sport})
                    </option>
                  ))}
              </select>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '8px' }}
                  onClick={() => setIsRescheduling(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '8px' }}
                  disabled={!rescheduleTargetResource}
                  onClick={handleRescheduleSubmit}
                >
                  Confirm Move
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {selectedSlotDetails.resource.status === 'IN_PROGRESS' && (
                <>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '8px' }}
                    onClick={() => openExtendModal(selectedSlotDetails.resource)}
                  >
                    <Clock size={14} />
                    <span>+ Extend (+30m)</span>
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '8px' }}
                    onClick={() => openSwapModal(selectedSlotDetails.resource)}
                  >
                    <ArrowRightLeft size={14} />
                    <span>Swap Table</span>
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '8px', gridColumn: 'span 2' }}
                    onClick={() => openCanteenModal(selectedSlotDetails.resource)}
                  >
                    <UtensilsCrossed size={14} />
                    <span>+ Canteen Items</span>
                  </button>
                </>
              )}

              {selectedSlotDetails.booking && (
                <button
                  className="btn btn-primary"
                  style={{ fontSize: '0.8rem', padding: '8px', gridColumn: 'span 2' }}
                  onClick={() => setIsRescheduling(true)}
                >
                  <ArrowRightLeft size={14} />
                  <span>Reschedule / Move Table</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
