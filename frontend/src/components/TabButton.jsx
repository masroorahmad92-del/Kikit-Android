import React from 'react';
import {TouchableOpacity, StyleSheet} from 'react-native';
import {Text} from './base/Text';
import {colors, moderateScale} from '../theme';

const TabButton = ({title, isActive, onPress, containerStyle}) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        isActive ? styles.activeContainer : styles.inactiveContainer,
        containerStyle,
      ]}
      onPress={onPress}
      activeOpacity={0.8}>
      <Text
        ff="c-Regular"
        fs="L"
        color={isActive ? 'white' : 'grey800'}
        style={styles.text}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeContainer: {
    backgroundColor: colors.secondary,
  },
  inactiveContainer: {
    backgroundColor: colors.white,
  },
  text: {
    fontWeight: '600',
  },
});

export default TabButton;

