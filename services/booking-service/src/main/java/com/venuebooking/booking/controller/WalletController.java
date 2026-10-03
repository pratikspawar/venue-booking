package com.venuebooking.booking.controller;

import com.venuebooking.booking.dto.DebitWalletRequestDto;
import com.venuebooking.booking.dto.TopUpWalletRequestDto;
import com.venuebooking.booking.dto.WalletDto;
import com.venuebooking.booking.dto.WalletTransactionDto;
import com.venuebooking.booking.service.WalletService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/wallets")
@RequiredArgsConstructor
@Tag(name = "Customer Wallet & Ledger API", description = "Customer wallet balance, instant top-ups, booking debits, and ledger transactions")
public class WalletController {

    private final WalletService walletService;

    @GetMapping("/customer/{userId}")
    @Operation(summary = "Get current wallet balance for customer")
    public ResponseEntity<WalletDto> getWallet(
            @RequestHeader("X-Tenant-Id") Long tenantId,
            @PathVariable Long userId
    ) {
        WalletDto wallet = walletService.getWallet(tenantId, userId);
        return ResponseEntity.ok(wallet);
    }

    @PostMapping("/topup")
    @Operation(summary = "Top up customer wallet balance")
    public ResponseEntity<WalletDto> topUp(
            @RequestHeader("X-Tenant-Id") Long tenantId,
            @Valid @RequestBody TopUpWalletRequestDto request
    ) {
        WalletDto wallet = walletService.topUp(tenantId, request);
        return ResponseEntity.ok(wallet);
    }

    @PostMapping("/debit")
    @Operation(summary = "Debit customer wallet balance for a booking")
    public ResponseEntity<WalletDto> debit(
            @RequestHeader("X-Tenant-Id") Long tenantId,
            @Valid @RequestBody DebitWalletRequestDto request
    ) {
        WalletDto wallet = walletService.debit(
                tenantId,
                request.userId(),
                request.amountPaise(),
                request.bookingId(),
                request.description()
        );
        return ResponseEntity.ok(wallet);
    }

    @GetMapping("/customer/{userId}/transactions")
    @Operation(summary = "Get transaction ledger history for customer wallet")
    public ResponseEntity<List<WalletTransactionDto>> getTransactions(
            @RequestHeader("X-Tenant-Id") Long tenantId,
            @PathVariable Long userId
    ) {
        List<WalletTransactionDto> txns = walletService.getTransactions(tenantId, userId);
        return ResponseEntity.ok(txns);
    }
}
