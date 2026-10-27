package com.venuebooking.payment.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CredentialEncryptionServiceTest {

    private CredentialEncryptionService encryptionService;

    @BeforeEach
    void setUp() {
        encryptionService = new CredentialEncryptionService("my-super-secret-test-master-key-12345");
    }

    @Test
    void testEncryptAndDecryptRoundTrip() {
        String originalSecret = "rzp_sec_abcdef1234567890XYZ";
        String encrypted = encryptionService.encrypt(originalSecret);

        assertNotNull(encrypted);
        assertNotEquals(originalSecret, encrypted);

        String decrypted = encryptionService.decrypt(encrypted);
        assertEquals(originalSecret, decrypted);
    }

    @Test
    void testNullAndBlankHandling() {
        assertNull(encryptionService.encrypt(null));
        assertNull(encryptionService.encrypt(""));
        assertNull(encryptionService.decrypt(null));
        assertNull(encryptionService.decrypt(""));
    }

    @Test
    void testMaskSecret() {
        String secret = "abcdefghijklmnop";
        String masked = encryptionService.mask(secret);
        assertTrue(masked.contains("••••"));
        assertTrue(masked.startsWith("abcd"));
        assertTrue(masked.endsWith("mnop"));

        assertEquals("Not Configured", encryptionService.mask(null));
        assertEquals("Not Configured", encryptionService.mask(""));
    }
}
