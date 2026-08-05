import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { moderateScale } from '../theme';
import {formatAnnouncementMessage} from '../utils/giftDisplay';

const {width: screenWidth} = Dimensions.get('window');

const DEFAULT_NEWS = [
  'Maya hosted a Travel room',
  'David just gifted Emily a Diamond',
  'Sarah started a conversation through Music',
  'Alex sent a gift to Lisa',
  'Emma discovered a new shared interest',
];

const RotatingBanner = ({newsItems}) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const rawItems = newsItems && newsItems.length > 0 ? newsItems : DEFAULT_NEWS;
  const items = rawItems.map(item => formatAnnouncementMessage(item));

  useEffect(() => {
    // Reset and restart animation when items change
    scrollX.setValue(0);
    const animation = Animated.loop(
      Animated.timing(scrollX, {
        toValue: -screenWidth * 2,
        duration: Math.max(items.length * 3000, 15000),
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [scrollX, items]);

  return (
    <LinearGradient
      colors={['#FF2C79', '#BD00FF']}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 0}}
      style={styles.container}>
      <View style={styles.bannerContainer}>
        <Animated.View
          style={[
            styles.textContainer,
            {
              transform: [{translateX: scrollX}],
            },
          ]}>
          {items.map((item, index) => (
            <Text key={index} style={styles.bannerText}>
              {item}
            </Text>
          ))}
          {/* Duplicate items for seamless loop */}
          {items.map((item, index) => (
            <Text key={`duplicate-${index}`} style={styles.bannerText}>
              {item}
            </Text>
          ))}
        </Animated.View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    height: moderateScale(30),
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerContainer: {
    flexDirection: 'row',
    overflow: 'hidden',
    width: screenWidth,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 50,
    whiteSpace: 'nowrap',
  },
});

export default RotatingBanner;
