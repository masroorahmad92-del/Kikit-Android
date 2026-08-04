import React from 'react';
import {TouchableOpacity, StyleSheet, View} from 'react-native';
import {Text} from './base/Text';
import {colors, moderateScale} from '../theme';
import {ChevronRight} from '../assets/icons';

const ProfileDetailItem = ({
  icon,
  label,
  value,
  onPress,
  showChevron = false,
  showAddButton = false,
  containerStyle,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, containerStyle]}
      onPress={onPress}
      activeOpacity={0.7}>
      {/* Icon */}
      <View style={styles.iconContainer}>{icon}</View>

      {/* Content */}
      <View style={styles.textContainer}>
        <Text ff="c-Regular" fs="M" color="grey800" style={styles.label}>
          {label}
        </Text>
        <Text ff="c-Regular" fs="S" color="grey400" style={styles.value}>
          {value}
        </Text>
      </View>

      {/* Right Action */}
      {showAddButton ? (
        <Text ff="c-Regular" fs="M" style={styles.addButton}>
          Add
        </Text>
      ) : showChevron ? (
        <ChevronRight width={20} height={20} stroke={colors.grey400} />
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(14),
    backgroundColor: 'transparent',
  },
  iconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontWeight: '600',
    marginBottom: moderateScale(2),
  },
  value: {
    fontWeight: '400',
  },
  addButton: {
    color: colors.normal,
    fontWeight: '600',
  },
});

export default ProfileDetailItem;

