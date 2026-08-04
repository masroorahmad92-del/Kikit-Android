import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, TouchableOpacity, Image, Animated, Easing} from 'react-native';
import {Text} from './base/Text';
import {colors, moderateScale} from '../theme';
import {Coin} from '../assets/icons';

const PointsCard = ({points, onPress, diamonds, onPayoutPress}) => {
  const coinSpin = useRef(new Animated.Value(0)).current;
  const diamondSpin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const coinAnim = Animated.loop(
      Animated.sequence([
        Animated.delay(2000),
        Animated.timing(coinSpin, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(coinSpin, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    const diamondAnim = Animated.loop(
      Animated.sequence([
        Animated.delay(3500),
        Animated.timing(diamondSpin, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(diamondSpin, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    coinAnim.start();
    diamondAnim.start();

    return () => {
      coinAnim.stop();
      diamondAnim.stop();
    };
  }, [coinSpin, diamondSpin]);

  const coinRotateY = coinSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const diamondRotateY = diamondSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Coins Row with Get More button */}
      <View style={styles.coinsSection}>
        <View style={styles.balanceRow}>
          <Animated.View style={{transform: [{rotateY: coinRotateY}]}}>
            <Coin width={moderateScale(36)} height={moderateScale(36)} />
          </Animated.View>
          <View style={styles.textContainer}>
            <Text ff="c-Bold" fs="XL" color="grey800" style={styles.points}>
              {points || 0}
            </Text>
            <Text ff="c-Regular" fs="S" color="grey400" style={styles.label}>
              Coins
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={onPress}
          activeOpacity={0.8}>
          <Text ff="c-Regular" fs="M" color="white" style={styles.buttonText}>
            Get More
          </Text>
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Diamonds Row with Payout button */}
      <View style={styles.coinsSection}>
        <View style={styles.balanceRow}>
          <Animated.View style={[styles.diamondIconWrapper, {transform: [{rotateY: diamondRotateY}]}]}>
            <Image
              source={require('../assets/images/diamond.png')}
              style={styles.diamondIcon}
              resizeMode="contain"
            />
          </Animated.View>
          <View style={styles.textContainer}>
            <Text ff="c-Bold" fs="XL" color="grey800" style={styles.points}>
              {diamonds || 0}
            </Text>
            <Text ff="c-Regular" fs="S" color="grey400" style={styles.label}>
              Diamonds
            </Text>
          </View>
        </View>
        {onPayoutPress && (
          <TouchableOpacity
            style={styles.payoutButton}
            onPress={onPayoutPress}
            activeOpacity={0.8}>
            <Text ff="c-Regular" fs="M" color="white" style={styles.buttonText}>
              Payout
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    marginHorizontal: moderateScale(20),
    marginBottom: moderateScale(20),
    paddingVertical: moderateScale(18),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(25),
    shadowColor: colors.grey800,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  coinsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: moderateScale(12),
  },
  points: {
    fontWeight: '700',
    marginBottom: moderateScale(2),
  },
  label: {
    fontWeight: '400',
  },
  divider: {
    height: 1,
    backgroundColor: colors.grey200 || '#E5E7EB',
    marginVertical: moderateScale(12),
  },
  diamondIconWrapper: {
    width: moderateScale(36),
    height: moderateScale(36),
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondIcon: {
    width: moderateScale(32),
    height: moderateScale(32),
  },
  button: {
    backgroundColor: colors.secondary,
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(25),
  },
  payoutButton: {
    backgroundColor: colors.primary,
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(25),
  },
  buttonText: {
    fontWeight: '700',
  },
});

export default PointsCard;

