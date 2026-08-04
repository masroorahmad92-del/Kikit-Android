import React from 'react';
import {TouchableOpacity, StyleSheet, View} from 'react-native';
import {Text} from './base/Text';
import {colors, moderateScale} from '../theme';
import {ChevronRight} from '../assets/icons';

const MenuItem = ({
  icon,
  title,
  onPress,
  showChevron = true,
  containerStyle,
  textColor = 'grey800',
  iconBgColor = colors.white,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, containerStyle]}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.leftSection}>
        <View style={[styles.iconContainer, {backgroundColor: iconBgColor}]}>
          {icon}
        </View>
        <Text ff="c-Regular" fs="L" color={textColor} style={styles.title}>
          {title}
        </Text>
      </View>
      {showChevron && (
        <ChevronRight
          width={20}
          height={20}
          stroke={colors.grey400}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(16),
    backgroundColor: 'transparent',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
    shadowColor: colors.grey800,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontWeight: '600',
  },
});

export default MenuItem;

