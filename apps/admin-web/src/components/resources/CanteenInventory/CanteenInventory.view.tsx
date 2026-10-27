import React from 'react';
import {
  Plus,
  Search,
  AlertTriangle,
  Package,
  Coins,
  X,
  UtensilsCrossed,
} from 'lucide-react';
import { CanteenInventoryController } from './CanteenInventory.controller';
import './CanteenInventory.css';

export interface CanteenInventoryViewProps {
  controller: CanteenInventoryController;
}

export const CanteenInventoryView: React.FC<CanteenInventoryViewProps> = ({ controller }) => {
  const {
    filteredItems,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    isAddModalOpen,
    openAddModal,
    closeAddModal,
    newItemName,
    setNewItemName,
    newItemCategory,
    setNewItemCategory,
    newItemPriceRupees,
    setNewItemPriceRupees,
    newItemStock,
    setNewItemStock,
    newItemThreshold,
    setNewItemThreshold,
    newItemIcon,
    setNewItemIcon,
    handleSaveNewItem,
    handleAdjustStock,
    totalItemsCount,
    lowStockCount,
    totalRetailPaise,
  } = controller;

  const categories = [
    { code: 'ALL', label: 'All Items' },
    { code: 'BEVERAGE', label: '🥤 Beverages' },
    { code: 'FOOD', label: '🍕 Food & Meals' },
    { code: 'SNACK', label: '🍿 Snacks' },
    { code: 'EQUIPMENT_RENTAL', label: '🎮 Gear Rental' },
    { code: 'ACCESSORY', label: '🎯 Accessories' },
  ];

  return (
    <div className="canteen-inventory-container">
      {/* Top Stats Banner */}
      <div className="canteen-stats-grid">
        <div className="canteen-stat-card">
          <div className="canteen-stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <Package size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Active Menu Items
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
              {totalItemsCount} Products
            </div>
          </div>
        </div>

        <div className="canteen-stat-card">
          <div
            className="canteen-stat-icon"
            style={{
              background: lowStockCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: lowStockCount > 0 ? '#f87171' : '#34d399',
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Low Stock Alerts
            </div>
            <div
              style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                color: lowStockCount > 0 ? '#f87171' : '#34d399',
              }}
            >
              {lowStockCount} {lowStockCount === 1 ? 'Item' : 'Items'}
            </div>
          </div>
        </div>

        <div className="canteen-stat-card">
          <div className="canteen-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <Coins size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Total Stock Value
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>
              ₹{(totalRetailPaise / 100).toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {/* Action Header & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Canteen & Snack Bar Menu</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Configure snacks, energy drinks, and cafe items sold to tables, consoles & turf spectators.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Search snacks & drinks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px 8px 36px',
                color: '#fff',
                fontSize: '0.85rem',
              }}
            />
          </div>

          <button className="btn btn-primary" onClick={openAddModal} style={{ gap: '6px' }}>
            <Plus size={16} />
            <span>+ Add Snack / Drink</span>
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {categories.map((c) => (
          <button
            key={c.code}
            onClick={() => setCategoryFilter(c.code)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.78rem',
              fontWeight: 600,
              border: categoryFilter === c.code ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
              background: categoryFilter === c.code ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              color: categoryFilter === c.code ? '#818cf8' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="canteen-table-wrapper">
        <table className="canteen-table">
          <thead>
            <tr>
              <th className="canteen-th">Product Name</th>
              <th className="canteen-th">Category</th>
              <th className="canteen-th">Retail Price</th>
              <th className="canteen-th">Available Stock</th>
              <th className="canteen-th">Stock Status</th>
              <th className="canteen-th" style={{ textAlign: 'right' }}>Quick Adjust</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No canteen items matching search filter.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const isLow = item.stockCount <= item.lowStockThreshold;
                return (
                  <tr key={item.id} className="canteen-td">
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                      <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>{item.icon || '🥤'}</span>
                      {item.name}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-dim)' }}>
                      {item.category.replace('_', ' ')}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                      ₹{item.pricePaise / 100}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                      {item.stockCount} units
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {isLow ? (
                        <span
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#f87171',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                          }}
                        >
                          ⚠️ Low Stock (≤ {item.lowStockThreshold})
                        </span>
                      ) : (
                        <span
                          style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#34d399',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                          }}
                        >
                          ✓ In Stock
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="canteen-stock-btn"
                          onClick={() => handleAdjustStock(item.id, -1)}
                          title="Reduce stock by 1"
                        >
                          -
                        </button>
                        <span style={{ fontSize: '0.82rem', minWidth: '22px', textAlign: 'center' }}>
                          {item.stockCount}
                        </span>
                        <button
                          type="button"
                          className="canteen-stock-btn"
                          onClick={() => handleAdjustStock(item.id, 5)}
                          title="Restock +5 units"
                          style={{ color: '#34d399' }}
                        >
                          +5
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add New Snack Modal */}
      {isAddModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 8, 22, 0.82)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '16px',
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '500px',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid rgba(99, 102, 241, 0.35)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UtensilsCrossed size={20} color="var(--accent-primary)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>Add New Snack / Drink</h3>
              </div>
              <button onClick={closeAddModal} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveNewItem} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Doritos Nacho Cheese (100g)"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                    Category
                  </label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as any)}
                    className="input-field"
                    style={{ width: '100%' }}
                  >
                    <option value="FOOD">Food / Snack</option>
                    <option value="BEVERAGE">Beverage / Drink</option>
                    <option value="EQUIPMENT_RENTAL">Equipment Rental</option>
                    <option value="ACCESSORY">Accessory</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                    Icon Emoji
                  </label>
                  <input
                    type="text"
                    placeholder="🍿"
                    value={newItemIcon}
                    onChange={(e) => setNewItemIcon(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', textAlign: 'center' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                    Retail Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="50"
                    value={newItemPriceRupees}
                    onChange={(e) => setNewItemPriceRupees(e.target.value)}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                    Initial Stock Count *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="25"
                    value={newItemStock}
                    onChange={(e) => setNewItemStock(e.target.value)}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                  Low Stock Alert Threshold
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="5"
                  value={newItemThreshold}
                  onChange={(e) => setNewItemThreshold(e.target.value)}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={closeAddModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save to Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
