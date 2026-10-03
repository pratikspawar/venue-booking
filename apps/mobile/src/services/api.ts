import { VenueItem, ResourceItem, SlotCell, BookingTicket, SportItem } from '../types';

// In Android Emulator localhost is 10.0.2.2; on physical device or web use machine IP or 127.0.0.1
const API_BASE_URL = 'http://localhost:8080/api/v1';

class MobileApiService {
  private token: string | null = null;
  private tenantId: number = 1;

  setToken(token: string | null) {
    this.token = token;
  }

  setTenantId(id: number) {
    this.tenantId = id;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Tenant-Id': this.tenantId.toString(),
      'X-Correlation-Id': 'mob-' + Math.random().toString(36).substring(2, 9),
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // --- Auth ---
  async requestOtp(phone: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/otp/request`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ phone }),
      });
      return res.json();
    } catch {
      return { success: true, message: 'OTP sent to ' + phone };
    }
  }

  async verifyOtp(phone: string, otp: string): Promise<{ accessToken: string; user: any }> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/otp/verify`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (data.accessToken) {
        this.setToken(data.accessToken);
      }
      return data;
    } catch {
      // Fallback demo token
      const mockToken = 'mock_jwt_customer_' + Date.now();
      this.setToken(mockToken);
      return {
        accessToken: mockToken,
        user: { id: 101, phone, name: 'Siddharth R.', language: 'en' },
      };
    }
  }

  // --- Sports ---
  async fetchSports(): Promise<SportItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/sports`, { headers: this.getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch sports');
      return res.json();
    } catch {
      return [
        { id: 1, code: 'PLAYSTATION', nameEn: 'PlayStation 5', icon: '🎮' },
        { id: 2, code: 'POOL', nameEn: 'Snooker & Pool', icon: '🎱' },
        { id: 3, code: 'TURF', nameEn: 'Box Turf Football', icon: '⚽' },
        { id: 4, code: 'CARROM', nameEn: 'Carrom Lounge', icon: '🎯' },
        { id: 5, code: 'BADMINTON', nameEn: 'Badminton Court', icon: '🏸' },
        { id: 6, code: 'PICKLEBALL', nameEn: 'Pickleball', icon: '🏓' },
        { id: 7, code: 'VR_GAMING', nameEn: 'VR Gaming Pods', icon: '🥽' },
      ];
    }
  }

  // --- Venues ---
  async fetchVenues(sport?: string): Promise<VenueItem[]> {
    try {
      const url = sport && sport !== 'ALL'
        ? `${API_BASE_URL}/venues?sport=${sport}`
        : `${API_BASE_URL}/venues`;
      const res = await fetch(url, { headers: this.getHeaders() });
      if (!res.ok) throw new Error('API request failed');
      return res.json();
    } catch {
      // Return rich seed data
      return [
        {
          id: 1,
          tenantId: 1,
          name: 'Apex Gaming & Snooker Lounge',
          address: 'Bandra West, Mumbai (Near Linking Road)',
          city: 'Mumbai',
          distanceKm: 0.8,
          rating: 4.9,
          reviewCount: 342,
          sports: ['PLAYSTATION', 'POOL', 'CARROM'],
          startingPricePaise: 25000,
          payAtVenueAllowed: true,
          openTime: '10:00 AM',
          closeTime: '01:00 AM',
          active: true,
        },
        {
          id: 2,
          tenantId: 1,
          name: 'Urban Box Turf & PS5 Arena',
          address: 'Andheri East, Metro Station Gate 2',
          city: 'Mumbai',
          distanceKm: 2.4,
          rating: 4.8,
          reviewCount: 215,
          sports: ['TURF', 'PLAYSTATION'],
          startingPricePaise: 120000,
          payAtVenueAllowed: true,
          openTime: '06:00 AM',
          closeTime: '12:00 AM',
          active: true,
        },
        {
          id: 3,
          tenantId: 2,
          name: 'Cue Masters Billiards & Snooker',
          address: 'FC Road, Shivaji Nagar, Pune',
          city: 'Pune',
          distanceKm: 3.1,
          rating: 4.7,
          reviewCount: 180,
          sports: ['POOL', 'CARROM'],
          startingPricePaise: 20000,
          payAtVenueAllowed: false,
          openTime: '11:00 AM',
          closeTime: '11:30 PM',
          active: true,
        },
      ];
    }
  }

  // --- Resources ---
  async fetchResources(venueId: number): Promise<ResourceItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/venues/${venueId}/resources`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch resources');
      return res.json();
    } catch {
      if (venueId === 1) {
        return [
          { id: 1, venueId: 1, name: 'PlayStation 5 Console #1 (4K OLED)', sport: 'PLAYSTATION', slotMinutes: 60, ratePerHourPaise: 25000, status: 'ACTIVE' },
          { id: 2, venueId: 1, name: 'PlayStation 5 Console #2 (DualSense)', sport: 'PLAYSTATION', slotMinutes: 60, ratePerHourPaise: 25000, status: 'ACTIVE' },
          { id: 3, venueId: 1, name: 'Tournament Pool Table A (8-Ball)', sport: 'POOL', slotMinutes: 60, ratePerHourPaise: 30000, status: 'ACTIVE' },
          { id: 4, venueId: 1, name: 'Carrom Suite Pro #1', sport: 'CARROM', slotMinutes: 60, ratePerHourPaise: 12000, status: 'ACTIVE' },
        ];
      }
      return [
        { id: 5, venueId: 2, name: 'FIFA Standard 5-A-Side Turf', sport: 'TURF', slotMinutes: 60, ratePerHourPaise: 120000, status: 'ACTIVE' },
        { id: 6, venueId: 2, name: 'PlayStation 5 VIP Lounge (Surround)', sport: 'PLAYSTATION', slotMinutes: 60, ratePerHourPaise: 35000, status: 'ACTIVE' },
      ];
    }
  }

  // --- Slot Availability ---
  async fetchAvailability(resourceId: number, dateStr: string): Promise<SlotCell[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/resources/${resourceId}/availability?date=${dateStr}`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch availability');
      return res.json();
    } catch {
      // Dynamic slots generation for today
      return [
        { startUtc: '10:00', label: '10:00 AM', pricePaise: 25000, status: 'BOOKED' },
        { startUtc: '11:00', label: '11:00 AM', pricePaise: 25000, status: 'BOOKED' },
        { startUtc: '12:00', label: '12:00 PM', pricePaise: 25000, status: 'HELD' },
        { startUtc: '13:00', label: '01:00 PM', pricePaise: 25000, status: 'AVAILABLE' },
        { startUtc: '14:00', label: '02:00 PM', pricePaise: 25000, status: 'AVAILABLE' },
        { startUtc: '15:00', label: '03:00 PM', pricePaise: 25000, status: 'AVAILABLE' },
        { startUtc: '16:00', label: '04:00 PM', pricePaise: 25000, status: 'AVAILABLE' },
        { startUtc: '17:00', label: '05:00 PM', pricePaise: 30000, status: 'AVAILABLE' }, // Peak hour
        { startUtc: '18:00', label: '06:00 PM', pricePaise: 30000, status: 'AVAILABLE' },
        { startUtc: '19:00', label: '07:00 PM', pricePaise: 30000, status: 'AVAILABLE' },
        { startUtc: '20:00', label: '08:00 PM', pricePaise: 30000, status: 'AVAILABLE' },
        { startUtc: '21:00', label: '09:00 PM', pricePaise: 30000, status: 'AVAILABLE' },
        { startUtc: '22:00', label: '10:00 PM', pricePaise: 25000, status: 'AVAILABLE' },
      ];
    }
  }

  // --- Create Booking Hold ---
  async createBooking(payload: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });
      return res.json();
    } catch {
      return {
        id: Math.floor(1000 + Math.random() * 9000),
        status: payload.paymentMode === 'PAY_AT_VENUE' ? 'CONFIRMED' : 'HELD',
        amountPaise: 25000,
        holdExpiresAt: new Date(Date.now() + 8 * 60 * 1000).toISOString(),
      };
    }
  }
}

export const mobileApi = new MobileApiService();
