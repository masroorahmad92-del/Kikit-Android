import React, {useEffect, useState} from 'react';
import {View, TextInput, StyleSheet, TouchableOpacity} from 'react-native';

import {Text} from './Text';
import {colors, fonts, fontSizes, moderateScale, verticalScale} from '../../theme';
import {Eye, EyeOff} from '../../assets/icons';
// import {
//   Colors,
//   FontSizes,
//   Fonts,
//   Svgs,
//   moderateScale,
//   verticalScale
// } from "../../theme"

export const Input = props => {
  const {
    error,
    inputWrapperStyle,
    inputWrapperErrorStyle,
    inputStyle,
    errorStyle,
    containerStyle,
    placeholder = 'Enter phone number',
    placeholderColor = colors.grey400,
    onChangeText,
    type = 'input',
    value,
    secureTextEntry = false,
    incrementer = false,
    icon,
    pressableIcon = null,
    onIconPress = null,
    leftIcon,
    onLeftIconPress,
    title,
    phoneMask = false,
    maskPattern = '(XXX) XXX-XXXX',
    disabled = false,
  } = props;

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [numericValue, setNumericValue] = useState(value?.toString());
  const [isFocused, setIsFocused] = useState(false);
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(prev => !prev);
  };

  useEffect(() => {
    if (incrementer) {
      setNumericValue(value?.toString());
    }
  }, [value, incrementer]);

  const handleIncrement = () => {
    //Explain this function

    const newValue = parseInt(numericValue, 10) + 1;
    setNumericValue(newValue.toString());
    onChangeText(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(parseInt(numericValue, 10) - 1, 0);
    setNumericValue(newValue.toString());
    onChangeText(newValue);
  };

  const handleTextChange = text => {
    const numericText = text.replace(/\D/g, ''); // Allow only numeric characters
    setNumericValue(numericText);
    onChangeText(text);
  };

  const applyPhoneMask = (text) => {
    if (!phoneMask) {
      return text;
    }

    const cleaned = text.replace(/\D/g, '');
    let masked = maskPattern;
    let index = 0;

    for (let i = 0; i < masked.length && index < cleaned.length; i++) {
      if (masked[i] === 'X') {
        masked = masked.substring(0, i) + cleaned[index] + masked.substring(i + 1);
        index++;
      }
    }

    return masked;
  };

  const handlePhoneTextChange = (text) => {
    const maskedText = applyPhoneMask(text);
    onChangeText(maskedText);
  };

  const wrapperErrorStyle = error
    ? {
        borderWidth: 1,
        borderColor: colors.danger,
        ...inputWrapperErrorStyle,
      }
    : {};

  return (
    <View style={[styles.containerStyle, containerStyle]}>
      {title && (
        <Text ff="medium" fs="XS" color="grey700">
          {title}
        </Text>
      )}
      <View style={[styles.inputWrapper, inputWrapperStyle, wrapperErrorStyle, disabled && styles.disabledWrapper, isFocused && styles.focused]}>
        {onLeftIconPress && leftIcon && (
          <TouchableOpacity
            style={styles.leftIcon}
            onPress={onLeftIconPress}
            activeOpacity={0.7}>
            {leftIcon}
          </TouchableOpacity>
        )}

        <TextInput
         onFocus={() => setIsFocused(true)}
         onBlur={() => setIsFocused(false)}
          {...props}
          style={[
            styles.input,
            type === 'textarea'
              ? styles.textareaInput
              : styles.regularInput,
            disabled && styles.disabledInput,
            inputStyle,
          ]}
          selectionColor={colors.primary}
          placeholderTextColor={placeholderColor}
          placeholder={placeholder}
          onChangeText={incrementer ? handleTextChange : phoneMask ? handlePhoneTextChange : onChangeText}
          value={incrementer ? numericValue : value}
          multiline={type === 'textarea'}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          editable={!disabled}
        />
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={togglePasswordVisibility}
            activeOpacity={0.7}>
            {isPasswordVisible ? (
              <Eye width={20} height={20} stroke={colors.grey500} />
            ) : (
              <EyeOff width={20} height={20} stroke={colors.grey500} />
            )}
          </TouchableOpacity>
        )}
        {onIconPress && pressableIcon && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={onIconPress}
            activeOpacity={0.7}>
            {pressableIcon}
          </TouchableOpacity>
        )}

        {icon && <View style={styles.eyeIcon}>{icon}</View>}
        {incrementer && (
          <View style={styles.incrementerContainer}>
            <TouchableOpacity
              style={styles.incrementerIcon}
              onPress={handleIncrement}>
              <Text>▲</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.incrementerIcon}
              onPress={handleDecrement}>
              <Text>▼</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      {error ? <Text style={[styles.error, errorStyle]}>{error}</Text> : null}
    </View>
  );
};
const styles = StyleSheet.create({
  containerStyle: {
    marginTop: moderateScale(6),
    marginBottom: moderateScale(10),
    gap: moderateScale(5),
  },
  inputWrapper: {
    borderRadius: moderateScale(25), // Pill-shaped rounded corners
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: colors.gradientBG, // Light blue background
    borderWidth: 1,
    borderColor: colors.grey100, // White border
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(6),
    shadowColor: colors.grey800,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  input: {
    flex: 1,
    paddingHorizontal: moderateScale(15),
    fontSize: moderateScale(18), // Larger font size
    fontFamily: fonts.CabinetRegular,
    color: colors.grey800, // Dark grey text color
    textAlign: 'left', // Left-aligned text
  },
  eyeIcon: {
    padding: moderateScale(10),
  },
  rightIcon: {
    paddingRight: moderateScale(10),
    paddingLeft: moderateScale(5),
  },
  leftIcon: {
    paddingLeft: moderateScale(10),
    paddingRight: moderateScale(0),
  },
  error: {
    marginTop: moderateScale(3),
    color: colors.danger,
    fontSize: fontSizes.XS,
    fontFamily: fonts.CabinetRegular,
    fontWeight: '400',
  },
  incrementerContainer: {
    alignItems: 'center',
  },
  incrementerIcon: {
    paddingHorizontal: moderateScale(10),
  },
  textareaInput: {
    minHeight: verticalScale(180),
    maxHeight: verticalScale(200),
    textAlignVertical: 'top',
    borderRadius: moderateScale(16),
    paddingTop: moderateScale(13),
  },
  regularInput: {
    height: verticalScale(38),
  },
  disabledWrapper: {
    opacity: 0.6,
    backgroundColor: colors.grey200,
  },
  disabledInput: {
    color: colors.grey500,
  },
  focused: {
    borderColor: colors.primary, // focus color
  },
});
