import React, {useRef, useEffect, useState, useImperativeHandle, forwardRef} from 'react';
import {Animated, StyleSheet, View, TouchableOpacity} from 'react-native';
import DatePicker from 'react-native-date-picker';
import {Text} from '../base/Text';
import {Input} from '../base/Input';
import {colors, fonts, moderateScale} from '../../theme';
import { Calendar } from '../../assets/icons';

const ComponentTwo = forwardRef(({isVisible, birthday, setBirthday}, ref) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const errorShakeAnim = useRef(new Animated.Value(0)).current;
  const errorOpacityAnim = useRef(new Animated.Value(0)).current;
  const inputShakeAnim = useRef(new Animated.Value(0)).current;
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMounted, setDatePickerMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date(2000, 0, 1));
  const [dateError, setDateError] = useState('');

  const triggerErrorAnimation = () => {
    // Shake animation for error text
    Animated.sequence([
      Animated.timing(errorShakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(errorShakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(errorShakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(errorShakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Shake animation for input field
    Animated.sequence([
      Animated.timing(inputShakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(inputShakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(inputShakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(inputShakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Fade in error message
    Animated.timing(errorOpacityAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Expose validation method to parent
  useImperativeHandle(ref, () => ({
    validate: () => {
      if (!birthday || birthday.trim().length === 0) {
        setDateError('Birthday is required');
        triggerErrorAnimation();
        return false;
      }
      // Parse the birthday and validate age
      const dateParts = birthday.split('/');
      if (dateParts.length === 3) {
        const birthDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
        const age = calculateAge(birthDate);
        if (age < 18) {
          setDateError('Sorry, you must be 18 or older to join Kikit');
          triggerErrorAnimation();
          return false;
        }
      }
      setDateError('');
      return true;
    },
  }));

  useEffect(() => {
    if (isVisible) {
      // Entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Exit animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -30,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, fadeAnim, slideAnim]);

  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  const validateAge = (date) => {
    const age = calculateAge(date);

    if (age < 18) {
      setDateError('Sorry, you must be 18 or older to join Kikit');
      triggerErrorAnimation();
      return false;
    }

    // Clear error when valid
    if (dateError) {
      Animated.timing(errorOpacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setDateError('');
      });
    }
    return true;
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    const formattedDate = formatDate(date);
    setBirthday(formattedDate);
    validateAge(date);
  };

  const openDatePicker = () => {
    if (!datePickerMounted) {
      // Mount the DatePicker first
      setDatePickerMounted(true);
      // Then show it in the next frame to avoid blocking
      requestAnimationFrame(() => {
        setShowDatePicker(true);
      });
    } else {
      setShowDatePicker(true);
    }
  };

  const closeDatePicker = () => {
    setShowDatePicker(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{translateY: slideAnim}],
        },
      ]}>
      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text fs="XXXL" color="grey800" style={styles.title}>
          When's your
          <Text color="primary"> birthday?</Text>
        </Text>
        <Text fs="M" ff="c-medium" color="grey800" style={styles.subtitle}>
          You must be 18 or older to use this app
        </Text>
      </View>

      {/* Birthday Input */}
      <View style={styles.inputSection}>
        <Animated.View
          style={{
            transform: [{translateX: inputShakeAnim}],
          }}>
          <TouchableOpacity onPress={openDatePicker} style={styles.inputContainer}>
            <Input
              placeholderColor={colors.grey800}
              placeholder="DD/MM/YYYY"
              value={birthday}
              onChangeText={setBirthday}
              style={[
                styles.birthdayInput,
                dateError && styles.birthdayInputError,
              ]}
              editable={false}
              pointerEvents="none"
            />
            <View style={styles.calendarIcon}>
              <Calendar width={22} height={22} fill={colors.grey400} />
            </View>
          </TouchableOpacity>
        </Animated.View>
        {dateError ? (
          <Animated.Text
            style={[
              styles.errorText,
              {
                opacity: errorOpacityAnim,
                transform: [{translateX: errorShakeAnim}],
              },
            ]}>
            {dateError}
          </Animated.Text>
        ) : null}
      </View>

      {/* Date Picker Modal - Lazy loaded */}
      {datePickerMounted && (
        <DatePicker
          modal
          open={showDatePicker}
          date={selectedDate}
          mode="date"
          onConfirm={(date) => {
            handleDateChange(date);
            closeDatePicker();
          }}
          onCancel={closeDatePicker}
          maximumDate={(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 18); return d; })()}
          minimumDate={new Date(1900, 0, 1)}
          theme="dark"
        />
      )}

    </Animated.View>
  );
});

ComponentTwo.displayName = 'ComponentTwo';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: 'center',
    paddingHorizontal: moderateScale(20),
  },
  titleSection: {
    // alignItems: 'center',
    marginBottom: moderateScale(40),
  },
  title: {
    // textAlign: 'center',
    lineHeight: 40,
    marginBottom: moderateScale(12),
  },
  subtitle: {
    // textAlign: 'center',
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: moderateScale(40),
  },
  inputContainer: {
    position: 'relative',
  },
  birthdayInput: {
    backgroundColor: colors.grey400,
    borderColor: colors.grey400,
    borderWidth: 1,
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    paddingRight: moderateScale(50),
    fontSize: moderateScale(16),
    fontFamily: fonts.CabinetRegular,
    color: colors.grey800,
  },
  birthdayInputError: {
    borderColor: colors.error || '#EF4444',
    borderWidth: 2,
  },
  calendarIcon: {
    position: 'absolute',
    right: moderateScale(20),
    top: '45%',
    transform: [{translateY: -10}],
  },
  errorText: {
    marginTop: moderateScale(8),
    marginLeft: moderateScale(4),
    color: colors.error || '#EF4444',
    fontSize: moderateScale(14),
    fontFamily: fonts.CabinetMedium,
  },
});

export default ComponentTwo;
