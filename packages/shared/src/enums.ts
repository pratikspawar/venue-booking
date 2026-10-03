export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TRIAL = 'TRIAL'
}

export enum UserRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF'
}

export enum PayAtVenueMode {
  OFF = 'OFF',
  NO_ADVANCE = 'NO_ADVANCE',
  ADVANCE = 'ADVANCE'
}

export enum BillingMode {
  FIXED_SLOT = 'FIXED_SLOT',
  TIME_PLAYED = 'TIME_PLAYED'
}

export enum ResourceStatus {
  ACTIVE = 'ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  INACTIVE = 'INACTIVE'
}

export enum DayType {
  ANY = 'ANY',
  WEEKDAY = 'WEEKDAY',
  WEEKEND = 'WEEKEND'
}

export enum BookingSource {
  APP = 'APP',
  WALKIN = 'WALKIN'
}

export enum BookingStatus {
  HELD = 'HELD',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  EXPIRED = 'EXPIRED'
}

export enum PaymentMode {
  ONLINE = 'ONLINE',
  PAY_AT_VENUE = 'PAY_AT_VENUE',
  WALLET = 'WALLET',
  MIXED = 'MIXED'
}

export enum PaymentMethod {
  ONLINE = 'ONLINE',
  CASH = 'CASH',
  UPI_COUNTER = 'UPI_COUNTER',
  WALLET = 'WALLET'
}

export enum PaymentStatus {
  CREATED = 'CREATED',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}
