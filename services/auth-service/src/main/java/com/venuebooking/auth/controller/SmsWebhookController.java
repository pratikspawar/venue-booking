package com.venuebooking.auth.controller;

import com.venuebooking.auth.entity.SmsDeliveryLog;
import com.venuebooking.auth.repository.SmsDeliveryLogRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/auth/webhooks/sms")
@RequiredArgsConstructor
@Tag(name = "SMS Delivery Webhooks", description = "Inbound delivery status callbacks from Twilio, MSG91, and SMS gateways")
public class SmsWebhookController {

    private final SmsDeliveryLogRepository smsDeliveryLogRepository;

    /**
     * Inbound delivery status callback from Twilio.
     * Twilio submits status callbacks as application/x-www-form-urlencoded.
     */
    @PostMapping(value = "/twilio", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    @Operation(summary = "Twilio Delivery Status Callback", description = "Receives delivery status reports from Twilio")
    @Transactional
    public ResponseEntity<Void> twilioStatusCallback(
            @RequestParam("MessageSid") String messageSid,
            @RequestParam("MessageStatus") String messageStatus,
            @RequestParam(value = "To", required = false) String to,
            @RequestParam(value = "ErrorCode", required = false) String errorCode,
            @RequestParam(value = "ErrorMessage", required = false) String errorMessage
    ) {
        log.info("Twilio SMS status callback received: MessageSid={}, Status={}, ErrorCode={}",
                messageSid, messageStatus, errorCode);

        Optional<SmsDeliveryLog> logOpt = smsDeliveryLogRepository.findByMessageId(messageSid);
        if (logOpt.isPresent()) {
            SmsDeliveryLog deliveryLog = logOpt.get();
            deliveryLog.setStatus(messageStatus.toUpperCase());
            if (errorCode != null && !errorCode.isBlank()) {
                deliveryLog.setErrorCode(errorCode);
                deliveryLog.setErrorMessage(errorMessage);
            }
            smsDeliveryLogRepository.save(deliveryLog);
            log.info("Updated delivery log #{} status to {}", deliveryLog.getId(), messageStatus.toUpperCase());
        } else {
            // If log wasn't pre-saved (e.g. direct dispatch), create record
            smsDeliveryLogRepository.save(SmsDeliveryLog.builder()
                    .phone(to != null ? to : "unknown")
                    .provider("twilio")
                    .messageId(messageSid)
                    .purpose("OTP")
                    .status(messageStatus.toUpperCase())
                    .errorCode(errorCode)
                    .errorMessage(errorMessage)
                    .build());
        }

        return ResponseEntity.ok().build();
    }

    /**
     * Inbound delivery status callback from MSG91.
     */
    @PostMapping(value = "/msg91", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "MSG91 Delivery Status Callback", description = "Receives delivery status reports from MSG91")
    @Transactional
    public ResponseEntity<Void> msg91StatusCallback(@RequestBody Map<String, Object> payload) {
        log.info("MSG91 SMS status callback received: {}", payload);

        String requestId = payload.get("requestId") != null ? payload.get("requestId").toString()
                : (payload.get("request_id") != null ? payload.get("request_id").toString() : null);
        String status = payload.get("status") != null ? payload.get("status").toString() : "UNKNOWN";
        String failureReason = payload.get("desc") != null ? payload.get("desc").toString() : null;

        if (requestId != null) {
            Optional<SmsDeliveryLog> logOpt = smsDeliveryLogRepository.findByMessageId(requestId);
            if (logOpt.isPresent()) {
                SmsDeliveryLog deliveryLog = logOpt.get();
                deliveryLog.setStatus(status.toUpperCase());
                if (failureReason != null) {
                    deliveryLog.setErrorMessage(failureReason);
                }
                smsDeliveryLogRepository.save(deliveryLog);
            }
        }

        return ResponseEntity.ok().build();
    }

    /**
     * Check latest SMS delivery status for a phone or message ID.
     */
    @GetMapping("/status")
    @Operation(summary = "Check SMS delivery status", description = "Inspects delivery status for a message ID or phone")
    public ResponseEntity<SmsDeliveryLog> getDeliveryStatus(
            @RequestParam(required = false) String messageId,
            @RequestParam(required = false) String phone
    ) {
        if (messageId != null && !messageId.isBlank()) {
            return smsDeliveryLogRepository.findByMessageId(messageId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        }
        if (phone != null && !phone.isBlank()) {
            return smsDeliveryLogRepository.findTopByPhoneOrderByCreatedAtDesc(phone)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        }
        return ResponseEntity.badRequest().build();
    }
}
