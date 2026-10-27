import React, { useState, useEffect, useMemo } from 'react';
import {
  Gamepad2,
  Plus,
  Search,
  Filter,
  Layers,
  Wrench,
  AlertTriangle,
  Edit2,
  RefreshCw,
  Coins,
  Package,
  History,
} from 'lucide-react';
import { api } from '../../services/api';
import { EquipmentItemDto } from '../../types';
import { AddEquipmentModal } from './AddEquipmentModal';
import { StockLedgerModal } from '../desk/StockLedgerModal';

interface EquipmentInventoryProps {
  venueId: number;
}

export const EquipmentInventory: React.FC<EquipmentInventoryProps> = ({ venueId }) => {
  const [equipment, setEquipment] = useState<EquipmentItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [conditionFilter, setConditionFilter] = useState<string>('ALL');

  // Modals & Actions
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipmentItemDto | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [stockLedgerItem, setStockLedgerItem] = useState<EquipmentItemDto | null>(null);
  const [isStockLedgerOpen, setIsStockLedgerOpen] = useState(false);

  const fetchEquipment = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getVenueEquipment(venueId);
      setEquipment(data || []);
    } catch (err: any) {
      console.error('Failed to fetch equipment:', err);
      // Fallback initial sample gear if backend is empty
      if (equipment.length === 0) {
        setEquipment([
          {
            id: 101,
            name: 'PS5 DualSense Controller (Midnight Black)',
            category: 'EQUIPMENT_RENTAL',
            pricePaise: 5000,
            depositPaise: 20000,
            stockCount: 6,
            lowStockThreshold: 2,
            isEquipment: true,
            conditionStatus: 'EXCELLENT',
            serialNumber: 'PS5-CTRL-01',
            active: true,
          },
          {
            id: 102,
            name: 'PS5 DualSense Controller (Cosmic Red)',
            category: 'EQUIPMENT_RENTAL',
            pricePaise: 5000,
            depositPaise: 20000,
            stockCount: 4,
            lowStockThreshold: 2,
            isEquipment: true,
            conditionStatus: 'GOOD',
            serialNumber: 'PS5-CTRL-02',
            active: true,
          },
          {
            id: 103,
            name: 'Professional Snooker Cue (Ash Wood 57")',
            category: 'EQUIPMENT_RENTAL',
            pricePaise: 4000,
            depositPaise: 15000,
            stockCount: 8,
            lowStockThreshold: 2,
            isEquipment: true,
            conditionStatus: 'GOOD',
            serialNumber: 'CUE-ASH-01',
            active: true,
          },
          {
            id: 104,
            name: 'English Willow Cricket Bat (Grade 1)',
            category: 'EQUIPMENT_RENTAL',
            pricePaise: 10000,
            depositPaise: 50000,
            stockCount: 3,
            lowStockThreshold: 1,
            isEquipment: true,
            conditionStatus: 'FAIR',
            serialNumber: 'BAT-EW-03',
            active: true,
          },
          {
            id: 105,
            name: 'Meta Quest 3 VR Headset & Controllers',
            category: 'EQUIPMENT_RENTAL',
            pricePaise: 25000,
            depositPaise: 100000,
            stockCount: 2,
            lowStockThreshold: 1,
            isEquipment: true,
            conditionStatus: 'MAINTENANCE',
            serialNumber: 'VR-Q3-01',
            active: true,
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, [venueId]);

  const filteredItems = useMemo(() => {
    return equipment.filter((item) => {
      if (conditionFilter !== 'ALL' && item.conditionStatus !== conditionFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesSerial = item.serialNumber?.toLowerCase().includes(q) ?? false;
        if (!matchesName && !matchesSerial) return false;
      }
      return true;
    });
  }, [equipment, conditionFilter, searchQuery]);

  // Metric sums
  const totalAssetsCount = equipment.length;
  const totalUnitsInStock = equipment.reduce((acc, i) => acc + (i.stockCount || 0), 0);
  const maintenanceCount = equipment.filter(
    (i) => i.conditionStatus === 'MAINTENANCE' || i.conditionStatus === 'DAMAGED'
  ).length;
  const lowStockCount = equipment.filter(
    (i) => (i.stockCount || 0) <= (i.lowStockThreshold || 1)
  ).length;
  const totalDepositsHeldPaise = equipment.reduce(
    (acc, i) => acc + (i.depositPaise || 0) * (i.stockCount || 1),
    0
  );

  const handleQuickConditionChange = async (itemId: number, newCondition: string) => {
    setActionLoadingId(itemId);
    try {
      await api.updateEquipmentCondition(venueId, itemId, newCondition);
      await fetchEquipment();
    } catch (err: any) {
      alert(err.message || 'Failed to update equipment condition');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStockDelta = async (itemId: number, delta: number) => {
    setActionLoadingId(itemId);
    try {
      await api.adjustCanteenStock(itemId, delta);
      await fetchEquipment();
    } catch (err: any) {
      alert(err.message || 'Failed to adjust stock');
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderConditionPill = (item: EquipmentItemDto) => {
    const status = item.conditionStatus || 'GOOD';
    let bg = 'rgba(16, 185, 129, 0.15)';
    let color = '#34d399';
    let border = 'rgba(16, 185, 129, 0.3)';

    if (status === 'EXCELLENT') {
      bg = 'rgba(16, 185, 129, 0.2)';
      color = '#10b981';
      border = 'rgba(16, 185, 129, 0.4)';
    } else if (status === 'FAIR') {
      bg = 'rgba(245, 158, 11, 0.15)';
      color = '#fbbf24';
      border = 'rgba(245, 158, 11, 0.3)';
    } else if (status === 'MAINTENANCE') {
      bg = 'rgba(139, 92, 246, 0.15)';
      color = '#c4b5fd';
      border = 'rgba(139, 92, 246, 0.3)';
    } else if (status === 'DAMAGED') {
      bg = 'rgba(239, 68, 68, 0.15)';
      color = '#f87171';
      border = 'rgba(239, 68, 68, 0.3)';
    }

    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <select
          value={status}
          onChange={(e) => handleQuickConditionChange(item.id, e.target.value)}
          disabled={actionLoadingId === item.id}
          style={{
            backgroundColor: bg,
            color,
            border: `1px solid ${border}`,
            borderRadius: '9999px',
            padding: '0.25rem 0.65rem',
            fontSize: '0.74rem',
            fontWeight: 600,
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="EXCELLENT">● Mint / Excellent</option>
          <option value="GOOD">● Good Condition</option>
          <option value="FAIR">▲ Fair / Scuffed</option>
          <option value="MAINTENANCE">⚙ Maintenance</option>
          <option value="DAMAGED">✕ Damaged Gear</option>
        </select>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header & Actions */}
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
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
            Equipment & Sports Gear Inventory
          </h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
            Track controllers, pool cues, rackets, and VR gear with live condition logs and refundable security deposits
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={fetchEquipment}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 0.85rem',
              backgroundColor: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#cbd5e1',
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.15rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
            }}
          >
            <Plus size={16} />
            <span>Register Equipment</span>
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
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Low-Stock Alert Warning Banner */}
      {lowStockCount > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.8rem',
            padding: '0.85rem 1.2rem',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '12px',
            color: '#fca5a5',
            fontSize: '0.86rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertTriangle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
            <span>
              <strong>Low-Stock Warning:</strong> {lowStockCount} equipment gear asset{lowStockCount > 1 ? 's are' : ' is'} at or below reorder threshold. Replenish or adjust inventory.
            </span>
          </div>
          <span
            style={{
              padding: '3px 8px',
              backgroundColor: 'rgba(239, 68, 68, 0.25)',
              borderRadius: '6px',
              fontSize: '0.74rem',
              fontWeight: 700,
              color: '#f87171',
            }}
          >
            LOW INVENTORY
          </span>
        </div>
      )}

      {/* Metrics Banner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        <div
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '1rem 1.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.9rem',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Gamepad2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>
              Gear Assets
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f8fafc' }}>
              {totalAssetsCount}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '1rem 1.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.9rem',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Layers size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>
              Total Units in Stock
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f8fafc' }}>
              {totalUnitsInStock}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '1rem 1.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.9rem',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Wrench size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>
              Maintenance & Damaged
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f8fafc' }}>
              {maintenanceCount}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '1rem 1.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.9rem',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'rgba(139, 92, 246, 0.15)',
              color: '#a78bfa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Coins size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>
              Held Deposits Value
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f8fafc' }}>
              ₹{(totalDepositsHeldPaise / 100).toLocaleString('en-IN')}
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
          padding: '0.75rem 1rem',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#1e293b',
              padding: '0.45rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              width: '100%',
              maxWidth: '360px',
            }}
          >
            <Search size={15} style={{ color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search equipment or serial tag..."
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={15} style={{ color: '#64748b' }} />
          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            style={{
              backgroundColor: '#1e293b',
              color: '#cbd5e1',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '0.45rem 0.7rem',
              fontSize: '0.82rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Physical Conditions</option>
            <option value="EXCELLENT">Mint / Excellent</option>
            <option value="GOOD">Good Condition</option>
            <option value="FAIR">Fair (Scuffed)</option>
            <option value="MAINTENANCE">Maintenance Only</option>
            <option value="DAMAGED">Damaged Gear</option>
          </select>
        </div>
      </div>

      {/* Equipment Grid Cards */}
      {filteredItems.length === 0 ? (
        <div
          style={{
            backgroundColor: '#0f172a',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '3rem 1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Package size={36} style={{ color: '#64748b', marginBottom: '0.75rem' }} />
          <h3 style={{ margin: '0 0 0.3rem', fontSize: '1.05rem', color: '#f8fafc' }}>
            No equipment matches current filters
          </h3>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
            Clear search or click Register Equipment to add game controllers, pool cues, and gear.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: '1rem',
          }}
        >
          {filteredItems.map((item) => {
            const rentalInr = Math.round((item.pricePaise || 0) / 100);
            const depositInr = Math.round((item.depositPaise || 0) / 100);
            const isLowStock = (item.stockCount || 0) <= (item.lowStockThreshold || 1);

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                {/* Top Row: Icon + Name + Serial */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      color: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Gamepad2 size={20} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: '0.92rem',
                          fontWeight: 600,
                          color: '#f8fafc',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.name}
                      </h4>
                      <button
                        title="Edit Equipment"
                        onClick={() => {
                          setEditingItem(item);
                          setIsModalOpen(true);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          padding: '0.2rem',
                          borderRadius: '4px',
                        }}
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>

                    {item.serialNumber && (
                      <span
                        style={{
                          display: 'inline-block',
                          fontSize: '0.72rem',
                          color: '#94a3b8',
                          fontFamily: 'monospace',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          marginTop: '3px',
                        }}
                      >
                        {item.serialNumber}
                      </span>
                    )}
                  </div>
                </div>

                {/* Condition Selector & Pricing */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  {renderConditionPill(item)}

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
                      ₹{rentalInr}{' '}
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 400 }}>/ rent</span>
                    </div>
                    {depositInr > 0 && (
                      <div style={{ fontSize: '0.72rem', color: '#a78bfa' }}>
                        +₹{depositInr} deposit
                      </div>
                    )}
                  </div>
                </div>

                {/* Stock Level Counter */}
                <div
                  style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    padding: '0.5rem 0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>In Inventory:</span>
                    <span
                      style={{
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: isLowStock ? '#fbbf24' : '#f8fafc',
                      }}
                    >
                      {item.stockCount} units
                    </span>
                    {isLowStock && (
                      <span title="Low stock alert" style={{ display: 'flex', alignItems: 'center' }}>
                        <AlertTriangle size={13} style={{ color: '#fbbf24' }} />
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <button
                      title="Decrement Unit (1)"
                      onClick={() => handleStockDelta(item.id, -1)}
                      disabled={item.stockCount <= 0 || actionLoadingId === item.id}
                      style={{
                        width: '24px',
                        height: '24px',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#cbd5e1',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      -
                    </button>
                    <button
                      title="Increment Unit (1)"
                      onClick={() => handleStockDelta(item.id, 1)}
                      disabled={actionLoadingId === item.id}
                      style={{
                        width: '24px',
                        height: '24px',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#cbd5e1',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      +
                    </button>

                    <button
                      title="View Stock Movement Ledger & Adjust"
                      onClick={() => {
                        setStockLedgerItem(item);
                        setIsStockLedgerOpen(true);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        backgroundColor: 'rgba(99, 102, 241, 0.15)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '6px',
                        color: '#818cf8',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginLeft: '4px',
                      }}
                    >
                      <History size={12} />
                      <span>Ledger</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <AddEquipmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchEquipment()}
        venueId={venueId}
        editingItem={editingItem}
      />

      {/* Stock Movement Ledger Modal */}
      <StockLedgerModal
        isOpen={isStockLedgerOpen}
        onClose={() => {
          setIsStockLedgerOpen(false);
          setStockLedgerItem(null);
        }}
        venueId={venueId}
        item={stockLedgerItem}
        onStockUpdated={() => fetchEquipment()}
      />
    </div>
  );
};
