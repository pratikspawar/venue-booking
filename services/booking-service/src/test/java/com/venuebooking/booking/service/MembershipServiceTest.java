package com.venuebooking.booking.service;

import com.venuebooking.booking.dto.CreateMembershipPlanDto;
import com.venuebooking.booking.dto.CustomerMembershipDto;
import com.venuebooking.booking.dto.MembershipPlanDto;
import com.venuebooking.booking.dto.PurchaseMembershipRequestDto;
import com.venuebooking.booking.entity.CustomerMembership;
import com.venuebooking.booking.entity.MembershipPlan;
import com.venuebooking.booking.repository.CustomerMembershipRepository;
import com.venuebooking.booking.repository.MembershipPlanRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MembershipServiceTest {

    @Mock
    private MembershipPlanRepository membershipPlanRepository;

    @Mock
    private CustomerMembershipRepository customerMembershipRepository;

    @Mock
    private WalletService walletService;

    private MembershipService membershipService;

    @BeforeEach
    void setUp() {
        membershipService = new MembershipService(
                membershipPlanRepository,
                customerMembershipRepository,
                walletService
        );
    }

    @Test
    @DisplayName("Should successfully create membership plan")
    void shouldCreatePlan() {
        CreateMembershipPlanDto request = new CreateMembershipPlanDto(
                "Gold VIP Pass",
                "PLAYSTATION",
                199900L,
                30,
                20,
                180
        );

        when(membershipPlanRepository.save(any(MembershipPlan.class))).thenAnswer(invocation -> {
            MembershipPlan p = invocation.getArgument(0);
            p.setId(10L);
            return p;
        });

        MembershipPlanDto result = membershipService.createPlan(1L, request);

        assertThat(result.id()).isEqualTo(10L);
        assertThat(result.name()).isEqualTo("Gold VIP Pass");
        assertThat(result.discountPercent()).isEqualTo(20);
        assertThat(result.freeMinutes()).isEqualTo(180);
        assertThat(result.pricePaise()).isEqualTo(199900L);
    }

    @Test
    @DisplayName("Should toggle membership plan active status")
    void shouldTogglePlanActive() {
        MembershipPlan plan = MembershipPlan.builder()
                .id(5L)
                .tenantId(1L)
                .name("Weekend League")
                .active(true)
                .pricePaise(99900L)
                .durationDays(30)
                .discountPercent(10)
                .freeMinutes(60)
                .build();

        when(membershipPlanRepository.findById(5L)).thenReturn(Optional.of(plan));
        when(membershipPlanRepository.save(any(MembershipPlan.class))).thenAnswer(inv -> inv.getArgument(0));

        MembershipPlanDto toggled = membershipService.togglePlanActive(1L, 5L);

        assertThat(toggled.active()).isFalse();
    }

    @Test
    @DisplayName("Should successfully purchase membership with wallet debit")
    void shouldPurchaseMembershipWithWallet() {
        MembershipPlan plan = MembershipPlan.builder()
                .id(1L)
                .tenantId(1L)
                .name("Pro Gamer Tier")
                .active(true)
                .pricePaise(150000L)
                .durationDays(30)
                .discountPercent(15)
                .freeMinutes(120)
                .sportCode("PLAYSTATION")
                .build();

        when(membershipPlanRepository.findById(1L)).thenReturn(Optional.of(plan));
        when(customerMembershipRepository.save(any(CustomerMembership.class))).thenAnswer(inv -> {
            CustomerMembership m = inv.getArgument(0);
            m.setId(101L);
            return m;
        });

        PurchaseMembershipRequestDto req = new PurchaseMembershipRequestDto(42L, 1L, "WALLET");
        CustomerMembershipDto result = membershipService.purchaseMembership(1L, req);

        verify(walletService).debit(1L, 42L, 150000L, null, "Purchase Membership: Pro Gamer Tier");
        assertThat(result.userId()).isEqualTo(42L);
        assertThat(result.planName()).isEqualTo("Pro Gamer Tier");
        assertThat(result.remainingFreeMinutes()).isEqualTo(120);
        assertThat(result.status()).isEqualTo("ACTIVE");
    }

    @Test
    @DisplayName("Should retrieve active membership for customer")
    void shouldGetActiveMembership() {
        CustomerMembership mem = CustomerMembership.builder()
                .id(1L)
                .tenantId(1L)
                .userId(42L)
                .planId(1L)
                .planName("Gold VIP")
                .discountPercent(25)
                .remainingFreeMinutes(60)
                .startDate(Instant.now().minus(5, ChronoUnit.DAYS))
                .endDate(Instant.now().plus(25, ChronoUnit.DAYS))
                .status(CustomerMembership.Status.ACTIVE)
                .build();

        when(customerMembershipRepository.findByTenantIdAndUserIdAndStatusAndEndDateAfter(
                eq(1L), eq(42L), eq(CustomerMembership.Status.ACTIVE), any(Instant.class)
        )).thenReturn(Optional.of(mem));

        Optional<CustomerMembershipDto> active = membershipService.getActiveMembership(1L, 42L);

        assertThat(active).isPresent();
        assertThat(active.get().planName()).isEqualTo("Gold VIP");
        assertThat(active.get().remainingFreeMinutes()).isEqualTo(60);
    }

    @Test
    @DisplayName("Should deduct free minutes from membership")
    void shouldDeductFreeMinutes() {
        CustomerMembership mem = CustomerMembership.builder()
                .id(1L)
                .tenantId(1L)
                .userId(42L)
                .remainingFreeMinutes(120)
                .status(CustomerMembership.Status.ACTIVE)
                .build();

        when(customerMembershipRepository.findById(1L)).thenReturn(Optional.of(mem));

        membershipService.deductFreeMinutes(1L, 60);

        assertThat(mem.getRemainingFreeMinutes()).isEqualTo(60);
        verify(customerMembershipRepository).save(mem);
    }
}
