import React, {useRef, useEffect, useState, useImperativeHandle, forwardRef} from 'react';
import {
  Animated,
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native';
import {Text} from '../base/Text';
import {colors, fonts, moderateScale} from '../../theme';

// const {height: SCREEN_HEIGHT} = Dimensions.get('window');
const ITEM_HEIGHT = moderateScale(60);
const FOCUS_OFFSET = moderateScale(70); // Move focus slightly below center

const ComponentSeven = forwardRef(({isVisible, height, setHeight}, ref) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  const [selectedHeight, setSelectedHeight] = useState(height);
  const [heightError, setHeightError] = useState('');
  const hasScrolledToInitial = useRef(false);

  // Expose validation method to parent
  useImperativeHandle(ref, () => ({
    validate: () => {
      if (!height || height.trim().length === 0) {
        setHeightError('Please select your height');
        return false;
      }
      setHeightError('');
      return true;
    },
  }));

  const generateHeightOptions = () => {
    const heights = [];
    for (let cm = 140; cm <= 200; cm++) {
      const feet = Math.floor(cm / 30.48);
      const inches = Math.round((cm % 30.48) / 2.54);
      const heightString = `${cm} cm (${feet}'${inches}")`;
      heights.push({
        value: heightString,
        cm,
        feet,
        inches,
      });
    }
    return heights;
  };

  const heightOptions = generateHeightOptions();

  // Scroll to selected height when component becomes visible
  useEffect(() => {
    if (isVisible && height && scrollViewRef.current) {
      // Find the index of the selected height
      const selectedIndex = heightOptions.findIndex(option => option.value === height);
      
      if (selectedIndex !== -1) {
        // Small delay to ensure ScrollView is ready
        setTimeout(() => {
          if (scrollViewRef.current) {
            const targetScrollY = selectedIndex * ITEM_HEIGHT;
            scrollViewRef.current.scrollTo({
              y: Math.max(0, targetScrollY),
              animated: !hasScrolledToInitial.current, // Animate only on first scroll
            });
            hasScrolledToInitial.current = true;
          }
        }, 100);
      }
    }

    // Reset flag when component is hidden
    if (!isVisible) {
      hasScrolledToInitial.current = false;
    }
  }, [isVisible, height]);

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -30,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, fadeAnim, slideAnim]);

  const handleHeightSelect = (heightValue) => {
    setSelectedHeight(heightValue);
    setHeight(heightValue);

    // Clear error when height is selected
    if (heightError) {
      setHeightError('');
    }

    // Find the index of the selected height
    const selectedIndex = heightOptions.findIndex(option => option.value === heightValue);
    if (selectedIndex !== -1 && scrollViewRef.current) {
      // Calculate the scroll position to center the selected item
      const targetScrollY = selectedIndex * ITEM_HEIGHT;

      // Animate the scrollY value for smooth visual feedback
      Animated.timing(scrollY, {
        toValue: targetScrollY,
        duration: 400, // Smooth animation duration
        useNativeDriver: true,
      }).start();

      // Scroll the ScrollView with smooth animation
      scrollViewRef.current.scrollTo({
        y: Math.max(0, targetScrollY),
        animated: true,
      });
    }
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
          What's your
          <Text color="primary"> height?</Text>
        </Text>
        <Text fs="M" ff="c-medium" color="grey800" style={styles.subtitle}>
          Share your height to help others get to know you better.
        </Text>
      </View>

      {/* Height Scroll Picker */}
      <View style={styles.heightSection}>
        <Animated.ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingTop: FOCUS_OFFSET,
            paddingBottom: FOCUS_OFFSET + moderateScale(100),
          }}
          onScroll={Animated.event(
            [{nativeEvent: {contentOffset: {y: scrollY}}}],
            {useNativeDriver: true},
          )}>
          {heightOptions.map((option, index) => {
            // Adjust focus downward using FOCUS_OFFSET
            const inputRange = [
              (index - 2) * ITEM_HEIGHT,
              (index - 1) * ITEM_HEIGHT,
              index * ITEM_HEIGHT,
              (index + 1) * ITEM_HEIGHT,
              (index + 2) * ITEM_HEIGHT,
            ];

            const scale = scrollY.interpolate({
              inputRange,
              outputRange: [0.85, 0.9, 1.1, 0.9, 0.85],
              extrapolate: 'clamp',
            });

            const opacity = scrollY.interpolate({
              inputRange,
              outputRange: [0.3, 0.6, 1, 0.6, 0.3],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.heightOption,
                  selectedHeight === option.value && styles.heightOptionSelected,
                  {
                    transform: [{scale}],
                    opacity,
                  },
                ]}>
                <TouchableOpacity
                  onPress={() => handleHeightSelect(option.value)}
                  activeOpacity={0.7}>
                  <Text
                    fs="M"
                    color={selectedHeight === option.value ? 'grey800' : 'grey400'}
                    style={[
                      styles.heightText,
                      selectedHeight === option.value && styles.heightTextSelected,
                    ]}>
                    {option.value}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </Animated.ScrollView>
      </View>

      {/* Error Display */}
      {heightError ? (
        <View style={styles.errorContainer}>
          <Text fs="S" color="danger" style={styles.errorText}>
            {heightError}
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
});

ComponentSeven.displayName = 'ComponentSeven';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: 'center',
    paddingHorizontal: moderateScale(20),
  },
  titleSection: {
    // alignItems: 'center',
    marginBottom: moderateScale(30),
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
  heightSection: {
    flex: 1,
    maxHeight: moderateScale(480),
  },
  heightOption: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: moderateScale(20),
    marginVertical: 2,
    alignSelf: 'center',
    width: 200,
  },
  heightOptionSelected: {
    backgroundColor: '#F8F0FC',
    borderColor: colors.primary,
    borderWidth: 1,
  },
  heightText: {
    textAlign: 'center',
    fontFamily: fonts.CabinetRegular,
    color: colors.grey800,
  },
  heightTextSelected: {
    fontFamily: fonts.CabinetBold,
  },
  errorContainer: {
    marginTop: moderateScale(20),
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
  },
});

export default ComponentSeven;