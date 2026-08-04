import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  runOnJS,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import {colors} from '../theme/colors';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

const ProfileDetail = ({visible, onClose, item}) => {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const scrollOffset = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, {duration: 400});
      scale.value = withTiming(1, {duration: 400});
      opacity.value = withTiming(1, {duration: 400});
    } else {
      translateY.value = SCREEN_HEIGHT;
      scale.value = 0.8;
      opacity.value = 0;
    }
  }, [visible]);

  const handleClose = () => {
    onClose();
  };

  // Track scroll position
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollOffset.value = event.contentOffset.y;
    },
  });

  // Pan gesture for the entire modal
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      // Only allow closing when scrolled to top
      if (scrollOffset.value <= 0 && e.translationY > 0) {
        translateY.value = e.translationY;
        const progress = Math.min(e.translationY / SCREEN_HEIGHT, 1);
        opacity.value = 1 - progress * 0.7;
        scale.value = 1 - progress * 0.1;
      }
    })
    .onEnd((e) => {
      // Close if dragged down enough or fast enough (only when at top)
      if (scrollOffset.value <= 0 && (e.translationY > 100 || e.velocityY > 500)) {
        translateY.value = withTiming(SCREEN_HEIGHT, {duration: 300});
        opacity.value = withTiming(0, {duration: 300});
        scale.value = withTiming(0.8, {duration: 300}, (finished) => {
          if (finished) {
            runOnJS(handleClose)();
          }
        });
      } else {
        // Snap back to original position
        translateY.value = withTiming(0, {duration: 300});
        opacity.value = withTiming(1, {duration: 300});
        scale.value = withTiming(1, {duration: 300});
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {translateY: translateY.value},
      {scale: scale.value},
    ],
    opacity: opacity.value,
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * 0.5,
  }));

  if (!visible) return null;

  return (
    <>
      {/* Backdrop - tap to close */}
      <TouchableOpacity 
        style={StyleSheet.absoluteFill} 
        activeOpacity={1} 
        onPress={handleClose}
      >
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </TouchableOpacity>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.modalContainer, animatedStyle]}>
          {/* Drag handle */}
          <View style={styles.header}>
            <View style={styles.dragHandle} />
          </View>

          <Animated.ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            bounces={true}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
          >
            <Image source={item.image} style={styles.profileImage} resizeMode="cover" />
            
            <View style={styles.infoSection}>
              <Text style={styles.name}>{item.name}, {item.age}</Text>
              <Text style={styles.distance}>{item.distance}</Text>
              <Text style={styles.location}>{item.location}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Interests</Text>
              <View style={styles.tagsContainer}>
                {item.interests.map((interest, idx) => (
                  <View key={idx} style={styles.tag}>
                    <Text style={styles.tagText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hobbies</Text>
              <View style={styles.tagsContainer}>
                {item.hobbies.map((hobby, idx) => (
                  <View key={idx} style={styles.tag}>
                    <Text style={styles.tagText}>{hobby}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={{height: 100}} />
          </Animated.ScrollView>

          {/* Close button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </GestureDetector>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 1000,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: colors.grey400,
    borderRadius: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileImage: {
    width: '100%',
    height: 400,
    borderRadius: 20,
    marginBottom: 20,
  },
  infoSection: {
    marginBottom: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.grey800,
    marginBottom: 5,
  },
  distance: {
    fontSize: 16,
    color: colors.grey400,
    marginBottom: 3,
  },
  location: {
    fontSize: 16,
    color: colors.grey400,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.grey800,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: colors.grey400,
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    backgroundColor: colors.grey,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 14,
    color: colors.grey800,
  },
  buttonContainer: {
    position: 'absolute',
//     bottom: 90,
    left: 0,
    right: 0,
    top:0,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: colors.grey,
  },
  closeButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default ProfileDetail;