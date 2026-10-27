import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { MembershipCardController } from './MembershipCard.controller';
import { styles } from './MembershipCard.styles';

interface MembershipCardViewProps {
  controller: MembershipCardController;
}

export const MembershipCardView: React.FC<MembershipCardViewProps> = ({ controller }) => {
  const { hasActiveMembership, title, subtitle, handleJoinVip } = controller;

  return (
    <View style={styles.membershipCard}>
      <View style={styles.membershipHeader}>
        <Text style={styles.membershipIcon}>👑</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.membershipTitle}>{title}</Text>
          <Text style={styles.membershipSub}>{subtitle}</Text>
        </View>
        {hasActiveMembership ? (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>ACTIVE</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.upgradeBtn} onPress={handleJoinVip} activeOpacity={0.8}>
            <Text style={styles.upgradeBtnText}>Join VIP</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
