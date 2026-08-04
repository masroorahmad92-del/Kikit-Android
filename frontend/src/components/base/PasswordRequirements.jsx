import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Text} from './Text';
import {colors, moderateScale} from '../../theme';

export const PasswordRequirements = ({password, show}) => {
  if (!show) return null;

  const requirements = [
    {
      label: 'At least 8 characters',
      met: password.length >= 8,
    },
    {
      label: 'One uppercase letter',
      met: /[A-Z]/.test(password),
    },
    {
      label: 'One lowercase letter',
      met: /[a-z]/.test(password),
    },
    {
      label: 'One number',
      met: /\d/.test(password),
    },
  ];

  return (
    <View style={styles.container}>
      <Text fs="XS" ff="i-regular" color="grey600" style={styles.title}>
        Password must contain:
      </Text>
      {requirements.map((req, index) => (
        <View key={index} style={styles.requirementRow}>
          <View
            style={[
              styles.checkmark,
              req.met ? styles.checkmarkMet : styles.checkmarkUnmet,
            ]}>
            {req.met && (
              <Text fs="XS" ff="i-medium" color="white">
                ✓
              </Text>
            )}
          </View>
          <Text
            fs="XS"
            ff="i-regular"
            color={req.met ? 'success' : 'grey600'}
            style={styles.requirementText}>
            {req.label}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: moderateScale(8),
    paddingHorizontal: moderateScale(4),
  },
  title: {
    marginBottom: moderateScale(6),
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(4),
  },
  checkmark: {
    width: moderateScale(16),
    height: moderateScale(16),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(8),
  },
  checkmarkMet: {
    backgroundColor: colors.success,
  },
  checkmarkUnmet: {
    backgroundColor: colors.grey300,
  },
  requirementText: {
    flex: 1,
  },
});

