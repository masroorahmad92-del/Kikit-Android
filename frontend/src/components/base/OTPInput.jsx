import React, {useRef, useState, useEffect} from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {Text} from './Text';
import {colors, moderateScale, verticalScale} from '../../theme';

const OTPInput = ({onChangeText, value = '', length = 4}) => {
  const [otp, setOtp] = useState(value.split(''));
  const inputRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (value) {
      setOtp(value.split(''));
    }
  }, [value]);

  const handleTextChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Move to next input if text is entered
    if (text && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }

    // Move to previous input if text is deleted
    if (!text && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setActiveIndex(index - 1);
    }

    onChangeText?.(newOtp.join(''));
  };

  const handleKeyPress = (key, index) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setActiveIndex(index - 1);
    }
  };

  const handleFocus = index => {
    setActiveIndex(index);
  };

  return (
    <View style={styles.container}>
      {Array.from({length}, (_, index) => (
        <View key={index} style={styles.inputContainer}>
          <TextInput
            ref={ref => (inputRefs.current[index] = ref)}
            style={[
              styles.input,
              {
                borderColor:
                  activeIndex === index ? colors.primary : colors.grey100,
              },
            ]}
            value={otp[index] || ''}
            onChangeText={text => handleTextChange(text, index)}
            onKeyPress={({nativeEvent}) => handleKeyPress(nativeEvent.key, index)}
            onFocus={() => handleFocus(index)}
            keyboardType="numeric"
            maxLength={1}
            textAlign="center"
            placeholder="-"
            placeholderTextColor={colors.grey400}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: moderateScale(16),
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    borderWidth: 1,
    fontSize: moderateScale(24),
    fontFamily: 'CabinetGrotesk-Bold',
    color: colors.grey800,
    backgroundColor: colors.white,
    shadowColor: colors.grey800,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default OTPInput;
