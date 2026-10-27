import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  ResourceSession,
  BookingItem,
  TabType,
  AuditLogEntry,
} from '../types';

export interface VenueState {
  activeTab: TabType;
  filterSport: string;
  searchQuery: string;
  language: 'en' | 'mr' | 'hi';
  isWalkinModalOpen: boolean;
  selectedResourceIdForWalkin: number;
  isSettlementModalOpen: boolean;
  sessionToSettle: ResourceSession | null;
  isAddSportModalOpen: boolean;
  isAddResourceModalOpen: boolean;
  isRefundModalOpen: boolean;
  bookingToRefund: BookingItem | null;
  isCanteenModalOpen: boolean;
  sessionForCanteen: ResourceSession | null;
  isShiftSummaryModalOpen: boolean;
  isGatewaySettingsModalOpen: boolean;
  isQrCheckinModalOpen: boolean;
  isExtendModalOpen: boolean;
  sessionToExtend: ResourceSession | null;
  isSwapModalOpen: boolean;
  sessionToSwap: ResourceSession | null;
  auditLogs: AuditLogEntry[];
}

const initialState: VenueState = {
  activeTab: 'desk',
  filterSport: 'ALL',
  searchQuery: '',
  language: 'en',
  isWalkinModalOpen: false,
  selectedResourceIdForWalkin: 0,
  isSettlementModalOpen: false,
  sessionToSettle: null,
  isAddSportModalOpen: false,
  isAddResourceModalOpen: false,
  isRefundModalOpen: false,
  bookingToRefund: null,
  isCanteenModalOpen: false,
  sessionForCanteen: null,
  isShiftSummaryModalOpen: false,
  isGatewaySettingsModalOpen: false,
  isQrCheckinModalOpen: false,
  isExtendModalOpen: false,
  sessionToExtend: null,
  isSwapModalOpen: false,
  sessionToSwap: null,
  auditLogs: [],
};

export const venueSlice = createSlice({
  name: 'venue',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<TabType>) => {
      state.activeTab = action.payload;
    },
    setFilterSport: (state, action: PayloadAction<string>) => {
      state.filterSport = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setLanguage: (state, action: PayloadAction<'en' | 'mr' | 'hi'>) => {
      state.language = action.payload;
    },
    openRefundModal: (state, action: PayloadAction<BookingItem>) => {
      state.isRefundModalOpen = true;
      state.bookingToRefund = action.payload;
    },
    closeRefundModal: (state) => {
      state.isRefundModalOpen = false;
      state.bookingToRefund = null;
    },
    openGatewaySettingsModal: (state) => {
      state.isGatewaySettingsModalOpen = true;
    },
    closeGatewaySettingsModal: (state) => {
      state.isGatewaySettingsModalOpen = false;
    },
    openQrCheckinModal: (state) => {
      state.isQrCheckinModalOpen = true;
    },
    closeQrCheckinModal: (state) => {
      state.isQrCheckinModalOpen = false;
    },
    openExtendModal: (state, action: PayloadAction<ResourceSession>) => {
      state.isExtendModalOpen = true;
      state.sessionToExtend = action.payload;
    },
    closeExtendModal: (state) => {
      state.isExtendModalOpen = false;
      state.sessionToExtend = null;
    },
    openSwapModal: (state, action: PayloadAction<ResourceSession>) => {
      state.isSwapModalOpen = true;
      state.sessionToSwap = action.payload;
    },
    closeSwapModal: (state) => {
      state.isSwapModalOpen = false;
      state.sessionToSwap = null;
    },
    addAuditLog: (
      state,
      action: PayloadAction<{ action: string; details: string; user?: string; type: AuditLogEntry['type'] }>
    ) => {
      state.auditLogs.unshift({
        id: 'aud-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        action: action.payload.action,
        details: action.payload.details,
        user: action.payload.user || 'Shift Staff',
        type: action.payload.type,
      });
    },
  },
});

export const {
  setActiveTab,
  setFilterSport,
  setSearchQuery,
  setLanguage,
  openRefundModal,
  closeRefundModal,
  openGatewaySettingsModal,
  closeGatewaySettingsModal,
  openQrCheckinModal,
  closeQrCheckinModal,
  openExtendModal,
  closeExtendModal,
  openSwapModal,
  closeSwapModal,
  addAuditLog,
} = venueSlice.actions;

export default venueSlice.reducer;
