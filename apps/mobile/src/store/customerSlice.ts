import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
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
} from '../types';
import { mobileApi } from '../services/api';
import RazorpayCheckout from 'react-native-razorpay';

export interface CustomerState {
  user: CustomerUser | null;
  language: 'en' | 'mr' | 'hi';
  activeTab: 'explore' | 'bookings' | 'profile';
  selectedSport: SportCategory;
  sports: SportItem[];
  membershipPlans: MembershipPlan[];
  activeMembership: CustomerMembership | null;
  prepaidPackages: PrepaidPackageDto[];
  customerPrepaidPackages: CustomerPrepaidPackageDto[];
  venues: VenueItem[];
  selectedVenue: VenueItem | null;
  resources: ResourceItem[];
  selectedResource: ResourceItem | null;
  selectedDate: string;
  availableSlots: SlotCell[];
  selectedSlots: SlotCell[];
  isCheckoutOpen: boolean;
  checkoutBooking: any | null;
  isAuthOpen: boolean;
  isWalletOpen: boolean;
  walletTransactions: WalletTransaction[];
  myBookings: BookingTicket[];
  status: 'idle' | 'loading' | 'failed';
}

const initialState: CustomerState = {
  user: null,
  language: 'en',
  activeTab: 'explore',
  selectedSport: 'ALL',
  sports: [],
  membershipPlans: [],
  activeMembership: null,
  prepaidPackages: [],
  customerPrepaidPackages: [],
  venues: [],
  selectedVenue: null,
  resources: [],
  selectedResource: null,
  selectedDate: new Date().toISOString().split('T')[0],
  availableSlots: [],
  selectedSlots: [],
  isCheckoutOpen: false,
  checkoutBooking: null,
  isAuthOpen: false,
  isWalletOpen: false,
  walletTransactions: [],
  myBookings: [],
  status: 'idle',
};

// Async Thunks
export const fetchWalletData = createAsyncThunk(
  'customer/fetchWalletData',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { customer: CustomerState };
      const user = state.customer.user;
      if (!user) return { balancePaise: 0, transactions: [] };
      const [wallet, txs] = await Promise.all([
        mobileApi.fetchWallet(user.id),
        mobileApi.fetchWalletTransactions(user.id),
      ]);
      return { balancePaise: wallet.balancePaise, transactions: txs };
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const topupWalletThunk = createAsyncThunk(
  'customer/topupWallet',
  async (amountRupees: number, { dispatch, getState, rejectWithValue }) => {
    try {
      const state = getState() as { customer: CustomerState };
      const user = state.customer.user;
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
      await dispatch(fetchWalletData());
      return true;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Payment failed');
    }
  }
);

export const cancelBookingThunk = createAsyncThunk(
  'customer/cancelBooking',
  async (bookingId: string | number, { rejectWithValue }) => {
    try {
      await mobileApi.cancelBooking(Number(bookingId));
      return String(bookingId);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Cancellation failed');
    }
  }
);

export const customerSlice = createSlice({
  name: 'customer',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<CustomerUser | null>) => {
      state.user = action.payload;
    },
    setLanguage: (state, action: PayloadAction<'en' | 'mr' | 'hi'>) => {
      state.language = action.payload;
    },
    setActiveTab: (state, action: PayloadAction<'explore' | 'bookings' | 'profile'>) => {
      state.activeTab = action.payload;
    },
    setSelectedSport: (state, action: PayloadAction<SportCategory>) => {
      state.selectedSport = action.payload;
    },
    openAuth: (state) => {
      state.isAuthOpen = true;
    },
    closeAuth: (state) => {
      state.isAuthOpen = false;
    },
    openWalletModal: (state) => {
      state.isWalletOpen = true;
    },
    closeWalletModal: (state) => {
      state.isWalletOpen = false;
    },
    openCheckout: (state) => {
      state.isCheckoutOpen = true;
    },
    closeCheckout: (state) => {
      state.isCheckoutOpen = false;
    },
    logoutUser: (state) => {
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWalletData.fulfilled, (state, action) => {
        if (state.user) {
          state.user.walletBalancePaise = action.payload.balancePaise;
        }
        state.walletTransactions = action.payload.transactions;
      })
      .addCase(cancelBookingThunk.fulfilled, (state, action) => {
        const id = action.payload;
        state.myBookings = state.myBookings.map((b) =>
          b.bookingId === id ? { ...b, status: 'CANCELLED', canCancel: false } : b
        );
      });
  },
});

export const {
  setUser,
  setLanguage,
  setActiveTab,
  setSelectedSport,
  openAuth,
  closeAuth,
  openWalletModal,
  closeWalletModal,
  openCheckout,
  closeCheckout,
  logoutUser,
} = customerSlice.actions;

export default customerSlice.reducer;
