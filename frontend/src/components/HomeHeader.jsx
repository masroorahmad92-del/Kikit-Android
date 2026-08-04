import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import {colors} from '../theme/colors';

const HomeHeader = () => {
  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        <Text style={styles.appName}>Kikit</Text>
        <Text style={styles.tagline}>Let's Find Your Match Today.</Text>
      </View>
      
      <View style={styles.rightSection}>
        <View style={styles.pointsContainer}>
          <View style={styles.coinIcon}>
            <Text style={styles.coinText}>P</Text>
          </View>
          <Text style={styles.pointsText}>1024</Text>
        </View>
        
        <TouchableOpacity style={styles.iconButton}>
          <Text style={styles.iconText}>🔔</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.iconButton}>
          <Text style={styles.iconText}>🔽</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.normal,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flex: 1,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: colors.grey400,
    fontWeight: '400',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coinIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.grey400,
  },
  iconButton: {
    width: 40,
    height: 40,
    backgroundColor: colors.white,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  iconText: {
    fontSize: 16,
  },
});

export default HomeHeader;
