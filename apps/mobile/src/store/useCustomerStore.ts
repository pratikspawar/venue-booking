import { create } from 'zustand';
import {
  SportCategory,
  SportItem,
  VenueItem,
  ResourceItem,
  SlotCell,
  BookingTicket,
  CustomerUser,
  WalletTransaction,
  MembershipPlan,
  CustomerMembership,
  PrepaidPackageDto,
  CustomerPrepaidPackageDto,
  CouponValidationResult,
} from '../types';
import { mobileApi } from '../services/api';
import RazorpayCheckout from 'react-native-razorpay';

interface CustomerState {
  user: CustomerUser | null;
  language: 'en' | 'mr' | 'hi';
  activeTab: 'explore' | 'bookings' | 'profile';
  selectedSport: SportCategory;
  sports: SportItem[];

  // Memberships & VIP Passes
  membershipPlans: MembershipPlan[];
  activeMembership: CustomerMembership | null;

  // Prepaid Game Hours Packages (Task 2.3)
  prepaidPackages: PrepaidPackageDto[];
  customerPrepaidPackages: CustomerPrepaidPackageDto[];

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
  checkoutBooking: any | null;
  isAuthOpen: boolean;
  isWalletOpen: boolean;
  walletTransactions: WalletTransaction[];

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
  openCheckout: (couponCode?: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<CouponValidationResult>;
  closeCheckout: () => Promise<void>;
  openAuth: () => void;
  closeAuth: () => void;
  openWalletModal: () => Promise<void>;
  closeWalletModal: () => void;
  fetchWalletData: () => Promise<void>;
  topupWallet: (amountRupees: number) => Promise<void>;
  fetchMemberships: () => Promise<void>;
  buyMembership: (planId: number) => Promise<void>;
  fetchPrepaidPackages: () => Promise<void>;
  buyPrepaidPackage: (packageId: number) => Promise<void>;
  confirmBooking: (paymentMode: 'ONLINE' | 'PAY_AT_VENUE') => Promise<void>;
  fetchMyBookings: () => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<void>;
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

const localDateIso = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const useCustomerStore = create<CustomerState>((set, get) => ({
  user: null,
  language: 'en',
  activeTab: 'explore',
  selectedSport: 'ALL',
  sports: [],
  venues: [],
  selectedVenue: null,
  resources: [],
  selectedResource: null,
  selectedDate: localDateIso(),
  availableSlots: [],
  selectedSlots: [],

  isCheckoutOpen: false,
  checkoutBooking: null,
  isAuthOpen: false,
  isWalletOpen: false,
  walletTransactions: [],
  membershipPlans: [],
  activeMembership: null,
  prepaidPackages: [],
  customerPrepaidPackages: [],
  myBookings: [],

  fetchSports: async () => {
    const sports = await mobileApi.fetchSports();
    set({ sports });
  },

  fetchMyBookings: async () => {
    if (!get().user?.token) { set({ myBookings: [] }); return; }
    set({ myBookings: await mobileApi.fetchMyBookings() });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedSport: (sport) => set({ selectedSport: sport }),

  selectVenue: async (venue) => {
    set({ selectedVenue: venue, selectedSlots: [] });
    const resources = await mobileApi.fetchResources(venue.id);
    set({ resources, selectedResource: resources[0] || null });
    if (resources[0]) {
      const slots = await mobileApi.fetchAvailability(resources[0].id, get().selectedDate);
      set({ availableSlots: slots });
    }
  },

  selectResource: async (resource) => {
    set({ selectedResource: resource, selectedSlots: [] });
    const slots = await mobileApi.fetchAvailability(resource.id, get().selectedDate);
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

  openCheckout: async (couponCode?: string) => {
    if (!get().user?.token) {
      set({ isAuthOpen: true });
      return;
    }
    const { selectedResource: resource, selectedSlots: selected } = get();
    if (!resource || selected.length === 0) return;
    const sorted = [...selected].sort((a, b) => Date.parse(a.startUtc) - Date.parse(b.startUtc));
    const slotMs = (resource.slotMinutes || 60) * 60000;
    if (sorted.some((slot, i) => i > 0 && Date.parse(slot.startUtc) !== Date.parse(sorted[i - 1].startUtc) + slotMs)) {
      throw new Error('Select consecutive slots to book them together.');
    }
    const prev = get().checkoutBooking;
    if (prev?.status === 'HELD') {
      try { await mobileApi.cancelBooking(prev.id); } catch {}
    }
    const booking = await mobileApi.createBooking({
      resourceId: resource.id,
      startUtc: sorted[0].startUtc,
      endUtc: new Date(Date.parse(sorted[sorted.length - 1].startUtc) + slotMs).toISOString(),
      paymentMode: 'ONLINE',
      couponCode,
    });
    set({ checkoutBooking: booking, isCheckoutOpen: true });
  },

  applyCoupon: async (code: string) => {
    const booking = get().checkoutBooking;
    const resource = get().selectedResource;
    if (!booking) throw new Error('No active booking hold found');
    const result = await mobileApi.validateCoupon(code, booking.amountPaise, resource?.sport);
    if (result.valid) {
      await get().openCheckout(code);
    }
    return result;
  },
  closeCheckout: async () => {
    const booking = get().checkoutBooking;
    if (booking?.status === 'HELD') await mobileApi.cancelBooking(booking.id);
    set({ isCheckoutOpen: false, checkoutBooking: null });
  },

  openAuth: () => set({ isAuthOpen: true }),
  closeAuth: () => set({ isAuthOpen: false }),

  confirmBooking: async (paymentMode) => {
    const venue = get().selectedVenue;
    const resource = get().selectedResource;
    const slots = get().selectedSlots;
    let booking = get().checkoutBooking;
    if (!venue || !resource || slots.length === 0) return;
    if (!booking) throw new Error('Your slot hold is missing. Close checkout and select the slots again.');
    if (paymentMode === 'PAY_AT_VENUE') {
      booking = await mobileApi.choosePayAtVenue(booking.id);
    } else {
      const order = await mobileApi.createPaymentOrder(booking.id);
      const payment = await RazorpayCheckout.open({
        key: order.keyId,
        amount: order.amountPaise,
        currency: order.currency,
        order_id: order.orderId,
        name: venue.name,
        description: `${resource.name} booking`,
        prefill: { name: get().user?.name, contact: get().user?.phone },
        theme: { color: '#6366f1' },
      });
      if (!payment.razorpay_signature) throw new Error('Payment response could not be verified. Your hold will expire automatically if payment did not complete.');
      await mobileApi.verifyPayment(order.orderId, payment.razorpay_payment_id, payment.razorpay_signature);
      booking = await mobileApi.fetchBooking(booking.id);
    }
    const newBookingId = String(booking.id);

    const newTicket: BookingTicket = {
      bookingId: newBookingId,
      venueName: venue.name,
      venueAddress: venue.address,
      resourceName: resource.name,
      sport: resource.sport,
      dateLabel: get().selectedDate,
      timeWindow: `${slots[0].label} - ${slots.length * (resource.slotMinutes || 60)} mins`,
      status: booking.status,
      amountPaise: booking.amountPaise,
      paymentMode,
      qrData: '',
      canCancel: true,
      holdExpiresAt: booking.holdExpiresAt,
    };

    set((state) => ({
      myBookings: [newTicket, ...state.myBookings.filter((b) => !b.bookingId.startsWith('BK-'))],
      isCheckoutOpen: false,
      checkoutBooking: null,
      selectedSlots: [],
      activeTab: 'bookings',
    }));
  },

  cancelBooking: async (bookingId) => {
    await mobileApi.cancelBooking(Number(bookingId));
    set((state) => ({
      myBookings: state.myBookings.map((b) =>
        b.bookingId === bookingId ? { ...b, status: 'CANCELLED', canCancel: false } : b
      ),
    }));
    await get().fetchMyBookings();
  },

  setLanguage: (lang) => set({ language: lang }),

  openWalletModal: async () => {
    set({ isWalletOpen: true });
    await get().fetchWalletData();
  },

  closeWalletModal: () => set({ isWalletOpen: false }),

  fetchWalletData: async () => {
    const user = get().user;
    if (!user) return;
    try {
      const [wallet, txns] = await Promise.all([
        mobileApi.fetchWallet(user.id),
        mobileApi.fetchWalletTransactions(user.id),
      ]);
      set((state) => ({
        user: state.user ? { ...state.user, walletBalancePaise: wallet.balancePaise } : null,
        walletTransactions: txns,
      }));
    } catch (e) {
      console.warn('Failed to fetch wallet data:', e);
    }
  },

  topupWallet: async (amountRupees: number) => {
    const user = get().user;
    if (!user) throw new Error('Please sign in to top up your wallet');
    const amountPaise = Math.round(amountRupees * 100);
    const order = await mobileApi.createWalletTopupOrder(amountPaise);

    const payment = await RazorpayCheckout.open({
      key: order.keyId,
      amount: order.amountPaise,
      currency: order.currency,
      order_id: order.orderId,
      name: 'Apex Gaming Lounge',
      description: `Wallet Top-Up ₹${amountRupees}`,
      prefill: { name: user.name, contact: user.phone },
      theme: { color: '#6366f1' },
    });

    if (!payment.razorpay_signature) {
      throw new Error('Payment response could not be verified.');
    }

    await mobileApi.verifyPayment(order.orderId, payment.razorpay_payment_id, payment.razorpay_signature);
    await get().fetchWalletData();
  },

  fetchMemberships: async () => {
    try {
      const plans = await mobileApi.fetchMembershipPlans();
      let active: CustomerMembership | null = null;
      if (get().user?.id) {
        active = await mobileApi.fetchActiveMembership(get().user!.id);
      }
      set({ membershipPlans: plans, activeMembership: active });
    } catch (e) {
      console.warn('Failed to fetch memberships:', e);
    }
  },

  buyMembership: async (planId: number) => {
    const user = get().user;
    if (!user) throw new Error('Please sign in to buy a membership');
    await mobileApi.purchaseMembership(planId, 'WALLET');
    await get().fetchMemberships();
    await get().fetchWalletData();
  },

  fetchPrepaidPackages: async () => {
    try {
      const pkgs = await mobileApi.fetchPrepaidPackages();
      let customerPkgs: CustomerPrepaidPackageDto[] = [];
      if (get().user?.id) {
        customerPkgs = await mobileApi.fetchCustomerPrepaidPackages(get().user!.id);
      }
      set({ prepaidPackages: pkgs, customerPrepaidPackages: customerPkgs });
    } catch (e) {
      console.warn('Failed to fetch prepaid packages:', e);
    }
  },

  buyPrepaidPackage: async (packageId: number) => {
    const user = get().user;
    if (!user) throw new Error('Please sign in to buy a prepaid package');
    await mobileApi.purchasePrepaidPackage(packageId, 'WALLET');
    await get().fetchPrepaidPackages();
    await get().fetchWalletData();
  },

  loginUser: async (phone, otp) => {
    const res = await mobileApi.verifyOtp(phone, otp);
    set({
      user: {
        id: res.user.id,
        phone,
        name: res.user.name || 'Gamer ' + phone.slice(-4),
        language: 'en',
        walletBalancePaise: 0,
        token: res.accessToken,
      },
      isAuthOpen: false,
    });
    await Promise.all([
      get().fetchMyBookings(),
      get().fetchWalletData(),
      get().fetchMemberships(),
      get().fetchPrepaidPackages(),
    ]);
  },

  logoutUser: () => {
    mobileApi.logout();
    set({
      user: null,
      myBookings: [],
      walletTransactions: [],
      isWalletOpen: false,
      membershipPlans: [],
      activeMembership: null,
      prepaidPackages: [],
      customerPrepaidPackages: [],
    });
  },
}));
