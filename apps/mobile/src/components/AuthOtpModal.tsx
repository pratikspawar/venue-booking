import React, { useState } from 'react';
import { StyleSheet, Text, View, Modal, TextInput, TouchableOpacity } from 'react-native';
import { useCustomerStore } from '../store/useCustomerStore';
import { mobileApi } from '../services/api';

export const AuthOtpModal: React.FC = () => {
  const { isAuthOpen, closeAuth, loginUser } = useCustomerStore();
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('9820112345');
  const [otp, setOtp] = useState('123456');
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthOpen) return null;

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) return;
    setIsLoading(true);
    try {
      await mobileApi.requestOtp('+91' + phone);
      setStep('OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) return;
    setIsLoading(true);
    try {
      await loginUser('+91' + phone, otp);
      setStep('PHONE');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={isAuthOpen} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>
            {step === 'PHONE' ? 'Sign In / Register' : 'Verify Mobile Number'}
          </Text>
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  sub: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  prefix: {
    fontSize: 15,
    fontWeight: '700',
    color: '#818cf8',
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    paddingVertical: 12,
  },
  otpInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
    paddingVertical: 12,
    marginBottom: 20,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  cancelBtnText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 13,
  },
  submitBtn: {
    flex: 1.5,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#6366f1',
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
});
