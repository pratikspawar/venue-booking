import React, { useState } from 'react';
import { useVenueStore } from '../../store/useVenueStore';
import { CanteenItem } from '../../types';
import { X, Search, ShoppingBag, Plus, Minus, Check, AlertTriangle } from 'lucide-react';

export const AddCanteenItemModal: React.FC = () => {
  const {
    isCanteenModalOpen,
    closeCanteenModal,
    sessionForCanteen,
    canteenCatalog,
    addItemToSession,
  } = useVenueStore();

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<CanteenItem | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  if (!isCanteenModalOpen || !sessionForCanteen) return null;

  const filteredItems = canteenCatalog.filter((item) => {
    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleSelectItem = (item: CanteenItem) => {
    setSelectedItem(item);
    setQuantity(1);
  };

  const handleConfirm = () => {
    if (!selectedItem) return;
    addItemToSession(sessionForCanteen, selectedItem, quantity);
    setSelectedItem(null);
    setQuantity(1);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 22, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '680px',
          background: 'linear-gradient(135deg, rgba(22, 27, 46, 0.98), rgba(15, 18, 30, 0.99))',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(99, 102, 241, 0.15)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
              }}
            >
              <ShoppingBag size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>Add Canteen & Equipment</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Session: <strong style={{ color: '#fff' }}>{sessionForCanteen.name}</strong> • {sessionForCanteen.customerName || 'Walk-in'}
              </p>
            </div>
          </div>
          <button
            onClick={closeCanteenModal}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter Tabs & Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'All Items' },
              { id: 'EQUIPMENT_RENTAL', label: '🎮 Gear Rental' },
              { id: 'BEVERAGE', label: '🥤 Drinks' },
              { id: 'FOOD', label: '🍿 Snacks' },
              { id: 'ACCESSORY', label: '🎯 Accessories' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  border: categoryFilter === cat.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  background: categoryFilter === cat.id ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  color: categoryFilter === cat.id ? '#818cf8' : 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '6px 10px 6px 30px',
                color: '#fff',
                fontSize: '0.8rem',
              }}
            />
          </div>
        </div>

        {/* Item Selection Grid */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '10px',
            marginBottom: '16px',
            maxHeight: '340px',
            paddingRight: '4px',
          }}
        >
          {filteredItems.map((item) => {
            const isSelected = selectedItem?.id === item.id;
            const isLow = item.stockCount <= item.lowStockThreshold;
            const isOutOfStock = item.stockCount <= 0;

            return (
              <div
                key={item.id}
                onClick={() => !isOutOfStock && handleSelectItem(item)}
                style={{
                  background: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '12px',
                  cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                  opacity: isOutOfStock ? 0.45 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1.4rem' }}>{item.icon || '📦'}</span>
                    {isLow && !isOutOfStock && (
                      <span style={{ fontSize: '0.68rem', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.15)', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <AlertTriangle size={10} /> Low
                      </span>
                    )}
                    {isOutOfStock && (
                      <span style={{ fontSize: '0.68rem', color: '#ef4444', background: 'rgba(239, 68, 68, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                        Out of stock
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff', marginTop: '6px' }}>{item.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'capitalize' }}>
                      {item.category.toLowerCase().replace('_', ' ')}
                    </span>
                    {item.isEquipment && item.conditionStatus && (
                      <span
                        style={{
                          fontSize: '0.66rem',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          backgroundColor:
                            item.conditionStatus === 'EXCELLENT'
                              ? 'rgba(16, 185, 129, 0.2)'
                              : item.conditionStatus === 'GOOD'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(245, 158, 11, 0.15)',
                          color:
                            item.conditionStatus === 'EXCELLENT' || item.conditionStatus === 'GOOD'
                              ? '#34d399'
                              : '#fbbf24',
                          fontWeight: 600,
                        }}
                      >
                        {item.conditionStatus}
                      </span>
                    )}
                  </div>
                  {item.isEquipment && item.depositPaise && item.depositPaise > 0 && (
                    <div style={{ fontSize: '0.7rem', color: '#a78bfa', marginTop: '3px' }}>
                      +₹{Math.round(item.depositPaise / 100)} Deposit
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--accent-emerald)', fontSize: '0.95rem' }}>
                    ₹{item.pricePaise / 100}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Stock: {item.stockCount}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Item Quantity & Bill Subtotal Preview */}
        {selectedItem && (
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '10px',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                {selectedItem.icon} {selectedItem.name}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                ₹{selectedItem.pricePaise / 100} each • Remaining stock: {selectedItem.stockCount}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', padding: '4px 8px' }}>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '2px' }}
                >
                  <Minus size={14} />
                </button>
                <span style={{ fontWeight: 700, color: '#fff', minWidth: '18px', textAlign: 'center' }}>{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(selectedItem.stockCount, quantity + 1))}
                  style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '2px' }}
                >
                  <Plus size={14} />
                </button>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Item Total</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#10b981' }}>
                  ₹{(selectedItem.pricePaise * quantity) / 100}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={closeCanteenModal}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.88rem',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedItem}
            style={{
              padding: '10px 22px',
              borderRadius: '8px',
              background: selectedItem ? 'var(--gradient-brand)' : 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: selectedItem ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: selectedItem ? 'var(--shadow-glow)' : 'none',
            }}
          >
            <Check size={16} />
            Add to Session Bill
          </button>
        </div>
      </div>
    </div>
  );
};
