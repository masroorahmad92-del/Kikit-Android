import React from 'react';
import {TouchableOpacity, StyleSheet, View} from 'react-native';
import {Text} from './base/Text';
import {colors, moderateScale} from '../theme';
import {ChevronRight} from '../assets/icons';

const ProfileInfoItem = ({
  label,
  value,
  onPress,
  showChevron = true,
  containerStyle,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, containerStyle]}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.textContainer}>
        <Text ff="c-Regular" fs="M" color="grey800" style={styles.label}>
          {label}
        </Text>
        <Text ff="c-Regular" fs="S" color="grey400" style={styles.value}>
          {value}
        </Text>
      </View>
      {showChevron && (
        <ChevronRight width={20} height={20} stroke={colors.grey400} />
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
    paddingVertical: moderateScale(14),
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontWeight: '600',
    marginBottom: moderateScale(4),
  },
  value: {
    fontWeight: '400',
  },
});

export default ProfileInfoItem;

