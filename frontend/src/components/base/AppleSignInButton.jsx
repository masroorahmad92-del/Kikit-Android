import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  View,
  Platform,
} from 'react-native';
import {Text} from './Text';
import {colors, moderateScale, verticalScale, SCREEN_WIDTH} from '../../theme';
import { Apple } from '../../assets/icons';

export const AppleSignInButton = ({onPress, style, disabled = false}) => {
  if (Platform.OS !== 'ios') {
    return null; // Only show on iOS
  }

  return (
    <TouchableOpacity
      style={[styles.button, style, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}>
      <View style={styles.content}>
        {/* Apple Logo */}
        <View style={styles.logoContainer}>
        <Apple/>
        </View>
        
        {/* Button Text */}
        <Text style={styles.buttonText}>Continue with Apple</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.white,
    height: verticalScale(50),
    width: SCREEN_WIDTH - 32,
    borderRadius: moderateScale(12),
    marginVertical: moderateScale(8),
    borderWidth: 1,
    borderColor: colors.grey100,
    shadowColor: colors.grey800,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logoContainer: {
    marginRight: moderateScale(12),
  },
  appleLogo: {
    fontSize: moderateScale(20),
  },
  buttonText: {
    color: colors.grey800,
    fontSize: moderateScale(16),
    fontWeight: '600',
    fontFamily: 'System',
  },
  disabled: {
    opacity: 0.5,
  },
});
