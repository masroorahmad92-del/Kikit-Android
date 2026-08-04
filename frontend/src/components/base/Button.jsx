import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {Text} from './Text';
import {
  colors,
  moderateScale,
  SCREEN_WIDTH,
  verticalScale,
} from '../../theme';

export const Button = props => {
  const {
    title,
    buttonStyle,
    textStyle,
    type = 'default',
    onPress,
    rightIcon,
    leftIcon,
    loading = false,
  } = props;

  let btnStyle = {};
  let txtStyle = {};
  let gradientColors = ['#FF2C79', '#BD00FF', '#BD00FF'];
  let gradientLocations = [0, 0.9, 1];

  if (type === 'outlined') {
    btnStyle = {
      backgroundColor: colors.white,
      borderColor: colors.grey200,
      borderWidth: 1,
    };
    txtStyle = {
      color: colors.grey800,
    };
    gradientColors = [colors.grey50, colors.grey50];
    gradientLocations = [0, 1];
  } else if (type === 'disabled') {
    btnStyle = {
      backgroundColor: colors.grey200,
    };
    txtStyle = {
      color: colors.grey400,
    };
    gradientColors = [colors.grey200, colors.grey200];
    gradientLocations = [0, 1];
  }

  if (loading) {
    return (
      <LinearGradient
        colors={gradientColors}
        locations={gradientLocations}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={[styles.buttonStyle, btnStyle, buttonStyle]}>
        <ActivityIndicator
          size={'small'}
          color={type === 'outlined' || type === 'disabled' ? colors.grey500 : colors.white}
        />
      </LinearGradient>
    );
  } else {
    return (
      <TouchableOpacity
        {...props}
        activeOpacity={0.7}
        onPress={onPress}
        disabled={type === 'disabled'}>
        <LinearGradient
          colors={gradientColors}
          locations={gradientLocations}
          start={{x: 0, y: 0}}
          end={{x: 0, y: 1}}
          style={[styles.buttonStyle, btnStyle, buttonStyle]}>
          {rightIcon && rightIcon}
          <Text
            fs="XL"
            color="white"
            style={[styles.textStyle, txtStyle, textStyle]}>
            {title}
          </Text>
          {leftIcon && leftIcon}
        </LinearGradient>
      </TouchableOpacity>
    );
  }
};
const styles = StyleSheet.create({
  buttonStyle: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    height: verticalScale(50),
    width: SCREEN_WIDTH - 32,
    borderRadius: 200,
    marginVertical: moderateScale(8),
    gap: moderateScale(10),
  },
  textStyle: {
    // fontFamily: fonts.InterBold,
    // color: colors.white,
    // fontSize: fontSizes.M,
  },
});
