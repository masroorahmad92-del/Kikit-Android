import React from 'react';
import {View, StyleSheet, Image, TouchableOpacity} from 'react-native';
import {Text} from './base/Text';
import {colors, moderateScale} from '../theme';

const TransactionItem = ({
  avatar,
  title,
  timeAgo,
  onPress,
  containerStyle,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, containerStyle]}
      onPress={onPress}
      activeOpacity={0.7}>
      {/* Avatar */}
      <Image source={avatar} style={styles.avatar} />

      {/* Transaction Info */}
      <View style={styles.infoContainer}>
        <Text ff="c-Regular" fs="L" color="grey800" style={styles.title}>
          {title}
        </Text>
      </View>

      {/* Time */}
      <Text ff="c-Regular" fs="S" color="grey800" style={styles.time}>
        {timeAgo}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(189, 224, 254, 0.3)',
    paddingVertical: moderateScale(16),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(20),
    marginBottom: moderateScale(12),
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    marginHorizontal: moderateScale(20),
  },
  avatar: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    marginRight: moderateScale(12),
  },
  infoContainer: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
  },
  time: {
    fontWeight: '400',
  },
});

export default TransactionItem;

