import React, {useEffect} from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import {HeartFilledIcon, Close} from '../assets/icons';
import {colors} from '../theme';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// Heart particle component
const HeartParticle = ({index, delay, isLike}) => {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  useEffect(() => {
    const angle = (index * 360) / 12; // 12 hearts in a circle
    const radius = 100 + Math.random() * 50;
    const radians = (angle * Math.PI) / 180;
    const finalX = Math.cos(radians) * radius;
    const finalY = Math.sin(radians) * radius - 100;

    translateX.value = withDelay(
      delay,
      withTiming(finalX, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      })
    );
    translateY.value = withDelay(
      delay,
      withTiming(finalY, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      })
    );
    scale.value = withDelay(
      delay,
      withSequence(
        withTiming(1.2, {duration: 200, easing: Easing.out(Easing.cubic)}),
        withTiming(0.8, {duration: 300}),
        withTiming(0, {duration: 300})
      )
    );
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, {duration: 200}),
        withTiming(0.8, {duration: 300}),
        withTiming(0, {duration: 300})
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {translateX: translateX.value},
      {translateY: translateY.value},
      {scale: scale.value},
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.particle, animatedStyle]}>
      {isLike ? (
        <HeartFilledIcon width={24} height={24} fill={colors.secondary} />
      ) : (
        <Close width={24} height={24} fill={colors.danger} />
      )}
    </Animated.View>
  );
};

// Main animation component
const LikeDislikeAnimation = ({visible, type, onComplete}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);
  const iconScale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Main icon animation
      iconScale.value = withSequence(
        withTiming(1.5, {
          duration: 200,
          easing: Easing.out(Easing.cubic),
        }),
        withTiming(1, {
          duration: 200,
          easing: Easing.in(Easing.cubic),
        }),
        withTiming(1.2, {
          duration: 150,
        }),
        withTiming(1, {
          duration: 150,
        })
      );

      // Background circle animation
      scale.value = withSequence(
        withTiming(1, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        }),
        withTiming(0, {
          duration: 400,
          delay: 500,
        })
      );

      opacity.value = withSequence(
        withTiming(1, {duration: 200}),
        withTiming(0.8, {duration: 300, delay: 500}),
        withTiming(0, {duration: 400})
      );

      rotation.value = withRepeat(
        withTiming(360, {
          duration: 1000,
          easing: Easing.linear,
        }),
        1,
        false
      );

      // Call onComplete after animation finishes
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 1200);
    } else {
      // Reset values
      scale.value = 0;
      opacity.value = 0;
      iconScale.value = 0;
      rotation.value = 0;
    }
  }, [visible]);

  const backgroundStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
    opacity: opacity.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      {scale: iconScale.value},
      {rotate: `${rotation.value}deg`},
    ],
  }));

  if (!visible) return null;

  const isLike = type === 'like';
  const backgroundColor = isLike ? colors.secondary : colors.danger;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Background circle */}
      <Animated.View
        style={[
          styles.backgroundCircle,
          {backgroundColor: backgroundColor + '40'},
          backgroundStyle,
        ]}
      />

      {/* Main icon */}
      <Animated.View style={[styles.iconContainer, iconStyle]}>
        {isLike ? (
          <HeartFilledIcon width={80} height={80} fill={colors.secondary} />
        ) : (
          <Close width={80} height={80} fill={colors.danger} />
        )}
      </Animated.View>

      {/* Particle effects */}
      {Array.from({length: 12}).map((_, index) => (
        <HeartParticle
          key={index}
          index={index}
          delay={index * 30}
          isLike={isLike}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: SCREEN_HEIGHT / 2 - 100,
    left: SCREEN_WIDTH / 2 - 100,
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  backgroundCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
  },
  particle: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LikeDislikeAnimation;

