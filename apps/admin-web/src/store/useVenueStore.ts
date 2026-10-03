import { create } from 'zustand';
import { ResourceSession, BookingItem, TabType, TenantInfo, SportItem, CanteenItem } from '../types';
import { api } from '../services/api';

interface VenueState {
  activeTab: TabType;
  now: Date;
  tenant: TenantInfo;
  sports: SportItem[];
  canteenCatalog: CanteenItem[];
  resources: ResourceSession[];
  bookings: BookingItem[];
  filterSport: string;
  searchQuery: string;

  // Modals state
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

  // Actions
  setActiveTab: (tab: TabType) => void;
  setFilterSport: (sport: string) => void;
  setSearchQuery: (query: string) => void;
  tickTimer: () => void;

  openWalkinModal: (resourceId?: number) => void;
  closeWalkinModal: () => void;
  startSession: (resourceId: number, customerName?: string, customerPhone?: string) => Promise<void>;

  openSettlementModal: (session: ResourceSession) => void;
  closeSettlementModal: () => void;
  completeSettlement: (paymentMethod: 'CASH' | 'UPI_COUNTER' | 'WALLET', discountPaise?: number) => Promise<void>;

  openAddSportModal: () => void;
  closeAddSportModal: () => void;
  addSport: (sport: { code: string; nameEn: string; nameMr?: string; nameHi?: string }) => Promise<void>;

  openAddResourceModal: () => void;
  closeAddResourceModal: () => void;
  addResource: (data: {
    name: string;
    sport: string;
    billingMode: 'TIME_PLAYED' | 'FIXED_SLOT';
    ratePerHour: number;
    slotMinutes?: number;
  }) => Promise<void>;

  openRefundModal: (booking: BookingItem) => void;
  closeRefundModal: () => void;
  processRefundAndCancel: (bookingId: string, amountPaise: number, reason: string) => Promise<void>;

  openCanteenModal: (session: ResourceSession) => void;
  closeCanteenModal: () => void;
  addItemToSession: (session: ResourceSession, item: CanteenItem, quantity: number) => void;
  openShiftSummaryModal: () => void;
  closeShiftSummaryModal: () => void;

  // Report actions (Module 7)
  reportDateRange: 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH';
  setReportDateRange: (range: 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH') => void;
  exportReportCsv: () => Promise<void>;

  // Computed helpers
  calculateElapsedMinutes: (startedAt?: Date) => number;
  calculateCurrentBill: (session: ResourceSession) => number;
}

const INITIAL_SPORTS: SportItem[] = [
  { id: 1, code: 'PLAYSTATION', nameEn: 'PlayStation 5', icon: '🎮' },
  { id: 2, code: 'POOL', nameEn: 'Snooker & Pool', icon: '🎱' },
  { id: 3, code: 'TURF', nameEn: 'Box Turf', icon: '⚽' },
  { id: 4, code: 'CARROM', nameEn: 'Carrom', icon: '🎯' },
  { id: 5, code: 'TENNIS', nameEn: 'Lawn Tennis', icon: '🎾' },
  { id: 6, code: 'BADMINTON', nameEn: 'Badminton', icon: '🏸' },
  { id: 7, code: 'PICKLEBALL', nameEn: 'Pickleball', icon: '🏓' },
  { id: 8, code: 'VR_GAMING', nameEn: 'VR Gaming Lounge', icon: '🥽' },
  { id: 9, code: 'BOWLING', nameEn: 'Bowling Alley', icon: '🎳' },
];

const INITIAL_CANTEEN_ITEMS: CanteenItem[] = [
  { id: 1, name: 'Extra PS5 DualSense Controller', category: 'EQUIPMENT_RENTAL', pricePaise: 10000, stockCount: 8, lowStockThreshold: 2, isEquipment: true, icon: '🎮' },
  { id: 2, name: 'Pro Snooker Cue Rental', category: 'EQUIPMENT_RENTAL', pricePaise: 8000, stockCount: 12, lowStockThreshold: 3, isEquipment: true, icon: '🎱' },
  { id: 3, name: 'Red Bull Energy Drink (250ml)', category: 'BEVERAGE', pricePaise: 12500, stockCount: 24, lowStockThreshold: 6, isEquipment: false, icon: '🥤' },
  { id: 4, name: 'Monster Energy Ultra (350ml)', category: 'BEVERAGE', pricePaise: 14000, stockCount: 18, lowStockThreshold: 4, isEquipment: false, icon: '⚡' },
  { id: 5, name: 'Cold Brew Hazelnut Coffee', category: 'BEVERAGE', pricePaise: 9500, stockCount: 15, lowStockThreshold: 3, isEquipment: false, icon: '☕' },
  { id: 6, name: 'Mineral Water (1 Litre)', category: 'BEVERAGE', pricePaise: 2000, stockCount: 50, lowStockThreshold: 10, isEquipment: false, icon: '💧' },
  { id: 7, name: 'Loaded Cheese Nachos with Salsa', category: 'FOOD', pricePaise: 14000, stockCount: 14, lowStockThreshold: 3, isEquipment: false, icon: '🧀' },
  { id: 8, name: 'Hot Buttered Popcorn Tub', category: 'FOOD', pricePaise: 7000, stockCount: 30, lowStockThreshold: 5, isEquipment: false, icon: '🍿' },
  { id: 9, name: 'Snooker Chalk & Master Tip Set', category: 'ACCESSORY', pricePaise: 3000, stockCount: 20, lowStockThreshold: 5, isEquipment: false, icon: '🎯' },
  { id: 10, name: 'Badminton / TT Racket Set', category: 'EQUIPMENT_RENTAL', pricePaise: 12000, stockCount: 6, lowStockThreshold: 2, isEquipment: true, icon: '🏸' },
];

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
    startedAt: new Date(Date.now() - 48 * 60 * 1000), // 48 mins ago
    canteenItems: [
      { id: 101, canteenItemId: 3, itemName: 'Red Bull Energy Drink (250ml)', quantity: 2, unitPricePaise: 12500, totalPaise: 25000 },
    ],
  },
  {
    id: 2,
    name: 'PlayStation 5 Console #2 (DualSense Edge)',
    sport: 'PLAYSTATION',
    billingMode: 'TIME_PLAYED',
    status: 'AVAILABLE',
    ratePerHour: 250,
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
    startedAt: new Date(Date.now() - 85 * 60 * 1000), // 85 mins ago
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
    scheduledSlot: '12:00 PM - 01:00 PM',
  },
  {
    id: 5,
    name: 'Indoor Box Turf Ground (5-A-Side)',
    sport: 'TURF',
    billingMode: 'FIXED_SLOT',
    status: 'AVAILABLE',
    ratePerHour: 1200,
    ratePerSlot: 1200,
  },
  {
    id: 6,
    name: 'Carrom Board Pro Suite #1',
    sport: 'CARROM',
    billingMode: 'TIME_PLAYED',
    status: 'AVAILABLE',
    ratePerHour: 120,
  },
  {
    id: 7,
    name: 'Yonex Badminton Court A (Wooden)',
    sport: 'BADMINTON',
    billingMode: 'FIXED_SLOT',
    status: 'AVAILABLE',
    ratePerHour: 400,
    ratePerSlot: 400,
  },
  {
    id: 8,
    name: 'HTC Vive Pro VR Arena Pod #1',
    sport: 'VR_GAMING',
    billingMode: 'TIME_PLAYED',
    status: 'AVAILABLE',
    ratePerHour: 500,
  },
];

const INITIAL_BOOKINGS: BookingItem[] = [
  {
    id: 'BK-8492',
    customerName: 'Aditya Verma',
    customerPhone: '+91 98201 12345',
    resourceName: 'PlayStation 5 #1',
    timeWindow: '11:00 AM - Live Session',
    amountPaise: 25000,
    paymentMode: 'COUNTER_UPI',
    status: 'IN_PROGRESS',
    createdAt: 'Today, 11:00 AM',
  },
  {
    id: 'BK-8491',
    customerName: 'Karan Mehra',
    customerPhone: '+91 98199 67890',
    resourceName: 'Pool Table A (8-Ball)',
    timeWindow: '10:30 AM - Live Session',
    amountPaise: 45000,
    paymentMode: 'COUNTER_CASH',
    status: 'IN_PROGRESS',
    createdAt: 'Today, 10:30 AM',
  },
  {
    id: 'BK-8488',
    customerName: 'Rohan Joshi',
    customerPhone: '+91 98765 43210',
    resourceName: 'Turf Ground (5-A-Side)',
    timeWindow: '09:00 AM - 10:00 AM',
    amountPaise: 120000,
    paymentMode: 'RAZORPAY_ONLINE',
    status: 'COMPLETED',
    createdAt: 'Today, 08:45 AM',
  },
  {
    id: 'BK-8485',
    customerName: 'Sanjay Deshmukh',
    customerPhone: '+91 91234 56789',
    resourceName: 'PlayStation 5 #2',
    timeWindow: '08:00 AM - 09:30 AM',
    amountPaise: 37500,
    paymentMode: 'COUNTER_UPI',
    status: 'COMPLETED',
    createdAt: 'Today, 07:55 AM',
  },
];

export const useVenueStore = create<VenueState>((set, get) => ({
  activeTab: 'desk',
  now: new Date(),
  tenant: {
    id: 1,
    name: 'Apex Gaming & Sports Lounge',
    slug: 'apex-gaming',
    plan: 'Enterprise Pro',
    staffName: 'Rahul Sharma (Desk Manager)',
    role: 'STAFF',
    city: 'Pune',
  },
  sports: INITIAL_SPORTS,
  resources: INITIAL_RESOURCES,
  bookings: INITIAL_BOOKINGS,
  filterSport: 'ALL',
  searchQuery: '',
  canteenCatalog: INITIAL_CANTEEN_ITEMS,

  isWalkinModalOpen: false,
  selectedResourceIdForWalkin: 2,
  isSettlementModalOpen: false,
  sessionToSettle: null,
  isAddSportModalOpen: false,
  isAddResourceModalOpen: false,
  isRefundModalOpen: false,
  bookingToRefund: null,
  isCanteenModalOpen: false,
  sessionForCanteen: null,
  isShiftSummaryModalOpen: false,
  reportDateRange: 'TODAY',

  setActiveTab: (tab) => set({ activeTab: tab }),
  setFilterSport: (sport) => set({ filterSport: sport }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  tickTimer: () => set({ now: new Date() }),

  calculateElapsedMinutes: (startedAt?: Date) => {
    if (!startedAt) return 0;
    const now = get().now;
    return Math.max(0, Math.floor((now.getTime() - startedAt.getTime()) / 60000));
  },

  calculateCurrentBill: (session: ResourceSession) => {
    let baseTime = session.ratePerSlot || session.ratePerHour;
    if (session.status === 'IN_PROGRESS' && session.startedAt) {
      const elapsedMins = get().calculateElapsedMinutes(session.startedAt);
      // 5-minute round-up rule per enterprise technical spec
      const roundedMins = Math.ceil(Math.max(15, elapsedMins) / 5) * 5;
      baseTime = Math.round((roundedMins / 60) * session.ratePerHour);
    }
    const canteenTotal = (session.canteenItems || []).reduce((sum, item) => sum + (item.totalPaise / 100), 0);
    return baseTime + canteenTotal;
  },

  openWalkinModal: (resourceId) => {
    const defaultId = resourceId || get().resources.find((r) => r.status === 'AVAILABLE')?.id || 2;
    set({ isWalkinModalOpen: true, selectedResourceIdForWalkin: defaultId });
  },

  closeWalkinModal: () => set({ isWalkinModalOpen: false }),

  startSession: async (resourceId, customerName, customerPhone) => {
    const name = customerName || 'Walk-in Guest';
    const phone = customerPhone || '+91 99999 00000';
    const startTime = new Date();

    api.startLiveSession({
      resourceId,
      walkinName: name,
      walkinPhone: phone,
    }).catch((err) => {
      console.warn('API Gateway offline or pending; running with local state:', err);
    });

    set((state) => ({
      resources: state.resources.map((r) =>
        r.id === resourceId
          ? {
              ...r,
              status: 'IN_PROGRESS',
              startedAt: startTime,
              customerName: name,
              customerPhone: phone,
            }
          : r
      ),
      bookings: [
        {
          id: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
          customerName: name,
          customerPhone: phone,
          resourceName: state.resources.find((r) => r.id === resourceId)?.name || 'Resource',
          timeWindow: 'Live Session (Started Just Now)',
          amountPaise: 0,
          paymentMode: 'COUNTER_UPI',
          status: 'IN_PROGRESS',
          createdAt: 'Just now',
        },
        ...state.bookings,
      ],
      isWalkinModalOpen: false,
    }));
  },

  openSettlementModal: (session) => {
    set({ isSettlementModalOpen: true, sessionToSettle: session });
  },

  closeSettlementModal: () => {
    set({ isSettlementModalOpen: false, sessionToSettle: null });
  },

  completeSettlement: async (paymentMethod, discountPaise = 0) => {
    const session = get().sessionToSettle;
    if (!session) return;

    const bill = get().calculateCurrentBill(session);
    const finalAmount = Math.max(0, bill - Math.round(discountPaise / 100));

    if (session.backendSessionId) {
      api.stopLiveSession(session.backendSessionId, {
        discountPaise,
        paymentMethod,
      }).catch((err) => console.warn('API call failed:', err));
    }

    set((state) => ({
      resources: state.resources.map((r) =>
        r.id === session.id
          ? {
              ...r,
              status: 'AVAILABLE',
              startedAt: undefined,
              customerName: undefined,
              customerPhone: undefined,
              backendSessionId: undefined,
            }
          : r
      ),
      bookings: state.bookings.map((b) =>
        b.customerName === session.customerName && b.status === 'IN_PROGRESS'
          ? {
              ...b,
              status: 'COMPLETED',
              amountPaise: finalAmount * 100,
              paymentMode: paymentMethod === 'CASH' ? 'COUNTER_CASH' : 'COUNTER_UPI',
            }
          : b
      ),
      isSettlementModalOpen: false,
      sessionToSettle: null,
    }));
  },

  // --- Dynamic Sport Management Actions ---
  openAddSportModal: () => set({ isAddSportModalOpen: true }),
  closeAddSportModal: () => set({ isAddSportModalOpen: false }),

  addSport: async (sport) => {
    const code = sport.code.trim().toUpperCase().replace(/\s+/g, '_');
    api.createSport({
      code,
      nameEn: sport.nameEn,
      nameMr: sport.nameMr,
      nameHi: sport.nameHi,
    }).catch((err) => console.warn('API Gateway sport register:', err));

    const newSportItem: SportItem = {
      id: Date.now(),
      code,
      nameEn: sport.nameEn,
      nameMr: sport.nameMr,
      nameHi: sport.nameHi,
      icon: '🏆',
    };

    set((state) => ({
      sports: [...state.sports.filter((s) => s.code !== code), newSportItem],
      isAddSportModalOpen: false,
    }));
  },

  // --- Dynamic Resource Creation Actions ---
  openAddResourceModal: () => set({ isAddResourceModalOpen: true }),
  closeAddResourceModal: () => set({ isAddResourceModalOpen: false }),

  addResource: async (data) => {
    const newId = Date.now();
    const newResource: ResourceSession = {
      id: newId,
      name: data.name,
      sport: data.sport,
      billingMode: data.billingMode,
      status: 'AVAILABLE',
      ratePerHour: data.ratePerHour,
      ratePerSlot: data.billingMode === 'FIXED_SLOT' ? data.ratePerHour : undefined,
      slotMinutes: data.slotMinutes || 60,
    };

    api.createResource({
      venueId: 1,
      sportId: 1,
      name: data.name,
      billingMode: data.billingMode,
      slotMinutes: data.slotMinutes || 60,
      capacity: 2,
    }).catch((err) => console.warn('API create resource:', err));

    set((state) => ({
      resources: [...state.resources, newResource],
      isAddResourceModalOpen: false,
    }));
  },

  // --- Cancellation Policy & Refunds Actions (Module 5) ---
  openRefundModal: (booking) => set({ isRefundModalOpen: true, bookingToRefund: booking }),
  closeRefundModal: () => set({ isRefundModalOpen: false, bookingToRefund: null }),

  processRefundAndCancel: async (bookingId, amountPaise, reason) => {
    const numericId = parseInt(bookingId.replace(/\D/g, ''), 10) || 1;

    api.cancelBooking(numericId).catch((err) => console.warn('Cancel booking API:', err));
    if (amountPaise > 0) {
      api.processRefund(numericId, amountPaise, reason).catch((err) => console.warn('Process refund API:', err));
    }

    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: 'CANCELLED',
              refundPaise: amountPaise,
            }
          : b
      ),
      isRefundModalOpen: false,
      bookingToRefund: null,
    }));
  },

  // --- Canteen & Equipment Inventory Actions (Module 6) ---
  openCanteenModal: (session) => set({ isCanteenModalOpen: true, sessionForCanteen: session }),
  closeCanteenModal: () => set({ isCanteenModalOpen: false, sessionForCanteen: null }),

  addItemToSession: (session, item, quantity) => {
    const bookingId = session.backendSessionId || session.id;
    const totalPaise = item.pricePaise * quantity;
    const newItem = {
      id: Date.now(),
      canteenItemId: item.id,
      itemName: item.name,
      quantity,
      unitPricePaise: item.pricePaise,
      totalPaise,
    };

    api.addItemToBooking(bookingId, {
      canteenItemId: item.id,
      itemName: item.name,
      quantity,
      unitPricePaise: item.pricePaise,
    }).catch((err) => console.warn('Add item to booking API:', err));

    set((state) => ({
      resources: state.resources.map((r) =>
        r.id === session.id
          ? {
              ...r,
              canteenItems: [...(r.canteenItems || []), newItem],
            }
          : r
      ),
      canteenCatalog: state.canteenCatalog.map((ci) =>
        ci.id === item.id
          ? { ...ci, stockCount: Math.max(0, ci.stockCount - quantity) }
          : ci
      ),
      isCanteenModalOpen: false,
      sessionForCanteen: null,
    }));
  },

  openShiftSummaryModal: () => set({ isShiftSummaryModalOpen: true }),
  closeShiftSummaryModal: () => set({ isShiftSummaryModalOpen: false }),

  // --- Reports & Analytics Actions (Module 7) ---
  setReportDateRange: (range) => set({ reportDateRange: range }),

  exportReportCsv: async () => {
    try {
      await api.downloadReportCsv();
    } catch {
      // Direct client fallback CSV generation
      const state = get();
      const headers = ['Booking ID', 'Resource', 'Sport', 'Customer', 'Phone', 'Source', 'Status', 'Payment Mode', 'Amount (INR)'];
      const rows = state.bookings.map((b) => [
        b.id,
        `"${b.resourceName}"`,
        `"${b.sport}"`,
        `"${b.customerName}"`,
        `"${b.customerPhone || '-'}"`,
        b.source,
        b.status,
        b.paymentMode,
        (b.amountPaise / 100).toFixed(2),
      ]);
      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `venue-report-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  },
}));
