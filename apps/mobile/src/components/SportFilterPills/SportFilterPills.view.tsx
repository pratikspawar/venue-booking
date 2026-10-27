import React from 'react';
import { Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { SportFilterPillsController } from './SportFilterPills.controller';
import { styles } from './SportFilterPills.styles';

export interface SportFilterPillsViewProps {
  controller: SportFilterPillsController;
}

export const SportFilterPillsView: React.FC<SportFilterPillsViewProps> = ({ controller }) => {
  const { selectedSport, items, selectSport } = controller;

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {items.map((s) => {
          const isActive = selectedSport === s.code;
          return (
            <TouchableOpacity
              key={s.code}
              onPress={() => selectSport(s.code)}
              style={[styles.pill, isActive && styles.pillActive]}
              activeOpacity={0.7}
            >
              <Text style={styles.icon}>{s.icon}</Text>
              <Text style={[styles.label, isActive && styles.labelActive]}>{s.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};
