package com.venuebooking.booking.controller;

import com.venuebooking.booking.dto.ComprehensiveEarningsResponseDto;
import com.venuebooking.booking.dto.ComprehensiveReportResponseDto;
import com.venuebooking.booking.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
@Tag(name = "Reports & Analytics Engine", description = "Financial metrics, zero-hardcoded dynamic sport revenue breakdown, peak hours, and CSV exports")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/summary")
    @Operation(summary = "Get comprehensive financial and utilization analytics")
    public ResponseEntity<ComprehensiveReportResponseDto> getComprehensiveReport(
            @RequestHeader("X-Tenant-Id") Long tenantId,
            @RequestParam(required = false) Long venueId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate
    ) {
        ComprehensiveReportResponseDto report = reportService.generateReport(tenantId, venueId, startDate, endDate);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/earnings")
    @Operation(summary = "Get audited earnings, cashier collections, and daily revenue breakdown")
    public ResponseEntity<ComprehensiveEarningsResponseDto> getEarningsReport(
            @RequestHeader("X-Tenant-Id") Long tenantId,
            @RequestParam(required = false) Long venueId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate
    ) {
        ComprehensiveEarningsResponseDto earnings = reportService.getComprehensiveEarnings(tenantId, venueId, startDate, endDate);
        return ResponseEntity.ok(earnings);
    }

    @GetMapping("/export/csv")
    @Operation(summary = "Export filtered booking records and revenue ledger as CSV")
    public ResponseEntity<byte[]> exportBookingsCsv(
            @RequestHeader("X-Tenant-Id") Long tenantId,
            @RequestParam(required = false) Long venueId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate
    ) {
        String csvData = reportService.generateCsvExport(tenantId, venueId, startDate, endDate);
        byte[] bytes = csvData.getBytes(java.nio.charset.StandardCharsets.UTF_8);

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"venue-booking-report.csv\"")
            .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
            .body(bytes);
    }
}

