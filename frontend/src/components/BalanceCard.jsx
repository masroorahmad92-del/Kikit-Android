import React from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {Text} from './base/Text';
import {colors, moderateScale} from '../theme';
import {Coin} from '../assets/icons';
import LinearGradient from 'react-native-linear-gradient';

const BalanceCard = ({points, usdValue, onWithdraw}) => {
  return (
    <View style={styles.card}>
      <LinearGradient
        colors={['#F3E5F5', '#E1BEE7']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.gradient}>
        <View style={styles.content}>
          {/* Title */}
          <Text ff="c-Regular" fs="XXL" color="grey800" style={styles.title}>
            Your Balance
          </Text>

          {/* Balance */}
          <View style={styles.balanceRow}>
            <Coin width={moderateScale(50)} height={moderateScale(50)} />
            <Text ff="c-Regular" fs="XXL" color="grey800" style={styles.balance}>
              {points} = ${usdValue} USD
            </Text>
          </View>

          {/* Withdraw Button */}
          <TouchableOpacity
            style={styles.withdrawButtonWrapper}
            onPress={onWithdraw}
            activeOpacity={0.8}>
            <LinearGradient
              colors={[colors.secondary, colors.primary]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.withdrawButton}>
              <Text
                ff="c-Regular"
                fs="XL"
                color="white"
                style={styles.withdrawText}>
                Withdraw
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: moderateScale(20),
    marginBottom: moderateScale(30),
    borderRadius: moderateScale(24),
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.secondary,
    shadowColor: colors.grey800,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  gradient: {
    borderRadius: moderateScale(21),
  },
  content: {
    paddingVertical: moderateScale(28),
    paddingHorizontal: moderateScale(24),
  },
  title: {
    fontWeight: '700',
    marginBottom: moderateScale(20),
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(24),
    gap: moderateScale(12),
  },
  balance: {
    fontWeight: '700',
    flex: 1,
  },
  withdrawButtonWrapper: {
    borderRadius: moderateScale(25),
    overflow: 'hidden',
  },
  withdrawButton: {
    height: moderateScale(36),
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawText: {
    fontWeight: '700',
  },
});

export default BalanceCard;

