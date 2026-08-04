import React from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import FastImage from 'react-native-fast-image';
import {Text} from './base/Text';
import {colors, moderateScale} from '../theme';
import {VerificationIcon, EditPencil} from '../assets/icons';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Path, Circle, Defs, LinearGradient as SvgGradient, Stop} from 'react-native-svg';

const VerifiedCheckmark = () => (
  <Svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.7932 2.9335C8.56997 3.12374 8.45834 3.21886 8.33913 3.29876C8.06587 3.48192 7.75899 3.60903 7.43625 3.67275C7.29546 3.70054 7.14928 3.71221 6.8569 3.73554C6.1223 3.79416 5.755 3.82347 5.44856 3.93171C4.7398 4.18205 4.1823 4.73955 3.93196 5.44832C3.82372 5.75475 3.79441 6.12206 3.73579 6.85666C3.71245 7.14903 3.70079 7.29522 3.67299 7.43601C3.60928 7.75874 3.48216 8.06563 3.29901 8.33889C3.21911 8.4581 3.12399 8.56972 2.93375 8.79295C2.45576 9.35384 2.21676 9.6343 2.07661 9.92752C1.75246 10.6057 1.75246 11.3941 2.07661 12.0723C2.21676 12.3655 2.45575 12.646 2.93374 13.2069C3.12397 13.4301 3.21911 13.5417 3.29901 13.6609C3.48216 13.9342 3.60928 14.2411 3.67299 14.5638C3.70079 14.7046 3.71245 14.8508 3.73579 15.1432C3.79441 15.8778 3.82372 16.2451 3.93196 16.5515C4.1823 17.2603 4.7398 17.8178 5.44856 18.0681C5.755 18.1764 6.1223 18.2057 6.8569 18.2643C7.14928 18.2876 7.29546 18.2993 7.43625 18.3271C7.75899 18.3908 8.06587 18.5179 8.33913 18.7011C8.45834 18.781 8.56996 18.8761 8.7932 19.0663C9.35409 19.5443 9.63454 19.7833 9.92776 19.9235C10.606 20.2476 11.3944 20.2476 12.0726 19.9235C12.3658 19.7833 12.6462 19.5443 13.2071 19.0663C13.4304 18.8761 13.542 18.781 13.6612 18.7011C13.9345 18.5179 14.2413 18.3908 14.5641 18.3271C14.7049 18.2993 14.851 18.2876 15.1434 18.2643C15.878 18.2057 16.2453 18.1764 16.5518 18.0681C17.2605 17.8178 17.818 17.2603 18.0684 16.5515C18.1766 16.2451 18.2059 15.8778 18.2645 15.1432C18.2879 14.8508 18.2995 14.7046 18.3273 14.5638C18.391 14.2411 18.5182 13.9342 18.7013 13.6609C18.7812 13.5417 18.8763 13.4301 19.0666 13.2069C19.5446 12.646 19.7836 12.3655 19.9237 12.0723C20.2479 11.3941 20.2479 10.6057 19.9237 9.92752C19.7836 9.6343 19.5446 9.35385 19.0666 8.79295C18.8763 8.56972 18.7812 8.4581 18.7013 8.33889C18.5182 8.06563 18.391 7.75874 18.3273 7.43601C18.2995 7.29522 18.2879 7.14903 18.2645 6.85666C18.2059 6.12206 18.1766 5.75475 18.0684 5.44832C17.818 4.73955 17.2605 4.18205 16.5518 3.93171C16.2453 3.82347 15.878 3.79416 15.1434 3.73554C14.851 3.71221 14.7049 3.70054 14.5641 3.67275C14.2413 3.60903 13.9345 3.48192 13.6612 3.29876C13.542 3.21886 13.4304 3.12374 13.2071 2.9335C12.6462 2.45551 12.3658 2.21652 12.0726 2.07637C11.3944 1.75221 10.606 1.75221 9.92776 2.07637C9.63454 2.21651 9.35409 2.45552 8.7932 2.9335ZM15.0092 9.04113C15.3005 8.74978 15.3005 8.27741 15.0092 7.98607C14.7178 7.69472 14.2455 7.69472 13.9541 7.98607L9.50807 12.4321L8.04617 10.9702C7.75482 10.6789 7.28246 10.6789 6.99111 10.9702C6.69976 11.2616 6.69976 11.7339 6.99111 12.0253L8.98054 14.0147C9.27189 14.3061 9.74426 14.3061 10.0356 14.0147L15.0092 9.04113Z"
      fill="#EAFBED"
    />
  </Svg>
);

const CrownIcon = ({size = 16}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <SvgGradient id="crownGrad" x1="0" y1="0" x2="24" y2="24">
        <Stop offset="0" stopColor={colors.primary} />
        <Stop offset="1" stopColor={colors.secondary} />
      </SvgGradient>
    </Defs>
    <Path
      d="M2.5 18.5L4 8L8.5 12L12 4L15.5 12L20 8L21.5 18.5H2.5Z"
      fill="url(#crownGrad)"
      stroke={colors.primary}
      strokeWidth="0.5"
    />
    <Circle cx="4" cy="7" r="1.5" fill={colors.primary} />
    <Circle cx="12" cy="3" r="1.5" fill={colors.primary} />
    <Circle cx="20" cy="7" r="1.5" fill={colors.primary} />
  </Svg>
);

const PremiumBadge = ({planName}) => {
  const label = planName === 'annual' ? 'Annual' : planName === 'monthly' ? 'Monthly' : 'Premium';
  return (
    <View style={styles.premiumBadge}>
      <CrownIcon size={14} />
      <Text ff="c-Regular" fs="XS" color="white" style={styles.premiumBadgeText}>
        Current Plan: {label}
      </Text>
    </View>
  );
};

const ProfileHeader = ({
  name,
  avatar,
  isVerified,
  isPremium,
  activePlan,
  onPressVerify,
  onPressEdit,
}) => {
  return (
    <View style={styles.container}>
      {/* Avatar with Progress Ring */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarContainer}>
          <View style={[styles.gradientRing, isPremium && styles.gradientRingPremium]}>
            <View style={styles.avatarInner}>
              <FastImage
                source={avatar}
                style={styles.avatar}
                resizeMode={FastImage.resizeMode.cover}
                priority={FastImage.priority.high}
                cache={FastImage.cacheControl.immutable}
              />
            </View>
          </View>
          {isPremium && (
            <View style={styles.crownBadge}>
              <CrownIcon size={20} />
            </View>
          )}
        </View>

        {/* Name and Verify Button */}
        <View style={styles.infoSection}>
          <View style={styles.nameContainer}>
            <Text ff="c-Regular" fs="XL" color="grey800" style={styles.name}>
              {name}
            </Text>
            {isVerified && <VerifiedCheckmark />}
          </View>
          {isPremium && <PremiumBadge planName={activePlan} />}
        </View>

        {/* Edit Button */}
        <TouchableOpacity
          style={styles.editButton}
          onPress={onPressEdit}
          activeOpacity={0.8}>
          <EditPencil width={20} height={20} stroke={colors.secondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: moderateScale(20),
    marginBottom: moderateScale(20),
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: moderateScale(15),
  },
  gradientRing: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    borderWidth: moderateScale(3),
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    width: moderateScale(110),
    height: moderateScale(110),
    borderRadius: moderateScale(55),
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(55),
  },
  progressBadge: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    transform: [{translateX: -moderateScale(25)}],
    backgroundColor: colors.normal,
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(20),
  },
  progressText: {
    fontWeight: '700',
  },
  infoSection: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(10),
    gap: moderateScale(1),
  },
  name: {
    fontWeight: '700',
  },
  verifyButton: {
    backgroundColor: colors.secondary,
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(24),
    borderRadius: moderateScale(25),
    alignSelf: 'flex-start',
  },
  verifyButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: moderateScale(14),
  },
  gradientRingPremium: {
    borderColor: colors.primary,
  },
  crownBadge: {
    position: 'absolute',
    top: -moderateScale(4),
    left: '50%',
    transform: [{translateX: -moderateScale(10)}],
    backgroundColor: colors.white,
    borderRadius: moderateScale(12),
    padding: moderateScale(2),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
    alignSelf: 'flex-start',
    gap: moderateScale(4),
  },
  premiumBadgeText: {
    fontWeight: '700',
    color: '#fff',
  },
  editButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.grey800,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default ProfileHeader;

