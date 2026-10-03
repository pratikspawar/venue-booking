package com.venuebooking.booking.service;

import com.venuebooking.booking.dto.TopUpWalletRequestDto;
import com.venuebooking.booking.dto.WalletDto;
import com.venuebooking.booking.dto.WalletTransactionDto;
import com.venuebooking.booking.entity.Wallet;
import com.venuebooking.booking.entity.WalletTransaction;
import com.venuebooking.booking.repository.WalletRepository;
import com.venuebooking.booking.repository.WalletTransactionRepository;
import com.venuebooking.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class WalletService {

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;

    @Transactional
    public Wallet getOrCreateWalletEntity(Long tenantId, Long userId) {
        return walletRepository.findByTenantIdAndUserId(tenantId, userId)
                .orElseGet(() -> walletRepository.save(
                        Wallet.builder()
                                .tenantId(tenantId)
                                .userId(userId)
                                .balancePaise(0L)
                                .build()
                ));
    }

    @Transactional(readOnly = true)
    public WalletDto getWallet(Long tenantId, Long userId) {
        Wallet wallet = getOrCreateWalletEntity(tenantId, userId);
        return new WalletDto(
                wallet.getId(),
                wallet.getUserId(),
                wallet.getBalancePaise(),
                wallet.getBalancePaise() / 100.0,
                wallet.getVersion()
        );
    }

    @Transactional
    public WalletDto topUp(Long tenantId, TopUpWalletRequestDto request) {
        Wallet wallet = getOrCreateWalletEntity(tenantId, request.userId());

        long newBalance = wallet.getBalancePaise() + request.amountPaise();
        wallet.setBalancePaise(newBalance);
        wallet = walletRepository.save(wallet);

        WalletTransaction txn = WalletTransaction.builder()
                .tenantId(tenantId)
                .walletId(wallet.getId())
                .amountPaise(request.amountPaise())
                .type(WalletTransaction.Type.TOPUP)
                .referenceId(request.referenceId())
                .description(request.notes() != null ? request.notes() : "Wallet Top-up via Razorpay/Counter")
                .balanceAfterPaise(newBalance)
                .build();
        walletTransactionRepository.save(txn);

        log.info("Wallet top-up successful: tenant={}, user={}, amountPaise={}, newBalance={}",
                tenantId, request.userId(), request.amountPaise(), newBalance);

        return new WalletDto(wallet.getId(), wallet.getUserId(), newBalance, newBalance / 100.0, wallet.getVersion());
    }

    @Transactional
    public WalletDto debit(Long tenantId, Long userId, Long amountPaise, Long bookingId, String description) {
        Wallet wallet = getOrCreateWalletEntity(tenantId, userId);

        if (wallet.getBalancePaise() < amountPaise) {
            throw new IllegalArgumentException(String.format(
                    "Insufficient wallet balance. Available: ₹%.2f, Required: ₹%.2f",
                    wallet.getBalancePaise() / 100.0, amountPaise / 100.0));
        }

        long newBalance = wallet.getBalancePaise() - amountPaise;
        wallet.setBalancePaise(newBalance);
        wallet = walletRepository.save(wallet);

        WalletTransaction txn = WalletTransaction.builder()
                .tenantId(tenantId)
                .walletId(wallet.getId())
                .amountPaise(-amountPaise)
                .type(WalletTransaction.Type.DEBIT_BOOKING)
                .referenceId(bookingId != null ? String.valueOf(bookingId) : null)
                .description(description != null ? description : "Payment for Booking #" + bookingId)
                .balanceAfterPaise(newBalance)
                .build();
        walletTransactionRepository.save(txn);

        log.info("Wallet debit successful: tenant={}, user={}, amountPaise={}, newBalance={}",
                tenantId, userId, amountPaise, newBalance);

        return new WalletDto(wallet.getId(), wallet.getUserId(), newBalance, newBalance / 100.0, wallet.getVersion());
    }

    @Transactional
    public WalletDto refund(Long tenantId, Long userId, Long amountPaise, Long bookingId, String reason) {
        Wallet wallet = getOrCreateWalletEntity(tenantId, userId);

        long newBalance = wallet.getBalancePaise() + amountPaise;
        wallet.setBalancePaise(newBalance);
        wallet = walletRepository.save(wallet);

        WalletTransaction txn = WalletTransaction.builder()
                .tenantId(tenantId)
                .walletId(wallet.getId())
                .amountPaise(amountPaise)
                .type(WalletTransaction.Type.REFUND)
                .referenceId(bookingId != null ? String.valueOf(bookingId) : null)
                .description(reason != null ? reason : "Refund credited for Booking #" + bookingId)
                .balanceAfterPaise(newBalance)
                .build();
        walletTransactionRepository.save(txn);

        log.info("Wallet refund credited: tenant={}, user={}, amountPaise={}, newBalance={}",
                tenantId, userId, amountPaise, newBalance);

        return new WalletDto(wallet.getId(), wallet.getUserId(), newBalance, newBalance / 100.0, wallet.getVersion());
    }

    @Transactional(readOnly = true)
    public List<WalletTransactionDto> getTransactions(Long tenantId, Long userId) {
        Wallet wallet = getOrCreateWalletEntity(tenantId, userId);
        return walletTransactionRepository.findByWalletIdOrderByCreatedAtDesc(wallet.getId()).stream()
                .map(t -> new WalletTransactionDto(
                        t.getId(),
                        t.getAmountPaise(),
                        t.getAmountPaise() / 100.0,
                        t.getType().name(),
                        t.getReferenceId(),
                        t.getDescription(),
                        t.getBalanceAfterPaise(),
                        t.getBalanceAfterPaise() / 100.0,
                        t.getCreatedAt()
                ))
                .toList();
    }
}
