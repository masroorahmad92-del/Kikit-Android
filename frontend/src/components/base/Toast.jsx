import React, { useEffect } from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, SCREEN_WIDTH, moderateScale } from '../../theme';
import { Text } from './Text';
import { CloseIcon, CheckDouble } from '../../assets/icons';

export const ToastCard = props => {
  const { text, red } = props;

  // Animation values
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    // Animate in
    translateY.value = withSpring(0, {
      damping: 15,
      stiffness: 150,
    });
    opacity.value = withTiming(1, { duration: 300 });
    scale.value = withSpring(1, {
      damping: 12,
      stiffness: 150,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  const handleClose = () => {
    translateY.value = withTiming(-100, { duration: 250 });
    opacity.value = withTiming(0, { duration: 250 });
    scale.value = withTiming(0.8, { duration: 250 }, () => {
      Toast?.hide?.();
    });
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View
        style={[
          styles.mainCont,
          red
            ? { backgroundColor: colors.danger }
            : { backgroundColor: colors.primary },
          Platform.OS === 'ios' && styles.shadowIOS,
          Platform.OS === 'android' && styles.shadowAndroid,
        ]}>
        <Pressable style={styles.iconCont} onPress={handleClose}>
          {red ? (
            <CloseIcon
              height={moderateScale(20)}
              width={moderateScale(20)}
              fill={colors.white}
            />
          ) : (
            <CheckDouble
              height={moderateScale(20)}
              width={moderateScale(20)}
              stroke={colors.white}
            />
          )}
        </Pressable>

        <View style={styles.textCont}>
          <Text ff={'i-medium'} fs={'M'} color={'white'}>
            {text}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  mainCont: {
    width: SCREEN_WIDTH * 0.9,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(16),
    minHeight: moderateScale(56),
  },
  iconCont: {
    width: moderateScale(24),
    height: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  textCont: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  shadowIOS: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  shadowAndroid: {
    elevation: 8,
  },
});
