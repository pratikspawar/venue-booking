import React from 'react';
import { Plus, RefreshCw, Award, Users } from 'lucide-react';
import { MembershipManagementController } from './MembershipManagement.controller';
import { MembershipStatsCards } from '../MembershipStatsCards';
import { MembershipPlansGrid } from '../MembershipPlansGrid';
import { MembershipLedgerTable } from '../MembershipLedgerTable';
import { AddMembershipPlanModal } from '../AddMembershipPlanModal';
import './MembershipManagement.css';

export interface MembershipManagementViewProps {
  controller: MembershipManagementController;
}

export const MembershipManagementView: React.FC<MembershipManagementViewProps> = ({ controller }) => {
  const {
    activeSubTab,
    setActiveSubTab,
    plans,
    members,
    filteredMembers,
    activeSubscribersCount,
    isModalOpen,
    openModal,
    closeModal,
    searchQuery,
    setSearchQuery,
    togglingId,
    loading,
    refreshAll,
    handleToggle,
    handlePlanCreated,
  } = controller;

  return (
    <div className="membership-management-container">
      {/* Top Banner / Summary Stats */}
      <MembershipStatsCards
        plansCount={plans.length}
        activeSubscribersCount={activeSubscribersCount}
      />

      {/* Action Header & Tabs */}
      <div className="membership-actions-header">
        {/* Sub-tab Switcher */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveSubTab('PLANS')}
            className="membership-subtab-btn"
            style={{
              backgroundColor: activeSubTab === 'PLANS' ? '#4338ca' : 'transparent',
              color: activeSubTab === 'PLANS' ? '#ffffff' : '#94a3b8',
            }}
          >
            <Award size={16} />
            <span>Membership Plans ({plans.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('LEDGER')}
            className="membership-subtab-btn"
            style={{
              backgroundColor: activeSubTab === 'LEDGER' ? '#4338ca' : 'transparent',
              color: activeSubTab === 'LEDGER' ? '#ffffff' : '#94a3b8',
            }}
          >
            <Users size={16} />
            <span>Subscriber Ledger ({members.length})</span>
          </button>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={refreshAll}
            disabled={loading}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              color: '#94a3b8',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: loading ? 0.6 : 1,
            }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={openModal}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#eab308',
              color: '#0f172a',
              cursor: 'pointer',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(234, 179, 8, 0.25)',
            }}
          >
            <Plus size={16} />
            <span>New Membership Tier</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Plans Grid View */}
      {activeSubTab === 'PLANS' && (
        <MembershipPlansGrid
          plans={plans}
          togglingId={togglingId}
          onTogglePlan={handleToggle}
        />
      )}

      {/* TAB 2: Subscribed Members Ledger View */}
      {activeSubTab === 'LEDGER' && (
        <MembershipLedgerTable
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          members={filteredMembers}
        />
      )}

      {/* Modal for adding plan */}
      <AddMembershipPlanModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onPlanCreated={handlePlanCreated}
      />
    </div>
  );
};
