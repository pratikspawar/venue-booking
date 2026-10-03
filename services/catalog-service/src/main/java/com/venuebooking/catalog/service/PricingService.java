package com.venuebooking.catalog.service;

import com.venuebooking.catalog.entity.PricingRule;
import com.venuebooking.catalog.entity.Resource;
import com.venuebooking.catalog.repository.PricingRuleRepository;
import com.venuebooking.common.BusinessException;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PricingService {

    private final PricingRuleRepository pricingRuleRepository;

    @Data
    @Builder
    public static class PriceQuote {
        private Long baseAmountPaise;
        private Long taxPaise;
        private Long discountPaise;
        private Long totalPaise;
        private Long perSlotPaise;
    }

    /**
     * Calculates the quote for fixed-slot cells.
     */
    public PriceQuote quoteFixedSlots(Resource resource, List<Instant> cellStartsUtc, ZoneId venueZone) {
        if (cellStartsUtc == null || cellStartsUtc.isEmpty()) {
            throw new BusinessException("INVALID_SLOTS", "At least one slot cell must be provided for pricing");
        }

        List<PricingRule> rules = pricingRuleRepository.findByResourceIdOrderByPriorityDesc(resource.getId());
        if (rules.isEmpty()) {
            throw new BusinessException("NO_PRICING_RULES", "No pricing rules configured for resource #" + resource.getId());
        }

        long totalBasePaise = 0L;
        Long firstSlotPrice = null;

        for (Instant cellStartUtc : cellStartsUtc) {
            ZonedDateTime localStart = cellStartUtc.atZone(venueZone);
            PricingRule matchedRule = resolveBestRule(rules, localStart.toLocalDate(), localStart.toLocalTime());

            if (matchedRule.getPricePerSlotPaise() == null) {
                throw new BusinessException("INVALID_RULE", "Pricing rule #" + matchedRule.getId() + " is missing price_per_slot_paise");
            }

            long cellPrice = matchedRule.getPricePerSlotPaise();
            totalBasePaise += cellPrice;
            if (firstSlotPrice == null) {
                firstSlotPrice = cellPrice;
            }
        }

        long taxPaise = 0L; // GST can be added when tenant configures GST rate
        long discountPaise = 0L;
        long totalPaise = totalBasePaise + taxPaise - discountPaise;

        return PriceQuote.builder()
                .baseAmountPaise(totalBasePaise)
                .taxPaise(taxPaise)
                .discountPaise(discountPaise)
                .totalPaise(totalPaise)
                .perSlotPaise(firstSlotPrice)
                .build();
    }

    /**
     * Resolves the best pricing rule for a specific local date and time.
     * Follows priority and specificity rules:
     * 1. Priority desc
     * 2. Specificity: WEEKDAY/WEEKEND > ANY
     * 3. Specificity: narrower time window > wider time window
     */
    public PricingRule resolveBestRule(List<PricingRule> rules, LocalDate localDate, LocalTime localTime) {
        DayOfWeek dow = localDate.getDayOfWeek();
        boolean isWeekend = (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY);
        PricingRule.DayType expectedType = isWeekend ? PricingRule.DayType.WEEKEND : PricingRule.DayType.WEEKDAY;

        return rules.stream()
                .filter(r -> r.getDayType() == PricingRule.DayType.ANY || r.getDayType() == expectedType)
                .filter(r -> isTimeWithinRange(localTime, r.getStartTime(), r.getEndTime()))
                .max(Comparator
                        .comparingInt(PricingRule::getPriority)
                        .thenComparing(r -> r.getDayType() != PricingRule.DayType.ANY ? 1 : 0)
                        .thenComparing(r -> -timeWindowDurationMinutes(r.getStartTime(), r.getEndTime())))
                .orElseThrow(() -> new BusinessException(
                        "PRICE_RULE_MISSING",
                        "No pricing rule matches time " + localTime + " on " + localDate.getDayOfWeek()
                ));
    }

    /**
     * Calculates billable amount for a live play session (TIME_PLAYED mode).
     * Applies minimum charge and rounding rules (e.g. 5 minutes).
     */
    public long calculateTimePlayedAmount(PricingRule rule, Instant startedAt, Instant endedAt) {
        if (rule.getPricePerHourPaise() == null) {
            throw new BusinessException("INVALID_RULE", "Pricing rule #" + rule.getId() + " is missing price_per_hour_paise");
        }

        long rawMinutes = Math.max(1, ChronoUnit.MINUTES.between(startedAt, endedAt));
        int rounding = (rule.getRoundingMinutes() != null && rule.getRoundingMinutes() > 0)
                ? rule.getRoundingMinutes()
                : 1;

        long roundedMinutes = (long) Math.ceil((double) rawMinutes / rounding) * rounding;
        long minChargeMinutes = rule.getMinChargeMinutes() != null ? rule.getMinChargeMinutes() : 0L;
        long billedMinutes = Math.max(roundedMinutes, minChargeMinutes);

        return Math.round(((double) billedMinutes / 60.0) * rule.getPricePerHourPaise());
    }

    private boolean isTimeWithinRange(LocalTime time, LocalTime start, LocalTime end) {
        if (start.isBefore(end)) {
            return !time.isBefore(start) && !time.isAfter(end);
        } else {
            // Over midnight range, e.g. 22:00 to 02:00
            return !time.isBefore(start) || !time.isAfter(end);
        }
    }

    private long timeWindowDurationMinutes(LocalTime start, LocalTime end) {
        if (start.isBefore(end)) {
            return ChronoUnit.MINUTES.between(start, end);
        }
        return (24 * 60) - ChronoUnit.MINUTES.between(end, start);
    }
}
