import React from 'react';
import { Plus, QrCode } from 'lucide-react';
import { HeaderController } from './Header.controller';
import './Header.css';

export interface HeaderViewProps {
  controller: HeaderController;
}

export const HeaderView: React.FC<HeaderViewProps> = ({ controller }) => {
  const { title, sub, totalShiftRevenue, openQrCheckinModal, openWalkinModal } = controller;

  return (
    <header className="app-header">
      <div>
        <div className="app-header-title-group">
          <h1 className="app-header-title">{title}</h1>
          <span className="badge-live">Live Sync</span>
        </div>
        <p className="app-header-subtitle">{sub}</p>
      </div>

      <div className="app-header-actions">
        {/* Shift Cash Balance Box */}
        <div className="glass-panel app-header-shift-panel">
          <div>
            <div className="app-header-shift-label">Shift Collection</div>
            <div className="app-header-shift-val">
              ₹{totalShiftRevenue.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="app-header-shift-breakdown">
            Cash: ₹5,800
            <br />
            UPI: ₹12,650
          </div>
        </div>

        <button className="btn btn-secondary" style={{ gap: '8px' }} onClick={openQrCheckinModal}>
          <QrCode size={18} />
          <span>Scan Ticket QR</span>
        </button>

        <button className="btn btn-primary" onClick={openWalkinModal}>
          <Plus size={18} />
          <span>New Walk-in</span>
        </button>
      </div>
    </header>
  );
};
