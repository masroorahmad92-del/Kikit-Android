import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';

import {colors, moderateScale} from '../../theme';
import {Text} from './Text';
import {ArrowBack, Bell, Coin, Filter} from '../../assets/icons';

export const Header = ({
  onPress,
  onRightPress,
  rightIcon,
  loading,
  title,
  subTitle,
  leftIcon = <ArrowBack />,
  border,
  centerContent,
  customStyle,
  // New right-side icon handlers and data
  onBellPress,
  onCoinPress,
  onFilterPress,
  coinCount,
  notificationCount,
  hasActiveFilters = false,
}) => {
  return (
    <View
      style={[
        styles.container,
        customStyle,
        border && {
          borderBottomWidth: 0.5,
          borderColor: colors.grey100,
        },
      ]}>
      {onPress !== undefined && onPress !== null && (
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.backBtnContainer]}
          onPress={onPress}>
          {leftIcon}
        </TouchableOpacity>
      )}

      <View
        style={{
          flex: 1,
        }}>
        {title && (
          <Text ff={'semiBold'} fs={'XXL'} color="white">
            {title}
          </Text>
        )}
        {subTitle && (
          <Text ff={'semiBold'} fs={'S'} color="grey800" style={styles.subTitle}>
            {subTitle}
          </Text>
        )}
        {centerContent && centerContent}
      </View>

      {/* Backwards compatibility: single right icon */}
      {onRightPress && !onBellPress && !onCoinPress && !onFilterPress && (
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.rightBtnContainer}
          disabled={loading}
          onPress={onRightPress}>
          {loading ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            rightIcon
          )}
        </TouchableOpacity>
      )}
      {/* New: right-side multi icons (Bell, Coin, Filter) */}
      {(onBellPress || onCoinPress || onFilterPress) && (
        <View style={[styles.rightBtnContainer, styles.rightIconsRow]}>
          
          {onCoinPress && (
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.coinContainer}
              onPress={onCoinPress}>
              <Coin />
              {typeof coinCount === 'number' && (
                <Text
                  ff={'semiBold'}
                  fs={'M'}
                  color={colors.grey800}
                  style={styles.coinText}>
                  {coinCount}
                </Text>
              )}
            </TouchableOpacity>
          )}
          {onBellPress && (
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.iconBtn}
              onPress={onBellPress}>
              <View>
                <Bell />
                {typeof notificationCount === 'number' &&
                  notificationCount > 0 && (
                    <View style={styles.badge}>
                      <Text ff={'semiBold'} fs={'XXS'} color="white">
                        {notificationCount > 9 ? '9+' : notificationCount}
                      </Text>
                    </View>
                  )}
              </View>
            </TouchableOpacity>
          )}
          {onFilterPress && (
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.iconBtn,
                hasActiveFilters && styles.activeFilterBtn
              ]}
              onPress={onFilterPress}>
              <View>
                <Filter />
                {hasActiveFilters && (
                  <View style={styles.filterDot} />
                )}
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: moderateScale(45),
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginTop: Platform.OS === 'android' ? moderateScale(15) : moderateScale(6),
    marginBottom: moderateScale(8),
    paddingHorizontal: moderateScale(16),
    gap: moderateScale(8),
  },
  subTitle: {
    marginTop: moderateScale(2),
    lineHeight: moderateScale(18),
    flexShrink: 1,
  },
  logo: {
    height: 30,
  },
  backArrow: {
    height: 20,
    width: 20,
  },
  backBtnContainer: {
    left: 0,
    height: 40,
    justifyContent: 'center',
  },
  rightBtnContainer: {
    right: 0,
    alignSelf: 'center',
  },
  rightIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(14),
  },
  iconBtn: {
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: moderateScale(50),
  },
  coinContainer: {
    alignItems: 'center',
  },
  coinText: {
    marginLeft: moderateScale(6),
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  activeFilterBtn: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  filterDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
});
