package com.venuebooking.catalog;

import com.venuebooking.catalog.entity.PricingRule;
import com.venuebooking.catalog.entity.Resource;
import com.venuebooking.catalog.repository.PricingRuleRepository;
import com.venuebooking.catalog.service.PricingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PricingServiceTest {

    @Mock
    private PricingRuleRepository pricingRuleRepository;

    private PricingService pricingService;

    @BeforeEach
    void setUp() {
        pricingService = new PricingService(pricingRuleRepository);
    }

    @Test
    @DisplayName("Should pick WEEKEND rule over ANY on a Saturday")
    void testResolveBestRule_WeekendPreference() {
        PricingRule baseAny = PricingRule.builder()
                .id(1L)
                .dayType(PricingRule.DayType.ANY)
                .startTime(LocalTime.of(0, 0))
                .endTime(LocalTime.of(23, 59))
                .pricePerSlotPaise(20000L) // ₹200
                .priority(0)
                .build();

        PricingRule weekendSpecial = PricingRule.builder()
                .id(2L)
                .dayType(PricingRule.DayType.WEEKEND)
                .startTime(LocalTime.of(0, 0))
                .endTime(LocalTime.of(23, 59))
                .pricePerSlotPaise(25000L) // ₹250
                .priority(0)
                .build();

        LocalDate saturday = LocalDate.of(2026, 10, 3); // Oct 3, 2026 is Saturday
        PricingRule selected = pricingService.resolveBestRule(
                List.of(baseAny, weekendSpecial),
                saturday,
                LocalTime.of(15, 0)
        );

        assertEquals(2L, selected.getId());
        assertEquals(25000L, selected.getPricePerSlotPaise());
    }

    @Test
    @DisplayName("Should pick narrow peak hours rule over all-day rule")
    void testResolveBestRule_PeakHoursWindow() {
        PricingRule allDay = PricingRule.builder()
                .id(1L)
                .dayType(PricingRule.DayType.ANY)
                .startTime(LocalTime.of(0, 0))
                .endTime(LocalTime.of(23, 59))
                .pricePerSlotPaise(20000L) // ₹200
                .priority(0)
                .build();

        PricingRule peakEvening = PricingRule.builder()
                .id(2L)
                .dayType(PricingRule.DayType.ANY)
                .startTime(LocalTime.of(18, 0))
                .endTime(LocalTime.of(22, 0))
                .pricePerSlotPaise(30000L) // ₹300 peak
                .priority(0) // same priority, but narrower window
                .build();

        LocalDate weekday = LocalDate.of(2026, 10, 5); // Monday
        PricingRule selected = pricingService.resolveBestRule(
                List.of(allDay, peakEvening),
                weekday,
                LocalTime.of(19, 30)
        );

        assertEquals(2L, selected.getId());
        assertEquals(30000L, selected.getPricePerSlotPaise());
    }

    @Test
    @DisplayName("Should correctly bill time-played session with 5-minute rounding and minimum charge")
    void testCalculateTimePlayedAmount() {
        PricingRule ps5Rule = PricingRule.builder()
                .id(10L)
                .pricePerHourPaise(30000L) // ₹300/hr = ₹5/min
                .minChargeMinutes(30)      // Minimum 30 mins
                .roundingMinutes(5)        // Round up to 5 mins
                .build();

        Instant start = Instant.parse("2026-10-03T10:00:00Z");

        // Case A: 48 minutes elapsed -> rounded up to 50 minutes (₹5/min * 50 = ₹250 = 25000 paise)
        Instant end48Mins = Instant.parse("2026-10-03T10:48:00Z");
        long amountA = pricingService.calculateTimePlayedAmount(ps5Rule, start, end48Mins);
        assertEquals(25000L, amountA);

        // Case B: 12 minutes elapsed -> below 30 min minimum charge -> billed 30 mins (30 * ₹5 = ₹150 = 15000 paise)
        Instant end12Mins = Instant.parse("2026-10-03T10:12:00Z");
        long amountB = pricingService.calculateTimePlayedAmount(ps5Rule, start, end12Mins);
        assertEquals(15000L, amountB);
    }

    @Test
    @DisplayName("Should quote fixed slot booking for multiple cells")
    void testQuoteFixedSlots() {
        Resource turf = Resource.builder()
                .id(50L)
                .slotMinutes(60)
                .billingMode(Resource.BillingMode.FIXED_SLOT)
                .build();

        PricingRule rule = PricingRule.builder()
                .id(1L)
                .resourceId(50L)
                .dayType(PricingRule.DayType.ANY)
                .startTime(LocalTime.of(0, 0))
                .endTime(LocalTime.of(23, 59))
                .pricePerSlotPaise(120000L) // ₹1,200 per 1-hour slot
                .priority(0)
                .build();

        when(pricingRuleRepository.findByResourceIdOrderByPriorityDesc(50L)).thenReturn(List.of(rule));

        List<Instant> cells = List.of(
                Instant.parse("2026-10-03T10:00:00Z"),
                Instant.parse("2026-10-03T11:00:00Z")
        );

        PricingService.PriceQuote quote = pricingService.quoteFixedSlots(turf, cells, ZoneId.of("Asia/Kolkata"));

        assertNotNull(quote);
        assertEquals(240000L, quote.getTotalPaise()); // 2 slots * ₹1,200 = ₹2,400 = 240,000 paise
        assertEquals(120000L, quote.getPerSlotPaise());
    }
}
