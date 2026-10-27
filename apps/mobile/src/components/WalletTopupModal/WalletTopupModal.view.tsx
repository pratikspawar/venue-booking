import React from 'react';
import {
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { WalletTopupController } from './WalletTopupModal.controller';
import { styles } from './WalletTopupModal.styles';

interface WalletTopupModalViewProps {
  controller: WalletTopupController;
}

export const WalletTopupModalView: React.FC<WalletTopupModalViewProps> = ({ controller }) => {
  const {
    isWalletOpen,
    currentBalance,
    amountStr,
    setAmountStr,
    isLoading,
    error,
    successMsg,
    quickAmounts,
    walletTransactions,
    handleQuickSelect,
    handleTopup,
    handleClose,
    t,
  } = controller;

  if (!isWalletOpen) return null;

  return (
    <Modal visible={isWalletOpen} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.sheetTitle}>{t('wallet_modal_title')}</Text>
              <Text style={styles.sheetSub}>{t('wallet_min_amount_hint')}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleClose}
              disabled={isLoading}
              accessibilityLabel="Close"
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Balance Card */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>{t('wallet_current_balance')}</Text>
              <Text style={styles.balanceValue}>₹{currentBalance}</Text>
            </View>

            {/* Status alerts */}
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            {successMsg && (
              <View style={styles.successBanner}>
                <Text style={styles.successText}>{successMsg}</Text>
              </View>
            )}

            {/* Quick Chips */}
            <Text style={styles.sectionHeader}>{t('wallet_quick_add')}</Text>
            <View style={styles.chipRow}>
              {quickAmounts.map((q) => {
                const isSelected = amountStr === String(q);
                return (
                  <TouchableOpacity
                    key={q}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => handleQuickSelect(q)}
                    disabled={isLoading}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      +₹{q}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Amount Input */}
            <Text style={styles.sectionHeader}>{t('wallet_enter_amount')}</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.rupeePrefix}>₹</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={amountStr}
                onChangeText={setAmountStr}
                placeholder="500"
                placeholderTextColor="#64748b"
                editable={!isLoading}
              />
            </View>

            {/* Top-up Button */}
            <TouchableOpacity
              style={[styles.payBtn, isLoading && styles.payBtnDisabled]}
              onPress={handleTopup}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.payBtnText}>
                  {t('wallet_topup_btn')} (₹{amountStr || '0'})
                </Text>
              )}
            </TouchableOpacity>

            {/* Transaction Ledger */}
            <Text style={[styles.sectionHeader, { marginTop: 24 }]}>{t('wallet_tx_history')}</Text>
            {walletTransactions && walletTransactions.length > 0 ? (
              <View style={styles.ledgerList}>
                {walletTransactions.map((tx) => {
                  const isCredit = tx.type === 'CREDIT';
                  const dateStr = tx.createdAt
                    ? new Date(tx.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '';

                  return (
                    <View key={tx.id} style={styles.ledgerRow}>
                      <View style={styles.ledgerInfo}>
                        <Text style={styles.ledgerDesc}>
                          {tx.description || (isCredit ? 'Wallet Top-Up' : 'Booking Payment')}
                        </Text>
                        <Text style={styles.ledgerMeta}>
                          {dateStr} {tx.referenceId ? `• #${tx.referenceId}` : ''}
                        </Text>
                      </View>
                      <View style={styles.ledgerAmountCol}>
                        <Text style={[styles.ledgerAmount, isCredit ? styles.amountGreen : styles.amountRed]}>
                          {isCredit ? '+' : '-'}₹{(tx.amountPaise / 100).toFixed(0)}
                        </Text>
                        <Text style={styles.balanceAfter}>
                          bal: ₹{(tx.balanceAfterPaise / 100).toFixed(0)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyLedger}>
                <Text style={styles.emptyLedgerText}>{t('wallet_no_tx')}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
