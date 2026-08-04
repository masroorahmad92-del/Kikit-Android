import {StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import React, {forwardRef, useImperativeHandle, useState} from 'react';
import FastImage from 'react-native-fast-image';
import {createShimmerPlaceholder} from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';
import {colors, moderateScale} from '../theme';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import {SHIMMER_COLORS} from '../constants/shimmer';
import {getPrimaryPhoto} from '../utils/helpers';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

const Card = forwardRef(({
  item,
  index,
  dataLength,
  maxVisibleItem,
  currentIndex,
  animatedValue,
  setNewData,
  setCurrentIndex,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
}, ref) => {
  const {width, height} = useWindowDimensions();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const direction = useSharedValue(0);
  const scale = useSharedValue(1);
  const cardOpacity = useSharedValue(1);
  const [imageLoading, setImageLoading] = useState(true);
// console.log('Card rendered for item:', item?.originalData?.photos);
  // Use primary photo from originalData if available, fallback to item.image
  const primaryPhoto = getPrimaryPhoto(item?.originalData?.photos);
  const profileImage = primaryPhoto ? {uri: primaryPhoto.url} : item.image;

  // Check if image is remote (has uri) or local (require)
  const isRemoteImage = profileImage && typeof profileImage === 'object' && profileImage.uri;

  // Expose swipe methods to parent component
  useImperativeHandle(ref, () => ({
    swipeLeft: () => {
      direction.value = -1;
      translateX.value = withTiming(-width, {duration: 300}, (finished) => {
        if (finished) {
          runOnJS(setCurrentIndex)(currentIndex + 1);
          if (onSwipeLeft) {
            runOnJS(onSwipeLeft)(item);
          }
        }
      });
      animatedValue.value = withTiming(currentIndex + 1);
    },
    swipeRight: () => {
      direction.value = 1;
      translateX.value = withTiming(width, {duration: 300}, (finished) => {
        if (finished) {
          runOnJS(setCurrentIndex)(currentIndex + 1);
          if (onSwipeRight) {
            runOnJS(onSwipeRight)(item);
          }
        }
      });
      animatedValue.value = withTiming(currentIndex + 1);
    },
  }));

  const pan = Gesture.Pan()
    .onUpdate(e => {
      if (currentIndex === index) {
        // Only handle horizontal swipes visually — swipe up is detected on end
        if (Math.abs(e.translationX) > Math.abs(e.translationY)) {
          // Horizontal swipe logic
          const isSwipeRight = e?.translationX > 0;
          direction.value = isSwipeRight ? 1 : -1;
          translateX.value = e.translationX;
          animatedValue.value = interpolate(
            Math.abs(e.translationX),
            [0, width],
            [index, index + 1],
          );
        }
      }
    })
    .onEnd(e => {
      if (currentIndex === index) {
        // Check for swipe up — open profile details instantly without moving the card
        if (
          e.translationY < -80 &&
          Math.abs(e.translationY) > Math.abs(e.translationX)
        ) {
            if (onSwipeUp) {
              runOnJS(onSwipeUp)(item);
            }
            return;
          }

          // Horizontal swipe logic
          if (Math.abs(e.translationX) > 150 || Math.abs(e.velocityX) > 1000) {
          const swipeDirection = direction.value;
          translateX.value = withTiming(width * direction.value, {duration: 300}, (finished) => {
            if (finished) {
              runOnJS(setCurrentIndex)(currentIndex + 1);
              if (swipeDirection > 0 && onSwipeRight) {
                runOnJS(onSwipeRight)(item);
              } else if (swipeDirection < 0 && onSwipeLeft) {
                runOnJS(onSwipeLeft)(item);
              }
            }
          });
          animatedValue.value = withTiming(currentIndex + 1);
        } else {
          // Reset if swipe wasn't strong enough
          translateX.value = withTiming(0, {duration: 500});
          translateY.value = withTiming(0, {duration: 500});
          scale.value = withTiming(1, {duration: 500});
          cardOpacity.value = withTiming(1, {duration: 500});
        }
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const currentItem = index === currentIndex;
    const rotateZ = interpolate(
      Math.abs(translateX.value),
      [0, width],
      [0, 20],
    );

    const translateYValue = interpolate(
      animatedValue.value,
      [index - 1, index],
      [-33, 0],
    );
    const scaleValue = interpolate(
      animatedValue.value,
      [index - 1, index],
      [0.9, 1],
    );
    const opacity = interpolate(
      animatedValue.value + maxVisibleItem,
      [index, index + 1],
      [0, 1],
    );

    return {
      transform: [
        {translateX: translateX.value},
        {translateY: currentItem ? translateY.value : translateYValue},
        {scale: currentItem ? scale.value : scaleValue},
        {rotateZ: currentItem ? `${direction.value * rotateZ}deg` : '0deg'},
      ],
      opacity: currentItem ? cardOpacity.value : (index < maxVisibleItem + currentIndex ? 1 : opacity),
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          styles.container,
          {zIndex: dataLength - index},
          animatedStyle,
        ]}>
        {/* Shimmer Placeholder */}
        <ShimmerPlaceholder
          visible={!imageLoading}
          style={styles.cardImage}
          shimmerColors={SHIMMER_COLORS}>
          {isRemoteImage ? (
            <FastImage
              source={profileImage}
              style={styles.cardImage}
              resizeMode={FastImage.resizeMode.cover}
              priority={FastImage.priority.high}
              cache={FastImage.cacheControl.immutable}
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
            />
          ) : (
            <FastImage
              source={profileImage}
              style={styles.cardImage}
              resizeMode={FastImage.resizeMode.cover}
              priority={FastImage.priority.high}
              cache={FastImage.cacheControl.immutable}
              onLoadEnd={() => setImageLoading(false)}
            />
          )}
        </ShimmerPlaceholder>
        <View style={styles.cardOverlay}>
          <Text style={styles.cardName}>{item.name}, {item.age}</Text>
          <Text style={styles.cardDistance}>{item.distance}</Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    marginBottom: 10,
    position: 'absolute',
    width: moderateScale(380),
    height: moderateScale(510),
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  cardName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardDistance: {
    fontSize: 14,
    color: '#FFFFFF',
  },
});

export default Card;