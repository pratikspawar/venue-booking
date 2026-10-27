import React from 'react';
import { Text, View, Modal, TextInput, TouchableOpacity } from 'react-native';
import { AuthOtpModalController } from './AuthOtpModal.controller';
import { styles } from './AuthOtpModal.styles';

export interface AuthOtpModalViewProps {
  controller: AuthOtpModalController;
}

export const AuthOtpModalView: React.FC<AuthOtpModalViewProps> = ({ controller }) => {
  const {
    isAuthOpen,
    step,
    phone,
    otp,
    isLoading,
    error,
    setPhone,
    setOtp,
    handleSendOtp,
    handleVerifyOtp,
    closeAuth,
  } = controller;

  if (!isAuthOpen) return null;

  return (
    <Modal visible={isAuthOpen} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>
            {step === 'PHONE' ? 'Sign In / Register' : 'Verify Mobile Number'}
          </Text>
          {error && <Text style={styles.errorText}>{error}</Text>}
          <Text style={styles.sub}>
            {step === 'PHONE'
              ? 'Enter your mobile number to receive a 6-digit verification code.'
              : `Enter the 6-digit code sent to +91 ${phone}`}
          </Text>

          {step === 'PHONE' ? (
            <View style={styles.inputContainer}>
              <Text style={styles.prefix}>+91</Text>
              <TextInput
                style={styles.phoneInput}
                keyboardType="phone-pad"
                maxLength={10}
                placeholder="Mobile number"
                placeholderTextColor="#64748b"
                value={phone}
                onChangeText={setPhone}
              />
            </View>
          ) : (
            <TextInput
              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="123456"
              placeholderTextColor="#64748b"
              value={otp}
              onChangeText={setOtp}
            />
          )}

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={closeAuth} disabled={isLoading}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={step === 'PHONE' ? handleSendOtp : handleVerifyOtp}
              disabled={isLoading}
            >
              <Text style={styles.submitBtnText}>
                {isLoading ? 'Processing...' : step === 'PHONE' ? 'Send OTP' : 'Verify & Enter'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
