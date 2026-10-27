package com.venuebooking.booking.service;

import com.venuebooking.booking.dto.CreatePrepaidPackageDto;
import com.venuebooking.booking.dto.CustomerPrepaidPackageDto;
import com.venuebooking.booking.dto.PrepaidPackageDto;
import com.venuebooking.booking.dto.PurchasePrepaidPackageRequestDto;
import com.venuebooking.booking.entity.CustomerPrepaidPackage;
import com.venuebooking.booking.entity.PrepaidPackage;
import com.venuebooking.booking.repository.CustomerPrepaidPackageRepository;
import com.venuebooking.booking.repository.PrepaidPackageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PrepaidPackageServiceTest {

    @Mock
    private PrepaidPackageRepository prepaidPackageRepository;

    @Mock
    private CustomerPrepaidPackageRepository customerPrepaidPackageRepository;

    @Mock
    private WalletService walletService;

    private PrepaidPackageService prepaidPackageService;

    @BeforeEach
    void setUp() {
        prepaidPackageService = new PrepaidPackageService(
                prepaidPackageRepository,
                customerPrepaidPackageRepository,
                walletService
        );
    }

    @Test
    @DisplayName("Should successfully create a prepaid package")
    void shouldCreatePackage() {
        CreatePrepaidPackageDto request = new CreatePrepaidPackageDto(
                "Cricket 10 Hours Pass",
                "CRICKET",
                600, // 10 hours
                450000L, // ₹4500
                60
        );

        PrepaidPackage saved = PrepaidPackage.builder()
                .id(1L)
                .tenantId(2L)
                .name("Cricket 10 Hours Pass")
                .sportCode("CRICKET")
                .totalMinutes(600)
                .pricePaise(450000L)
                .validityDays(60)
                .active(true)
                .build();

        when(prepaidPackageRepository.save(any(PrepaidPackage.class))).thenReturn(saved);

        PrepaidPackageDto result = prepaidPackageService.createPackage(2L, request);

        assertThat(result).isNotNull();
        assertThat(result.name()).isEqualTo("Cricket 10 Hours Pass");
        assertThat(result.totalHours()).isEqualTo(10.0);
        assertThat(result.priceRupees()).isEqualTo(4500.0);
    }

    @Test
    @DisplayName("Should purchase package using wallet and credit remaining minutes")
    void shouldPurchasePackageWithWallet() {
        PrepaidPackage pkg = PrepaidPackage.builder()
                .id(5L)
                .tenantId(1L)
                .name("PS5 5 Hours Bundle")
                .sportCode("PLAYSTATION")
                .totalMinutes(300)
                .pricePaise(120000L) // ₹1200
                .validityDays(30)
                .active(true)
                .build();

        when(prepaidPackageRepository.findById(5L)).thenReturn(Optional.of(pkg));

        CustomerPrepaidPackage savedCustPkg = CustomerPrepaidPackage.builder()
                .id(101L)
                .tenantId(1L)
                .userId(88L)
                .packageId(5L)
                .packageName("PS5 5 Hours Bundle")
                .sportCode("PLAYSTATION")
                .totalMinutes(300)
                .remainingMinutes(300)
                .purchasedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(30 * 86400))
                .status(CustomerPrepaidPackage.Status.ACTIVE)
                .build();

        when(customerPrepaidPackageRepository.save(any(CustomerPrepaidPackage.class))).thenReturn(savedCustPkg);

        PurchasePrepaidPackageRequestDto request = new PurchasePrepaidPackageRequestDto(88L, 5L, "WALLET");
        CustomerPrepaidPackageDto response = prepaidPackageService.purchasePackage(1L, request);

        assertThat(response).isNotNull();
        assertThat(response.remainingHours()).isEqualTo(5.0);
        assertThat(response.status()).isEqualTo("ACTIVE");
        verify(walletService).debit(eq(1L), eq(88L), eq(120000L), isNull(), anyString());
    }

    @Test
    @DisplayName("Should deduct minutes from customer package and exhaust when reaching 0")
    void shouldDeductMinutesAndExhaust() {
        CustomerPrepaidPackage pkg = CustomerPrepaidPackage.builder()
                .id(101L)
                .tenantId(1L)
                .userId(88L)
                .totalMinutes(120)
                .remainingMinutes(60)
                .status(CustomerPrepaidPackage.Status.ACTIVE)
                .build();

        when(customerPrepaidPackageRepository.findById(101L)).thenReturn(Optional.of(pkg));

        prepaidPackageService.deductMinutes(101L, 60);

        assertThat(pkg.getRemainingMinutes()).isEqualTo(0);
        assertThat(pkg.getStatus()).isEqualTo(CustomerPrepaidPackage.Status.EXHAUSTED);
        verify(customerPrepaidPackageRepository).save(pkg);
    }
}
