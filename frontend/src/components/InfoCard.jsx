import React from 'react';
import {View, StyleSheet} from 'react-native';
import {colors, moderateScale} from '../theme';

const InfoCard = ({children, containerStyle}) => {
  return <View style={[styles.container, containerStyle]}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(189, 224, 254, 0.2)',
    borderRadius: moderateScale(20),
    paddingVertical: moderateScale(8),
    marginHorizontal: moderateScale(20),
    marginBottom: moderateScale(20),
  },
});

export default InfoCard;

