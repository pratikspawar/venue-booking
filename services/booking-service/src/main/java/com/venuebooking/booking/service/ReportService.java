package com.venuebooking.booking.service;

import com.venuebooking.booking.dto.*;
import com.venuebooking.booking.entity.Booking;
import com.venuebooking.booking.entity.BookingItem;
import com.venuebooking.booking.entity.PlaySession;
import com.venuebooking.booking.repository.BookingItemRepository;
import com.venuebooking.booking.repository.BookingRepository;
import com.venuebooking.booking.repository.PlaySessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final BookingRepository bookingRepository;
    private final BookingItemRepository bookingItemRepository;
    private final PlaySessionRepository playSessionRepository;

    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Kolkata");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("EEE, MMM d");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Transactional(readOnly = true)
    public ComprehensiveReportResponseDto generateReport(Long tenantId, Long venueId, Instant periodStart, Instant periodEnd) {
        if (periodStart == null) {
            periodStart = Instant.now().minus(Duration.ofDays(7));
        }
        if (periodEnd == null) {
            periodEnd = Instant.now().plus(Duration.ofDays(1));
        }

        List<Booking> bookings = (venueId != null)
                ? bookingRepository.findByTenantIdAndVenueIdAndStartUtcBetweenOrderByStartUtcAsc(tenantId, venueId, periodStart, periodEnd)
                : bookingRepository.findByTenantIdAndStartUtcBetweenOrderByStartUtcAsc(tenantId, periodStart, periodEnd);

        List<BookingItem> items = bookingItemRepository.findByTenantIdAndCreatedAtBetween(tenantId, periodStart, periodEnd);
        List<PlaySession> sessions = playSessionRepository.findByTenantIdAndStartedAtBetween(tenantId, periodStart, periodEnd);
        Map<Long, PlaySession> sessionsByBookingId = sessions.stream()
                .filter(s -> s.getBookingId() != null)
                .collect(Collectors.toMap(PlaySession::getBookingId, s -> s, (s1, s2) -> s1));

        // 1. High-level Summary Metrics
        long totalGrossRevenuePaise = 0L;
        long cashCollectionPaise = 0L;
        long upiCollectionPaise = 0L;
        long onlineCollectionPaise = 0L;

        int totalCount = bookings.size();
        int completedCount = 0;
        int activeCount = 0;
        int cancelledCount = 0;
        int noShowCount = 0;
        long totalBilledMinutes = 0L;
        int ratedSessionsCount = 0;

        for (Booking b : bookings) {
            switch (b.getStatus()) {
                case COMPLETED -> completedCount++;
                case IN_PROGRESS -> activeCount++;
                case CANCELLED -> cancelledCount++;
                case NO_SHOW -> noShowCount++;
                default -> {}
            }

            if (b.getStatus() == Booking.Status.COMPLETED || b.getStatus() == Booking.Status.IN_PROGRESS) {
                long amount = (b.getPaidPaise() != null && b.getPaidPaise() > 0) ? b.getPaidPaise() : (b.getAmountPaise() != null ? b.getAmountPaise() : 0L);
                totalGrossRevenuePaise += amount;

                if (b.getPaymentMode() == Booking.PaymentMode.PAY_AT_VENUE) {
                    cashCollectionPaise += amount;
                } else if (b.getPaymentMode() == Booking.PaymentMode.MIXED) {
                    upiCollectionPaise += amount;
                } else {
                    onlineCollectionPaise += amount;
                }

                if (b.getStartUtc() != null && b.getEndUtc() != null) {
                    long mins = Math.max(1, Duration.between(b.getStartUtc(), b.getEndUtc()).toMinutes());
                    totalBilledMinutes += mins;
                    ratedSessionsCount++;
                }
            }
        }

        // Canteen & Equipment F&B item revenue
        long canteenRevenuePaise = 0L;
        long equipmentRentalRevenuePaise = 0L;
        for (BookingItem item : items) {
            long itemTotal = item.getTotalPaise() != null ? item.getTotalPaise() : 0L;
            canteenRevenuePaise += itemTotal;
        }

        long gameTimeRevenuePaise = Math.max(0L, totalGrossRevenuePaise - (canteenRevenuePaise + equipmentRentalRevenuePaise));
        int avgSessionMinutes = ratedSessionsCount > 0 ? (int) (totalBilledMinutes / ratedSessionsCount) : 0;

        // 2. Dynamic Sport Revenue Breakdown (Zero Hardcoding)
        Map<String, List<Booking>> bookingsBySport = new HashMap<>();
        Map<String, String> sportNameMap = new HashMap<>();

        for (Booking b : bookings) {
            String sportCode = "OTHER";
            String sportName = "General / Other";
            if (b.getResource() != null && b.getResource().getSport() != null) {
                sportCode = b.getResource().getSport().getCode();
                sportName = b.getResource().getSport().getNameEn();
            }
            bookingsBySport.computeIfAbsent(sportCode, k -> new ArrayList<>()).add(b);
            sportNameMap.put(sportCode, sportName);
        }

        List<SportRevenueBreakdownDto> sportBreakdown = new ArrayList<>();
        long effectiveTotalRevenue = Math.max(1L, totalGrossRevenuePaise);
        for (Map.Entry<String, List<Booking>> entry : bookingsBySport.entrySet()) {
            String sCode = entry.getKey();
            List<Booking> sBookings = entry.getValue();
            long sRevenue = 0L;
            for (Booking sb : sBookings) {
                if (sb.getStatus() == Booking.Status.COMPLETED || sb.getStatus() == Booking.Status.IN_PROGRESS) {
                    sRevenue += (sb.getPaidPaise() != null && sb.getPaidPaise() > 0) ? sb.getPaidPaise() : (sb.getAmountPaise() != null ? sb.getAmountPaise() : 0L);
                }
            }
            double pct = Math.round(((double) sRevenue / effectiveTotalRevenue) * 1000.0) / 10.0;
            sportBreakdown.add(new SportRevenueBreakdownDto(
                    sCode,
                    sportNameMap.getOrDefault(sCode, sCode),
                    sRevenue,
                    sBookings.size(),
                    pct
            ));
        }
        sportBreakdown.sort((a, b) -> Long.compare(b.revenuePaise(), a.revenuePaise()));

        // 3. Peak Hour Analysis (24-hour distribution in IST)
        int[] hourlyCount = new int[24];
        long[] hourlyRevenue = new long[24];
        for (Booking b : bookings) {
            if (b.getStartUtc() != null) {
                ZonedDateTime zdt = b.getStartUtc().atZone(zoneFor(b));
                int h = zdt.getHour();
                hourlyCount[h]++;
                if (b.getStatus() == Booking.Status.COMPLETED || b.getStatus() == Booking.Status.IN_PROGRESS) {
                    hourlyRevenue[h] += (b.getPaidPaise() != null && sbAmount(b) > 0) ? sbAmount(b) : 0L;
                }
            }
        }

        int maxHourlyCount = 1;
        for (int c : hourlyCount) {
            if (c > maxHourlyCount) maxHourlyCount = c;
        }

        List<PeakHourAnalysisDto> peakHours = new ArrayList<>();
        for (int h = 0; h < 24; h++) {
            int nextH = (h + 1) % 24;
            String label = String.format("%02d:00 - %02d:00", h, nextH);
            int count = hourlyCount[h];
            String level = "OFF_PEAK";
            if (count >= maxHourlyCount * 0.7 && count > 0) {
                level = "PEAK";
            } else if (count >= maxHourlyCount * 0.35 && count > 0) {
                level = "MODERATE";
            }
            peakHours.add(new PeakHourAnalysisDto(h, label, count, hourlyRevenue[h], level));
        }

        // 4. Resource Utilization Breakdown
        Map<Long, List<Booking>> bookingsByResource = bookings.stream()
                .filter(b -> b.getResourceId() != null)
                .collect(Collectors.groupingBy(Booking::getResourceId));

        List<ResourceUtilizationDto> resourceUtilizations = new ArrayList<>();
        long allAvailableMinutes = 0L;
        long allBookedMinutes = 0L;
        for (Map.Entry<Long, List<Booking>> entry : bookingsByResource.entrySet()) {
            Long rId = entry.getKey();
            List<Booking> rBookings = entry.getValue();
            String rName = "Resource #" + rId;
            String sCode = "UNKNOWN";
            String sName = "General";
            int bookedMins = 0;
            long rRev = 0L;

            for (Booking rb : rBookings) {
                if (rb.getResource() != null) {
                    rName = rb.getResource().getName();
                    if (rb.getResource().getSport() != null) {
                        sCode = rb.getResource().getSport().getCode();
                        sName = rb.getResource().getSport().getNameEn();
                    }
                }
                if (rb.getStatus() == Booking.Status.COMPLETED || rb.getStatus() == Booking.Status.IN_PROGRESS) {
                    if (rb.getStartUtc() != null && rb.getEndUtc() != null) {
                        bookedMins += Math.max(15, (int) Duration.between(rb.getStartUtc(), rb.getEndUtc()).toMinutes());
                    }
                    rRev += sbAmount(rb);
                }
            }

            long availableMins = rBookings.isEmpty() || rBookings.get(0).getVenue() == null ? 0L
                    : availableMinutes(rBookings.get(0).getVenue(), periodStart, periodEnd);
            double utilPct = availableMins == 0L ? 0.0
                    : Math.round(((double) bookedMins / availableMins) * 1000.0) / 10.0;
            allAvailableMinutes += availableMins;
            allBookedMinutes += bookedMins;

            resourceUtilizations.add(new ResourceUtilizationDto(
                    rId,
                    rName,
                    sCode,
                    sName,
                    bookedMins,
                    rRev,
                    utilPct
            ));
        }
        resourceUtilizations.sort((a, b) -> Double.compare(b.utilizationPercent(), a.utilizationPercent()));

        // 5. Audited Staff Collections
        List<StaffCollectionDto> staffCollections = computeStaffCollections(bookings, sessionsByBookingId);

        double overallUtilizationPercent = allAvailableMinutes == 0L ? 0.0
                : Math.round(((double) allBookedMinutes / allAvailableMinutes) * 1000.0) / 10.0;
        ReportSummaryDto summaryDto = new ReportSummaryDto(
                totalGrossRevenuePaise, gameTimeRevenuePaise, canteenRevenuePaise, equipmentRentalRevenuePaise,
                totalCount, completedCount, activeCount, cancelledCount, noShowCount, overallUtilizationPercent,
                avgSessionMinutes, cashCollectionPaise, upiCollectionPaise, onlineCollectionPaise);

        return new ComprehensiveReportResponseDto(
                summaryDto,
                sportBreakdown,
                peakHours,
                resourceUtilizations,
                staffCollections,
                periodStart,
                periodEnd
        );
    }

    @Transactional(readOnly = true)
    public ComprehensiveEarningsResponseDto getComprehensiveEarnings(Long tenantId, Long venueId, Instant periodStart, Instant periodEnd) {
        if (periodStart == null) {
            periodStart = Instant.now().minus(Duration.ofDays(7));
        }
        if (periodEnd == null) {
            periodEnd = Instant.now().plus(Duration.ofDays(1));
        }

        List<Booking> bookings = (venueId != null)
                ? bookingRepository.findByTenantIdAndVenueIdAndStartUtcBetweenOrderByStartUtcAsc(tenantId, venueId, periodStart, periodEnd)
                : bookingRepository.findByTenantIdAndStartUtcBetweenOrderByStartUtcAsc(tenantId, periodStart, periodEnd);

        List<BookingItem> items = bookingItemRepository.findByTenantIdAndCreatedAtBetween(tenantId, periodStart, periodEnd);
        List<PlaySession> sessions = playSessionRepository.findByTenantIdAndStartedAtBetween(tenantId, periodStart, periodEnd);
        Map<Long, PlaySession> sessionsByBookingId = sessions.stream()
                .filter(s -> s.getBookingId() != null)
                .collect(Collectors.toMap(PlaySession::getBookingId, s -> s, (s1, s2) -> s1));

        Map<Long, Long> canteenByBooking = items.stream()
                .filter(i -> i.getBookingId() != null)
                .collect(Collectors.groupingBy(BookingItem::getBookingId, Collectors.summingLong(i -> i.getTotalPaise() != null ? i.getTotalPaise() : 0L)));

        long totalGrossEarningsPaise = 0L;
        long totalDiscountsPaise = 0L;
        long totalRefundsPaise = 0L;
        long cashInDrawerPaise = 0L;
        long counterUpiPaise = 0L;
        long onlineGatewayPaise = 0L;
        long walletSettledPaise = 0L;
        int totalPaidTransactions = 0;

        int cashCount = 0, upiCount = 0, onlineCount = 0, walletCount = 0;

        Map<LocalDate, DailyBucket> dailyMap = new TreeMap<>();

        for (Booking b : bookings) {
            ZoneId zone = zoneFor(b);
            LocalDate date = b.getStartUtc() != null ? b.getStartUtc().atZone(zone).toLocalDate() : LocalDate.now();
            DailyBucket bucket = dailyMap.computeIfAbsent(date, k -> new DailyBucket(k));
            bucket.totalBookingsCount++;

            if (b.getStatus() == Booking.Status.CANCELLED) {
                long ref = (b.getPaidPaise() != null && b.getPaidPaise() > 0) ? b.getPaidPaise() : 0L;
                totalRefundsPaise += ref;
                bucket.refundPaise += ref;
                continue;
            }

            if (b.getStatus() == Booking.Status.COMPLETED || b.getStatus() == Booking.Status.IN_PROGRESS) {
                long amt = sbAmount(b);
                long discount = b.getDiscountPaise() != null ? b.getDiscountPaise() : 0L;
                long bookingCanteen = canteenByBooking.getOrDefault(b.getId(), 0L);
                long gameTime = Math.max(0L, amt - bookingCanteen);

                totalGrossEarningsPaise += amt;
                totalDiscountsPaise += discount;
                totalPaidTransactions++;
                bucket.completedCount++;

                bucket.grossRevenuePaise += amt;
                bucket.gameTimeRevenuePaise += gameTime;
                bucket.canteenRevenuePaise += bookingCanteen;
                bucket.discountPaise += discount;

                switch (b.getPaymentMode()) {
                    case PAY_AT_VENUE -> {
                        cashInDrawerPaise += amt;
                        cashCount++;
                        bucket.cashPaise += amt;
                    }
                    case MIXED -> {
                        counterUpiPaise += amt;
                        upiCount++;
                        bucket.upiPaise += amt;
                    }
                    case WALLET -> {
                        walletSettledPaise += amt;
                        walletCount++;
                        bucket.onlinePaise += amt;
                    }
                    default -> {
                        onlineGatewayPaise += amt;
                        onlineCount++;
                        bucket.onlinePaise += amt;
                    }
                }
            }
        }

        long canteenRevenuePaise = items.stream().mapToLong(i -> i.getTotalPaise() != null ? i.getTotalPaise() : 0L).sum();
        long equipmentRentalRevenuePaise = 0L;
        long gameTimeEarningsPaise = Math.max(0L, totalGrossEarningsPaise - canteenRevenuePaise);
        long netEarningsPaise = Math.max(0L, totalGrossEarningsPaise - totalDiscountsPaise - totalRefundsPaise);
        // Standard GST @ 18%
        long estimatedGstPaise = Math.round(netEarningsPaise * 0.18 / 1.18);
        long avgOrderPaise = totalPaidTransactions > 0 ? (totalGrossEarningsPaise / totalPaidTransactions) : 0L;
        double refundRate = bookings.isEmpty() ? 0.0 : Math.round(((double) totalRefundsPaise / Math.max(1L, totalGrossEarningsPaise)) * 1000.0) / 10.0;

        EarningsFinancialSummaryDto summary = new EarningsFinancialSummaryDto(
                totalGrossEarningsPaise,
                netEarningsPaise,
                gameTimeEarningsPaise,
                canteenRevenuePaise,
                equipmentRentalRevenuePaise,
                totalDiscountsPaise,
                totalRefundsPaise,
                estimatedGstPaise,
                cashInDrawerPaise,
                counterUpiPaise,
                onlineGatewayPaise,
                walletSettledPaise,
                totalPaidTransactions,
                avgOrderPaise,
                refundRate
        );

        // Daily trend list
        List<DailyEarningsDto> dailyTrends = new ArrayList<>();
        for (Map.Entry<LocalDate, DailyBucket> entry : dailyMap.entrySet()) {
            DailyBucket db = entry.getValue();
            long dbNet = Math.max(0L, db.grossRevenuePaise - db.discountPaise - db.refundPaise);
            dailyTrends.add(new DailyEarningsDto(
                    db.date,
                    db.date.format(DATE_FORMATTER),
                    db.grossRevenuePaise,
                    db.gameTimeRevenuePaise,
                    db.canteenRevenuePaise,
                    0L,
                    db.cashPaise,
                    db.upiPaise,
                    db.onlinePaise,
                    db.discountPaise,
                    db.refundPaise,
                    dbNet,
                    db.totalBookingsCount,
                    db.completedCount
            ));
        }

        // Payment method breakdown
        List<PaymentMethodEarningsDto> paymentBreakdown = new ArrayList<>();
        long effectiveGross = Math.max(1L, totalGrossEarningsPaise);
        paymentBreakdown.add(new PaymentMethodEarningsDto("CASH", "Cash at Desk", cashInDrawerPaise, cashCount,
                Math.round(((double) cashInDrawerPaise / effectiveGross) * 1000.0) / 10.0));
        paymentBreakdown.add(new PaymentMethodEarningsDto("UPI_COUNTER", "Counter UPI QR", counterUpiPaise, upiCount,
                Math.round(((double) counterUpiPaise / effectiveGross) * 1000.0) / 10.0));
        paymentBreakdown.add(new PaymentMethodEarningsDto("ONLINE", "Online Gateway (Razorpay)", onlineGatewayPaise, onlineCount,
                Math.round(((double) onlineGatewayPaise / effectiveGross) * 1000.0) / 10.0));
        if (walletSettledPaise > 0) {
            paymentBreakdown.add(new PaymentMethodEarningsDto("WALLET", "Customer Wallet", walletSettledPaise, walletCount,
                    Math.round(((double) walletSettledPaise / effectiveGross) * 1000.0) / 10.0));
        }

        // Sport breakdown
        List<SportRevenueBreakdownDto> sportBreakdown = computeSportBreakdown(bookings, totalGrossEarningsPaise);

        // Staff collections
        List<StaffCollectionDto> staffCollections = computeStaffCollections(bookings, sessionsByBookingId);

        // Recent audited earnings ledger
        List<EarningsLedgerEntryDto> recentTransactions = new ArrayList<>();
        List<Booking> reversed = new ArrayList<>(bookings);
        Collections.reverse(reversed);

        for (Booking b : reversed.stream().limit(50).toList()) {
            long amt = sbAmount(b);
            long canteen = canteenByBooking.getOrDefault(b.getId(), 0L);
            long gameTime = Math.max(0L, amt - canteen);
            long discount = b.getDiscountPaise() != null ? b.getDiscountPaise() : 0L;
            long tax = b.getTaxPaise() != null ? b.getTaxPaise() : Math.round(amt * 0.18 / 1.18);
            long net = Math.max(0L, amt - discount);

            String custName = b.getCustomer() != null ? b.getCustomer().getName() : (b.getWalkinName() != null ? b.getWalkinName() : "Walk-in Guest");
            String custPhone = b.getCustomer() != null ? b.getCustomer().getPhone() : (b.getWalkinPhone() != null ? b.getWalkinPhone() : "-");
            String resName = b.getResource() != null ? b.getResource().getName() : "Resource #" + b.getResourceId();
            String sportName = (b.getResource() != null && b.getResource().getSport() != null) ? b.getResource().getSport().getNameEn() : "General";
            String formattedTime = b.getStartUtc() != null ? b.getStartUtc().atZone(zoneFor(b)).format(TIME_FORMATTER) : "N/A";

            recentTransactions.add(new EarningsLedgerEntryDto(
                    b.getId(),
                    b.getStartUtc(),
                    formattedTime,
                    custName,
                    custPhone,
                    resName,
                    sportName,
                    b.getPaymentMode().name(),
                    gameTime,
                    canteen,
                    discount,
                    tax,
                    amt,
                    net,
                    b.getStatus().name(),
                    b.getSource().name()
            ));
        }

        return new ComprehensiveEarningsResponseDto(
                summary,
                dailyTrends,
                paymentBreakdown,
                sportBreakdown,
                staffCollections,
                recentTransactions,
                periodStart,
                periodEnd
        );
    }

    private List<SportRevenueBreakdownDto> computeSportBreakdown(List<Booking> bookings, long totalGross) {
        Map<String, List<Booking>> bookingsBySport = new HashMap<>();
        Map<String, String> sportNameMap = new HashMap<>();

        for (Booking b : bookings) {
            String sportCode = "OTHER";
            String sportName = "General / Other";
            if (b.getResource() != null && b.getResource().getSport() != null) {
                sportCode = b.getResource().getSport().getCode();
                sportName = b.getResource().getSport().getNameEn();
            }
            bookingsBySport.computeIfAbsent(sportCode, k -> new ArrayList<>()).add(b);
            sportNameMap.put(sportCode, sportName);
        }

        List<SportRevenueBreakdownDto> sportBreakdown = new ArrayList<>();
        long effectiveTotalRevenue = Math.max(1L, totalGross);
        for (Map.Entry<String, List<Booking>> entry : bookingsBySport.entrySet()) {
            String sCode = entry.getKey();
            List<Booking> sBookings = entry.getValue();
            long sRevenue = 0L;
            for (Booking sb : sBookings) {
                if (sb.getStatus() == Booking.Status.COMPLETED || sb.getStatus() == Booking.Status.IN_PROGRESS) {
                    sRevenue += sbAmount(sb);
                }
            }
            double pct = Math.round(((double) sRevenue / effectiveTotalRevenue) * 1000.0) / 10.0;
            sportBreakdown.add(new SportRevenueBreakdownDto(
                    sCode,
                    sportNameMap.getOrDefault(sCode, sCode),
                    sRevenue,
                    sBookings.size(),
                    pct
            ));
        }
        sportBreakdown.sort((a, b) -> Long.compare(b.revenuePaise(), a.revenuePaise()));
        return sportBreakdown;
    }

    private List<StaffCollectionDto> computeStaffCollections(List<Booking> bookings, Map<Long, PlaySession> sessionsByBookingId) {
        Map<Long, StaffStats> staffMap = new LinkedHashMap<>();

        for (Booking b : bookings) {
            if (b.getStatus() == Booking.Status.COMPLETED || b.getStatus() == Booking.Status.IN_PROGRESS) {
                long amt = sbAmount(b);
                Long staffId = 1L;
                PlaySession session = sessionsByBookingId.get(b.getId());
                if (session != null) {
                    if (session.getEndedBy() != null) {
                        staffId = session.getEndedBy();
                    } else if (session.getStartedBy() != null) {
                        staffId = session.getStartedBy();
                    }
                }

                String staffName = (session != null && (session.getEndedBy() != null || session.getStartedBy() != null))
                        ? "Staff #" + staffId
                        : "Front Desk Cashier";

                StaffStats stats = staffMap.computeIfAbsent(staffId, k -> new StaffStats(k, staffName));
                stats.sessionsHandled++;
                if (b.getPaymentMode() == Booking.PaymentMode.PAY_AT_VENUE) {
                    stats.cashCollectedPaise += amt;
                } else if (b.getPaymentMode() == Booking.PaymentMode.MIXED) {
                    stats.upiCollectedPaise += amt;
                }
                stats.totalCollectedPaise += amt;
            }
        }

        if (staffMap.isEmpty()) {
            staffMap.put(1L, new StaffStats(1L, "Shift Staff Lead"));
        }

        List<StaffCollectionDto> result = new ArrayList<>();
        for (StaffStats s : staffMap.values()) {
            result.add(new StaffCollectionDto(
                    s.staffUserId,
                    s.staffName,
                    s.sessionsHandled,
                    s.cashCollectedPaise,
                    s.upiCollectedPaise,
                    s.totalCollectedPaise
            ));
        }
        result.sort((a, b) -> Long.compare(b.totalCollectedPaise(), a.totalCollectedPaise()));
        return result;
    }

    private long sbAmount(Booking b) {
        if (b.getPaidPaise() != null && b.getPaidPaise() > 0) return b.getPaidPaise();
        if (b.getAmountPaise() != null) return b.getAmountPaise();
        return 0L;
    }

    private ZoneId zoneFor(Booking booking) {
        try {
            String timezone = booking.getVenue() != null ? booking.getVenue().getTimezone() : null;
            return timezone == null || timezone.isBlank() ? DEFAULT_ZONE : ZoneId.of(timezone);
        } catch (RuntimeException ignored) {
            return DEFAULT_ZONE;
        }
    }

    private long availableMinutes(com.venuebooking.catalog.entity.Venue venue, Instant start, Instant end) {
        if (venue.getOperatingHours() == null || venue.getOperatingHours().isEmpty()) return 0L;
        ZoneId zone = zoneForVenue(venue.getTimezone());
        LocalDate first = start.atZone(zone).toLocalDate();
        LocalDate last = end.atZone(zone).toLocalDate();
        long minutes = 0L;
        for (LocalDate day = first; !day.isAfter(last); day = day.plusDays(1)) {
            int dayOfWeek = day.getDayOfWeek().getValue();
            for (com.venuebooking.catalog.entity.VenueHours hours : venue.getOperatingHours()) {
                if (hours.getDayOfWeek() != dayOfWeek) continue;
                LocalDate closeDate = Boolean.TRUE.equals(hours.getClosesNextDay()) ? day.plusDays(1) : day;
                if (!closeDate.isAfter(day) && !hours.getCloseTime().isAfter(hours.getOpenTime())) closeDate = day.plusDays(1);
                Instant open = day.atTime(hours.getOpenTime()).atZone(zone).toInstant();
                Instant close = closeDate.atTime(hours.getCloseTime()).atZone(zone).toInstant();
                Instant clippedStart = open.isBefore(start) ? start : open;
                Instant clippedEnd = close.isAfter(end) ? end : close;
                if (clippedEnd.isAfter(clippedStart)) minutes += Duration.between(clippedStart, clippedEnd).toMinutes();
            }
        }
        return minutes;
    }

    private ZoneId zoneForVenue(String timezone) {
        try { return timezone == null || timezone.isBlank() ? DEFAULT_ZONE : ZoneId.of(timezone); }
        catch (RuntimeException ignored) { return DEFAULT_ZONE; }
    }

    @Transactional(readOnly = true)
    public String generateCsvExport(Long tenantId, Long venueId, Instant periodStart, Instant periodEnd) {
        if (periodStart == null) periodStart = Instant.now().minus(Duration.ofDays(7));
        if (periodEnd == null) periodEnd = Instant.now().plus(Duration.ofDays(1));

        List<Booking> bookings = (venueId != null)
                ? bookingRepository.findByTenantIdAndVenueIdAndStartUtcBetweenOrderByStartUtcAsc(tenantId, venueId, periodStart, periodEnd)
                : bookingRepository.findByTenantIdAndStartUtcBetweenOrderByStartUtcAsc(tenantId, periodStart, periodEnd);

        List<BookingItem> items = bookingItemRepository.findByTenantIdAndCreatedAtBetween(tenantId, periodStart, periodEnd);
        Map<Long, Long> canteenByBooking = items.stream()
                .filter(i -> i.getBookingId() != null)
                .collect(Collectors.groupingBy(BookingItem::getBookingId, Collectors.summingLong(i -> i.getTotalPaise() != null ? i.getTotalPaise() : 0L)));

        StringBuilder sb = new StringBuilder();
        sb.append("Booking ID,Date & Time (IST),Resource,Sport,Customer Name,Phone,Source,Status,Payment Mode,Game Time (INR),Canteen (INR),Discount (INR),GST (INR),Gross Amount (INR),Net Earnings (INR)\n");

        for (Booking b : bookings) {
            String localTime = b.getStartUtc() != null
                    ? DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(zoneFor(b)).format(b.getStartUtc()) : "N/A";
            String resName = b.getResource() != null ? b.getResource().getName().replace(",", " ") : "Resource #" + b.getResourceId();
            String sport = (b.getResource() != null && b.getResource().getSport() != null) ? b.getResource().getSport().getNameEn() : "N/A";
            String custName = b.getCustomer() != null ? b.getCustomer().getName() : (b.getWalkinName() != null ? b.getWalkinName() : "Walk-in Guest");
            custName = custName.replace(",", " ");
            String phone = b.getCustomer() != null ? b.getCustomer().getPhone() : (b.getWalkinPhone() != null ? b.getWalkinPhone() : "-");

            long amt = sbAmount(b);
            long canteen = canteenByBooking.getOrDefault(b.getId(), 0L);
            long gameTime = Math.max(0L, amt - canteen);
            long discount = b.getDiscountPaise() != null ? b.getDiscountPaise() : 0L;
            long tax = b.getTaxPaise() != null ? b.getTaxPaise() : Math.round(amt * 0.18 / 1.18);
            long net = Math.max(0L, amt - discount);

            sb.append(String.format("%d,\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",%s,%s,%s,%.2f,%.2f,%.2f,%.2f,%.2f,%.2f\n",
                    b.getId(),
                    localTime,
                    resName,
                    sport,
                    custName,
                    phone,
                    b.getSource(),
                    b.getStatus(),
                    b.getPaymentMode(),
                    gameTime / 100.0,
                    canteen / 100.0,
                    discount / 100.0,
                    tax / 100.0,
                    amt / 100.0,
                    net / 100.0
            ));
        }

        return sb.toString();
    }

    private static class DailyBucket {
        final LocalDate date;
        long grossRevenuePaise = 0L;
        long gameTimeRevenuePaise = 0L;
        long canteenRevenuePaise = 0L;
        long cashPaise = 0L;
        long upiPaise = 0L;
        long onlinePaise = 0L;
        long discountPaise = 0L;
        long refundPaise = 0L;
        int totalBookingsCount = 0;
        int completedCount = 0;

        DailyBucket(LocalDate date) {
            this.date = date;
        }
    }

    private static class StaffStats {
        final Long staffUserId;
        final String staffName;
        int sessionsHandled = 0;
        long cashCollectedPaise = 0L;
        long upiCollectedPaise = 0L;
        long totalCollectedPaise = 0L;

        StaffStats(Long staffUserId, String staffName) {
            this.staffUserId = staffUserId;
            this.staffName = staffName;
        }
    }
}
