import React, {useEffect, useCallback} from 'react';
import {View, StyleSheet, TouchableOpacity, Image, StatusBar, Modal} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  cancelAnimation,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import {Text} from './base/Text';
import {colors, moderateScale, SCREEN_WIDTH} from '../theme';
import HeartFilledIcon from '../assets/icons/HeartFilledIcon';
import HeartIcon from '../assets/icons/HeartIcon';

const CIRCLE_SIZE = moderateScale(155);
const HEART_BADGE_SIZE = moderateScale(52);

// Pre-compute values used in worklets (moderateScale can't run on UI thread)
const FLOAT_Y_120 = moderateScale(120);
const FLOAT_X_25 = moderateScale(25);
const FLOAT_X_10 = moderateScale(10);
const FLOAT_Y_100 = moderateScale(100);
const FLOAT_X_30 = moderateScale(30);
const FLOAT_X_15 = moderateScale(15);
const FLOAT_Y_140 = moderateScale(140);
const FLOAT_X_40 = moderateScale(40);
const FLOAT_X_20 = moderateScale(20);

const ItsAMatch = ({
  visible,
  currentUserImage,
  matchedUserImage,
  matchedUserName = 'Someone',
  sparkContext,
  onStartChatting,
  onKeepSwiping,
}) => {
  // Animation shared values
  const bgOpacity = useSharedValue(0);
  const leftCircleTranslateX = useSharedValue(-SCREEN_WIDTH);
  const rightCircleTranslateX = useSharedValue(SCREEN_WIDTH);
  const leftCircleScale = useSharedValue(0.5);
  const rightCircleScale = useSharedValue(0.5);
  const heartBadgeScale = useSharedValue(0);
  const heartBadgeRotate = useSharedValue(-30);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(30);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(20);
  const buttonsOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(40);
  const floatingHeart1 = useSharedValue(0);
  const floatingHeart2 = useSharedValue(0);
  const floatingHeart3 = useSharedValue(0);
  const sparkle = useSharedValue(0);

  // Cancel all running animations to prevent UI thread leaks
  const cancelAllAnimations = useCallback(() => {
    cancelAnimation(bgOpacity);
    cancelAnimation(leftCircleTranslateX);
    cancelAnimation(rightCircleTranslateX);
    cancelAnimation(leftCircleScale);
    cancelAnimation(rightCircleScale);
    cancelAnimation(heartBadgeScale);
    cancelAnimation(heartBadgeRotate);
    cancelAnimation(titleOpacity);
    cancelAnimation(titleTranslateY);
    cancelAnimation(subtitleOpacity);
    cancelAnimation(subtitleTranslateY);
    cancelAnimation(buttonsOpacity);
    cancelAnimation(buttonsTranslateY);
    cancelAnimation(floatingHeart1);
    cancelAnimation(floatingHeart2);
    cancelAnimation(floatingHeart3);
    cancelAnimation(sparkle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (visible) {
      // Reset all values
      bgOpacity.value = 0;
      leftCircleTranslateX.value = -SCREEN_WIDTH;
      rightCircleTranslateX.value = SCREEN_WIDTH;
      leftCircleScale.value = 0.5;
      rightCircleScale.value = 0.5;
      heartBadgeScale.value = 0;
      heartBadgeRotate.value = -30;
      titleOpacity.value = 0;
      titleTranslateY.value = 30;
      subtitleOpacity.value = 0;
      subtitleTranslateY.value = 20;
      buttonsOpacity.value = 0;
      buttonsTranslateY.value = 40;
      floatingHeart1.value = 0;
      floatingHeart2.value = 0;
      floatingHeart3.value = 0;
      sparkle.value = 0;

      // Background fade in
      bgOpacity.value = withTiming(1, {duration: 400});

      // Left circle slides in from left
      leftCircleTranslateX.value = withDelay(
        200,
        withSpring(0, {damping: 14, stiffness: 90}),
      );
      leftCircleScale.value = withDelay(
        200,
        withSpring(1, {damping: 12, stiffness: 100}),
      );

      // Right circle slides in from right
      rightCircleTranslateX.value = withDelay(
        300,
        withSpring(0, {damping: 14, stiffness: 90}),
      );
      rightCircleScale.value = withDelay(
        300,
        withSpring(1, {damping: 12, stiffness: 100}),
      );

      // Heart badge pops in with bounce
      heartBadgeScale.value = withDelay(
        600,
        withSequence(
          withSpring(1.3, {damping: 6, stiffness: 200}),
          withSpring(1, {damping: 10, stiffness: 150}),
        ),
      );
      heartBadgeRotate.value = withDelay(
        600,
        withSpring(0, {damping: 10, stiffness: 120}),
      );

      // Title slides up and fades in
      titleOpacity.value = withDelay(800, withTiming(1, {duration: 500}));
      titleTranslateY.value = withDelay(
        800,
        withSpring(0, {damping: 14, stiffness: 100}),
      );

      // Subtitle slides up and fades in
      subtitleOpacity.value = withDelay(1000, withTiming(1, {duration: 500}));
      subtitleTranslateY.value = withDelay(
        1000,
        withSpring(0, {damping: 14, stiffness: 100}),
      );

      // Buttons slide up and fade in
      buttonsOpacity.value = withDelay(1200, withTiming(1, {duration: 500}));
      buttonsTranslateY.value = withDelay(
        1200,
        withSpring(0, {damping: 14, stiffness: 100}),
      );

      // Floating hearts - continuous animation
      floatingHeart1.value = withDelay(
        700,
        withRepeat(
          withSequence(
            withTiming(1, {duration: 2500, easing: Easing.out(Easing.ease)}),
            withTiming(0, {duration: 0}),
          ),
          -1,
        ),
      );
      floatingHeart2.value = withDelay(
        1200,
        withRepeat(
          withSequence(
            withTiming(1, {duration: 3000, easing: Easing.out(Easing.ease)}),
            withTiming(0, {duration: 0}),
          ),
          -1,
        ),
      );
      floatingHeart3.value = withDelay(
        900,
        withRepeat(
          withSequence(
            withTiming(1, {duration: 2800, easing: Easing.out(Easing.ease)}),
            withTiming(0, {duration: 0}),
          ),
          -1,
        ),
      );

      // Sparkle pulse
      sparkle.value = withDelay(
        800,
        withRepeat(
          withSequence(
            withTiming(1, {duration: 1200}),
            withTiming(0.3, {duration: 1200}),
          ),
          -1,
          true,
        ),
      );
    } else {
      // Cancel all infinite animations when hidden to prevent UI thread leaks
      cancelAllAnimations();
    }

    // Cleanup on unmount
    return () => {
      cancelAllAnimations();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Animated styles
  const bgAnimatedStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  const leftCircleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {translateX: leftCircleTranslateX.value},
      {scale: leftCircleScale.value},
    ],
  }));

  const rightCircleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {translateX: rightCircleTranslateX.value},
      {scale: rightCircleScale.value},
    ],
  }));

  const heartBadgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {scale: heartBadgeScale.value},
      {rotate: `${heartBadgeRotate.value}deg`},
    ],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{translateY: titleTranslateY.value}],
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{translateY: subtitleTranslateY.value}],
  }));

  const buttonsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{translateY: buttonsTranslateY.value}],
  }));

  // Floating heart animated styles
  const floatingHeart1Style = useAnimatedStyle(() => ({
    opacity: interpolate(floatingHeart1.value, [0, 0.3, 0.7, 1], [0, 1, 1, 0]),
    transform: [
      {
        translateY: interpolate(
          floatingHeart1.value,
          [0, 1],
          [0, -FLOAT_Y_120],
        ),
      },
      {
        translateX: interpolate(
          floatingHeart1.value,
          [0, 0.5, 1],
          [0, FLOAT_X_25, FLOAT_X_10],
        ),
      },
      {
        scale: interpolate(floatingHeart1.value, [0, 0.5, 1], [0.4, 1, 0.6]),
      },
      {
        rotate: `${interpolate(floatingHeart1.value, [0, 1], [0, 15])}deg`,
      },
    ],
  }));

  const floatingHeart2Style = useAnimatedStyle(() => ({
    opacity: interpolate(floatingHeart2.value, [0, 0.3, 0.7, 1], [0, 1, 1, 0]),
    transform: [
      {
        translateY: interpolate(
          floatingHeart2.value,
          [0, 1],
          [0, -FLOAT_Y_100],
        ),
      },
      {
        translateX: interpolate(
          floatingHeart2.value,
          [0, 0.5, 1],
          [0, -FLOAT_X_30, -FLOAT_X_15],
        ),
      },
      {
        scale: interpolate(floatingHeart2.value, [0, 0.5, 1], [0.3, 0.8, 0.5]),
      },
    ],
  }));

  const floatingHeart3Style = useAnimatedStyle(() => ({
    opacity: interpolate(floatingHeart3.value, [0, 0.3, 0.7, 1], [0, 1, 1, 0]),
    transform: [
      {
        translateY: interpolate(
          floatingHeart3.value,
          [0, 1],
          [0, -FLOAT_Y_140],
        ),
      },
      {
        translateX: interpolate(
          floatingHeart3.value,
          [0, 0.5, 1],
          [0, FLOAT_X_40, FLOAT_X_20],
        ),
      },
      {
        scale: interpolate(floatingHeart3.value, [0, 0.5, 1], [0.5, 1.1, 0.4]),
      },
      {
        rotate: `${interpolate(floatingHeart3.value, [0, 1], [0, -20])}deg`,
      },
    ],
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: sparkle.value,
  }));

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={onKeepSwiping}>
      <Animated.View style={[styles.container, bgAnimatedStyle]}>
        <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#01A0FE', '#01A0FE','#B7E5FF','#B7E5FF']}
        start={{x: 0.5, y: 0}}
        end={{x: 0.5, y: 1}}
        style={styles.gradient}>
        {/* Floating Hearts */}
        <Animated.View
          style={[
            styles.floatingHeart,
            styles.floatingHeart1Pos,
            floatingHeart1Style,
          ]}>
          <HeartIcon
            width={moderateScale(18)}
            height={moderateScale(18)}
            fill={colors.secondary}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.floatingHeart,
            styles.floatingHeart2Pos,
            floatingHeart2Style,
          ]}>
          <HeartIcon
            width={moderateScale(14)}
            height={moderateScale(14)}
            fill={colors.secondary}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.floatingHeart,
            styles.floatingHeart3Pos,
            floatingHeart3Style,
          ]}>
          <HeartFilledIcon
            width={moderateScale(16)}
            height={moderateScale(16)}
            fill={colors.secondary}
          />
        </Animated.View>

        {/* User Images Section */}
        <View style={styles.imagesSection}>
          {/* Current User (Left) */}
          <Animated.View style={[styles.circleWrapper, styles.leftCircle, leftCircleAnimatedStyle]}>
            <View style={styles.circleContainer}>
              <View style={styles.circleBorder}>
                <Image
                  source={
                    typeof currentUserImage === 'string'
                      ? {uri: currentUserImage}
                      : currentUserImage
                  }
                  style={styles.userImage}
                  resizeMode="cover"
                />
              </View>
            </View>
          </Animated.View>

          {/* Heart Badge (center overlap) */}
          <Animated.View style={[styles.heartBadge, heartBadgeAnimatedStyle]}>
            <View style={styles.heartBadgeInner}>
              <HeartFilledIcon
                width={moderateScale(26)}
                height={moderateScale(26)}
                fill={colors.secondary}
              />
            </View>
          </Animated.View>

          {/* Matched User (Right) */}
          <Animated.View style={[styles.circleWrapper, styles.rightCircle, rightCircleAnimatedStyle]}>
            <View style={styles.circleContainer}>
              <View style={styles.circleBorder}>
                <Image
                  source={
                    typeof matchedUserImage === 'string'
                      ? {uri: matchedUserImage}
                      : matchedUserImage
                  }
                  style={styles.userImage}
                  resizeMode="cover"
                />
              </View>
            </View>
            {/* Sparkle heart near top-right of right circle */}
            <Animated.View style={[styles.sparkleHeart, sparkleStyle]}>
              <HeartIcon
                width={moderateScale(16)}
                height={moderateScale(16)}
                fill={colors.secondary}
              />
            </Animated.View>
          </Animated.View>
        </View>

        {/* Title */}
        <Animated.View style={[styles.titleContainer, titleAnimatedStyle]}>
          <Text ff="c-Regular" fs="XXXL" color="grey800" style={styles.titleText}>
            Spark{' '}
          </Text>
          <Text ff="c-Regular" fs="XXXL" style={styles.titleHighlight}>
            Connected!
          </Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View style={[styles.subtitleContainer, subtitleAnimatedStyle]}>
          <Text ff="c-Regular" fs="M" color="grey500" style={styles.subtitleText}>
            {sparkContext?.category_name || sparkContext?.interest_name
              ? `You both sparked through ${sparkContext.category_name || sparkContext.interest_name}.`
              : `You and ${matchedUserName} sparked each other.`}
            {'\n'}Open the conversation when you're ready
          </Text>
        </Animated.View>

        {/* Buttons */}
        <Animated.View style={[styles.buttonsContainer, buttonsAnimatedStyle]}>
          {/* Primary action */}
          <TouchableOpacity
            style={styles.startChattingWrapper}
            onPress={onStartChatting}
            activeOpacity={0.85}>
            <LinearGradient
              colors={[colors.secondary, colors.primary]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.startChattingButton}>
              <Text ff="c-Regular" fs="L" style={styles.startChattingText}>
                Open Conversation
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Secondary action */}
          <TouchableOpacity
            style={styles.keepSwipingButton}
            onPress={onKeepSwiping}
            activeOpacity={0.85}>
            <Text ff="c-Regular" fs="L" color="grey800" style={styles.keepSwipingText}>
              Keep Discovering
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: moderateScale(0),
  },
  // Images section
  imagesSection: {
    position: 'relative',
    width: CIRCLE_SIZE * 2 + moderateScale(10),
    height: CIRCLE_SIZE * 1.7,
    marginTop: moderateScale(80),
    marginBottom: moderateScale(30),
  },
  circleWrapper: {
    position: 'absolute',
  },
  leftCircle: {
    zIndex: 2,
    top: 0,
    left: 0,
  },
  rightCircle: {
    zIndex: 1,
    bottom: 0,
    right: 0,
  },
  circleContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  circleBorder: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: moderateScale(3),
    borderColor: colors.white,
    overflow: 'hidden',
  },
  userImage: {
    width: '100%',
    height: '100%',
  },
  // Heart badge
  heartBadge: {
    position: 'absolute',
    zIndex: 10,
    top: CIRCLE_SIZE * 1.7 / 2 - HEART_BADGE_SIZE / 2,
    left: (CIRCLE_SIZE * 2 + moderateScale(10)) / 2 - HEART_BADGE_SIZE / 2,
  },
  heartBadgeInner: {
    width: HEART_BADGE_SIZE,
    height: HEART_BADGE_SIZE,
    borderRadius: HEART_BADGE_SIZE / 2,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.secondary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  // Sparkle heart
  sparkleHeart: {
    position: 'absolute',
    top: -moderateScale(4),
    right: -moderateScale(2),
    zIndex: 5,
  },
  // Floating hearts
  floatingHeart: {
    position: 'absolute',
    zIndex: 5,
  },
  floatingHeart1Pos: {
    top: '25%',
    right: '18%',
  },
  floatingHeart2Pos: {
    top: '35%',
    left: '12%',
  },
  floatingHeart3Pos: {
    top: '20%',
    right: '30%',
  },
  // Title
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(10),
  },
  titleText: {
    fontWeight: '700',
    fontSize: moderateScale(34),
  },
  titleHighlight: {
    fontWeight: '700',
    color: colors.secondary,
    fontSize: moderateScale(34),
  },
  // Subtitle
  subtitleContainer: {
    alignItems: 'center',
    marginBottom: moderateScale(50),
    paddingHorizontal: moderateScale(20),
  },
  subtitleText: {
    textAlign: 'center',
    lineHeight: moderateScale(22),
  },
  // Buttons
  buttonsContainer: {
    position: 'absolute',
    bottom: moderateScale(50),
    left: 0,
    right: 0,
    paddingHorizontal: moderateScale(24),
  },
  startChattingWrapper: {
    marginBottom: moderateScale(14),
    borderRadius: moderateScale(30),
    overflow: 'hidden',
    shadowColor: colors.secondary,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  startChattingButton: {
    height: moderateScale(50),
    borderRadius: moderateScale(30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  startChattingText: {
    color: colors.white,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  keepSwipingButton: {
    paddingVertical: moderateScale(15),
    borderRadius: moderateScale(30),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.grey200,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  keepSwipingText: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default ItsAMatch;
