package com.venuebooking.booking.service;

import com.venuebooking.booking.dto.CreatePrepaidPackageDto;
import com.venuebooking.booking.dto.CustomerPrepaidPackageDto;
import com.venuebooking.booking.dto.PrepaidPackageDto;
import com.venuebooking.booking.dto.PurchasePrepaidPackageRequestDto;
import com.venuebooking.booking.entity.CustomerPrepaidPackage;
import com.venuebooking.booking.entity.PrepaidPackage;
import com.venuebooking.booking.repository.CustomerPrepaidPackageRepository;
import com.venuebooking.booking.repository.PrepaidPackageRepository;
import com.venuebooking.common.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PrepaidPackageService {

    private final PrepaidPackageRepository prepaidPackageRepository;
    private final CustomerPrepaidPackageRepository customerPrepaidPackageRepository;
    private final WalletService walletService;

    @Transactional
    public PrepaidPackageDto createPackage(Long tenantId, CreatePrepaidPackageDto request) {
        PrepaidPackage pkg = PrepaidPackage.builder()
                .tenantId(tenantId)
                .name(request.name().trim())
                .sportCode(request.sportCode() != null && !request.sportCode().isBlank() ? request.sportCode().trim().toUpperCase() : null)
                .totalMinutes(request.totalMinutes())
                .pricePaise(request.pricePaise())
                .validityDays(request.validityDays() != null ? request.validityDays() : 90)
                .active(true)
                .build();

        pkg = prepaidPackageRepository.save(pkg);
        log.info("Prepaid hours package created: tenant={}, name={}, totalMinutes={}, pricePaise={}",
                tenantId, pkg.getName(), pkg.getTotalMinutes(), pkg.getPricePaise());

        return toDto(pkg);
    }

    @Transactional(readOnly = true)
    public List<PrepaidPackageDto> getPackages(Long tenantId) {
        return prepaidPackageRepository.findByTenantIdAndActiveTrueOrderByIdAsc(tenantId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PrepaidPackageDto> getAllPackages(Long tenantId) {
        return prepaidPackageRepository.findByTenantIdOrderByIdAsc(tenantId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public PrepaidPackageDto togglePackageActive(Long tenantId, Long packageId) {
        PrepaidPackage pkg = prepaidPackageRepository.findById(packageId)
                .orElseThrow(() -> BusinessException.notFound("Prepaid package not found: " + packageId));

        if (!pkg.getTenantId().equals(tenantId)) {
            throw new BusinessException("FORBIDDEN", "Package does not belong to this venue.");
        }

        pkg.setActive(!Boolean.TRUE.equals(pkg.getActive()));
        pkg = prepaidPackageRepository.save(pkg);
        return toDto(pkg);
    }

    @Transactional
    public CustomerPrepaidPackageDto purchasePackage(Long tenantId, PurchasePrepaidPackageRequestDto request) {
        PrepaidPackage pkg = prepaidPackageRepository.findById(request.packageId())
                .orElseThrow(() -> BusinessException.notFound("Prepaid package not found: " + request.packageId()));

        if (!pkg.getTenantId().equals(tenantId) || !pkg.getActive()) {
            throw new IllegalArgumentException("Package is inactive or not available.");
        }

        // Debit wallet if WALLET payment
        if ("WALLET".equalsIgnoreCase(request.paymentMode())) {
            walletService.debit(tenantId, request.userId(), pkg.getPricePaise(), null, "Purchase Hours Package: " + pkg.getName());
        }

        Instant now = Instant.now();
        Instant expiresAt = now.plus(Duration.ofDays(pkg.getValidityDays()));

        CustomerPrepaidPackage customerPkg = CustomerPrepaidPackage.builder()
                .tenantId(tenantId)
                .userId(request.userId())
                .packageId(pkg.getId())
                .packageName(pkg.getName())
                .sportCode(pkg.getSportCode())
                .totalMinutes(pkg.getTotalMinutes())
                .remainingMinutes(pkg.getTotalMinutes())
                .purchasedAt(now)
                .expiresAt(expiresAt)
                .status(CustomerPrepaidPackage.Status.ACTIVE)
                .build();

        customerPkg = customerPrepaidPackageRepository.save(customerPkg);
        log.info("Customer #{} purchased prepaid package '{}' ({} mins) for tenant #{}",
                request.userId(), pkg.getName(), pkg.getTotalMinutes(), tenantId);

        return toCustomerDto(customerPkg);
    }

    @Transactional(readOnly = true)
    public List<CustomerPrepaidPackageDto> getActiveCustomerPackages(Long tenantId, Long userId) {
        return customerPrepaidPackageRepository.findByTenantIdAndUserIdAndStatusAndExpiresAtAfter(
                tenantId, userId, CustomerPrepaidPackage.Status.ACTIVE, Instant.now()
        ).stream().map(this::toCustomerDto).toList();
    }

    @Transactional(readOnly = true)
    public List<CustomerPrepaidPackageDto> getTenantLedger(Long tenantId) {
        return customerPrepaidPackageRepository.findByTenantIdOrderByCreatedAtDesc(tenantId).stream()
                .map(this::toCustomerDto)
                .toList();
    }

    @Transactional
    public void deductMinutes(Long customerPackageId, int minutes) {
        customerPrepaidPackageRepository.findById(customerPackageId).ifPresent(pkg -> {
            int remaining = pkg.getRemainingMinutes() != null ? pkg.getRemainingMinutes() : 0;
            int newRemaining = Math.max(0, remaining - minutes);
            pkg.setRemainingMinutes(newRemaining);
            if (newRemaining == 0) {
                pkg.setStatus(CustomerPrepaidPackage.Status.EXHAUSTED);
            }
            customerPrepaidPackageRepository.save(pkg);
            log.info("Deducted {} minutes from customer prepaid package #{}, remaining: {}",
                    minutes, customerPackageId, newRemaining);
        });
    }

    private PrepaidPackageDto toDto(PrepaidPackage p) {
        return new PrepaidPackageDto(
                p.getId(),
                p.getName(),
                p.getSportCode(),
                p.getTotalMinutes(),
                p.getTotalMinutes() / 60.0,
                p.getPricePaise(),
                p.getPricePaise() / 100.0,
                p.getValidityDays(),
                p.getActive()
        );
    }

    private CustomerPrepaidPackageDto toCustomerDto(CustomerPrepaidPackage c) {
        return new CustomerPrepaidPackageDto(
                c.getId(),
                c.getUserId(),
                c.getPackageId(),
                c.getPackageName(),
                c.getSportCode(),
                c.getTotalMinutes(),
                c.getTotalMinutes() / 60.0,
                c.getRemainingMinutes(),
                c.getRemainingMinutes() / 60.0,
                c.getPurchasedAt(),
                c.getExpiresAt(),
                c.getStatus().name()
        );
    }
}
