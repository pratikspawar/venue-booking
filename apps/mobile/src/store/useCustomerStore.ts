import { create } from 'zustand';
import {
  SportCategory,
  SportItem,
  VenueItem,
  ResourceItem,
  SlotCell,
  BookingTicket,
  CustomerUser,
} from '../types';
import { mobileApi } from '../services/api';

interface CustomerState {
  user: CustomerUser | null;
  language: 'en' | 'mr' | 'hi';
  activeTab: 'explore' | 'bookings' | 'profile';
  selectedSport: SportCategory;
  sports: SportItem[];

  // Selected Venue & Resource for Booking
  venues: VenueItem[];
  selectedVenue: VenueItem | null;
  resources: ResourceItem[];
  selectedResource: ResourceItem | null;
  selectedDate: string;
  availableSlots: SlotCell[];
  selectedSlots: SlotCell[];

  // Modals
  isCheckoutOpen: boolean;
  isAuthOpen: boolean;

  // Bookings list
  myBookings: BookingTicket[];

  // Actions
  fetchSports: () => Promise<void>;
  setActiveTab: (tab: 'explore' | 'bookings' | 'profile') => void;
  setSelectedSport: (sport: SportCategory) => void;
  selectVenue: (venue: VenueItem) => Promise<void>;
  selectResource: (resource: ResourceItem) => Promise<void>;
  toggleSlot: (slot: SlotCell) => void;
  clearSlots: () => void;
  openCheckout: () => void;
  closeCheckout: () => void;
  openAuth: () => void;
  closeAuth: () => void;
  confirmBooking: (paymentMode: 'ONLINE' | 'PAY_AT_VENUE') => Promise<void>;
  cancelBooking: (bookingId: string) => void;
  setLanguage: (lang: 'en' | 'mr' | 'hi') => void;
  loginUser: (phone: string, otp: string) => Promise<void>;
  logoutUser: () => void;
}

const INITIAL_SPORTS: SportItem[] = [
  { id: 1, code: 'PLAYSTATION', nameEn: 'PlayStation 5', icon: '🎮' },
  { id: 2, code: 'POOL', nameEn: 'Snooker & Pool', icon: '🎱' },
  { id: 3, code: 'TURF', nameEn: 'Box Turf', icon: '⚽' },
  { id: 4, code: 'CARROM', nameEn: 'Carrom', icon: '🎯' },
  { id: 5, code: 'BADMINTON', nameEn: 'Badminton', icon: '🏸' },
  { id: 6, code: 'PICKLEBALL', nameEn: 'Pickleball', icon: '🏓' },
  { id: 7, code: 'VR_GAMING', nameEn: 'VR Gaming', icon: '🥽' },
];

const INITIAL_BOOKINGS: BookingTicket[] = [
  {
    bookingId: 'BK-7210',
    venueName: 'Apex Gaming Lounge',
    venueAddress: 'Bandra West, Mumbai',
    resourceName: 'PlayStation 5 Console #1 (4K OLED)',
    sport: 'PLAYSTATION',
    dateLabel: 'Today, 3 Oct',
    timeWindow: '06:00 PM - 07:00 PM',
    status: 'CONFIRMED',
    amountPaise: 25000,
    paymentMode: 'ONLINE',
    qrData: 'VB-BK-7210-CHECKIN-HASH-8A9F',
    canCancel: true,
  },
  {
    bookingId: 'BK-6890',
    venueName: 'Urban Box Turf',
    venueAddress: 'Andheri East, Mumbai',
    resourceName: 'Box Turf Pitch A',
    sport: 'TURF',
    dateLabel: 'Tomorrow, 4 Oct',
    timeWindow: '08:00 AM - 09:00 AM',
    status: 'HELD',
    amountPaise: 120000,
    paymentMode: 'ONLINE',
    qrData: 'VB-BK-6890-HOLD-HASH-3F21',
    canCancel: true,
    holdExpiresAt: '7m 42s remaining',
  },
];

export const useCustomerStore = create<CustomerState>((set, get) => ({
  user: {
    id: 101,
    phone: '+91 98201 12345',
    name: 'Siddharth Ranade',
    language: 'en',
    walletBalancePaise: 50000, // ₹500
    token: 'mock_jwt_token',
  },
  language: 'en',
  activeTab: 'explore',
  selectedSport: 'ALL',
  sports: INITIAL_SPORTS,
  venues: [],
  selectedVenue: null,
  resources: [],
  selectedResource: null,
  selectedDate: 'Today, 3 Oct',
  availableSlots: [],
  selectedSlots: [],

  isCheckoutOpen: false,
  isAuthOpen: false,
  myBookings: INITIAL_BOOKINGS,

  fetchSports: async () => {
    const sports = await mobileApi.fetchSports();
    if (sports && sports.length > 0) {
      set({ sports });
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedSport: (sport) => set({ selectedSport: sport }),

  selectVenue: async (venue) => {
    set({ selectedVenue: venue, selectedSlots: [] });
    const resources = await mobileApi.fetchResources(venue.id);
    set({ resources, selectedResource: resources[0] || null });
    if (resources[0]) {
      const slots = await mobileApi.fetchAvailability(resources[0].id, '2026-10-03');
      set({ availableSlots: slots });
    }
  },

  selectResource: async (resource) => {
    set({ selectedResource: resource, selectedSlots: [] });
    const slots = await mobileApi.fetchAvailability(resource.id, '2026-10-03');
    set({ availableSlots: slots });
  },

  toggleSlot: (slot) => {
    if (slot.status !== 'AVAILABLE') return;
    const current = get().selectedSlots;
    const exists = current.some((s) => s.startUtc === slot.startUtc);
    if (exists) {
      set({ selectedSlots: current.filter((s) => s.startUtc !== slot.startUtc) });
    } else {
      set({ selectedSlots: [...current, slot] });
    }
  },

  clearSlots: () => set({ selectedSlots: [] }),

  openCheckout: () => set({ isCheckoutOpen: true }),
  closeCheckout: () => set({ isCheckoutOpen: false }),

  openAuth: () => set({ isAuthOpen: true }),
  closeAuth: () => set({ isAuthOpen: false }),

  confirmBooking: async (paymentMode) => {
    const venue = get().selectedVenue;
    const resource = get().selectedResource;
    const slots = get().selectedSlots;
    if (!venue || !resource || slots.length === 0) return;

    const totalPaise = slots.reduce((acc, s) => acc + s.pricePaise, 0);
    const newBookingId = `BK-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTicket: BookingTicket = {
      bookingId: newBookingId,
      venueName: venue.name,
      venueAddress: venue.address,
      resourceName: resource.name,
      sport: resource.sport,
      dateLabel: get().selectedDate,
      timeWindow: `${slots[0].label} - ${slots.length * (resource.slotMinutes || 60)} mins`,
      status: paymentMode === 'PAY_AT_VENUE' ? 'CONFIRMED' : 'HELD',
      amountPaise: totalPaise,
      paymentMode,
      qrData: `VB-${newBookingId}-QR-PASS`,
      canCancel: true,
      holdExpiresAt: paymentMode === 'ONLINE' ? '7m 59s' : undefined,
    };

    set((state) => ({
      myBookings: [newTicket, ...state.myBookings],
      isCheckoutOpen: false,
      selectedSlots: [],
      activeTab: 'bookings',
    }));
  },

  cancelBooking: (bookingId) => {
    set((state) => ({
      myBookings: state.myBookings.map((b) =>
        b.bookingId === bookingId ? { ...b, status: 'CANCELLED', canCancel: false } : b
      ),
    }));
  },

  setLanguage: (lang) => set({ language: lang }),

  loginUser: async (phone, otp) => {
    const res = await mobileApi.verifyOtp(phone, otp);
    set({
      user: {
        id: res.user.id,
        phone,
        name: res.user.name || 'Gamer ' + phone.slice(-4),
        language: 'en',
        walletBalancePaise: 25000,
        token: res.accessToken,
      },
      isAuthOpen: false,
    });
  },

  logoutUser: () => set({ user: null }),
}));
