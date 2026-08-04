import {Animated, StyleSheet, View} from 'react-native';
import React, {useRef, useState} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import GradientBackground from '../../../components/GradientBackground';
import {Text} from '../../../components/base/Text';
import {colors, moderateScale} from '../../../theme';
import {Button} from '../../../components/base/Button';

const Onboard1 = () => {
  const navigation = useNavigation();
  const [phase, setPhase] = useState(1); // 1 = first 3 images, 2 = second 3 images
  // const [showComp2, setShowComp2] = useState(false);

  // Animated values for image positions
  const img1Pos = useRef(new Animated.ValueXY({x: -140, y: 100})).current;
  const img2Pos = useRef(new Animated.ValueXY({x: 50, y: 200})).current;
  const img3Pos = useRef(new Animated.ValueXY({x: -30, y: 400})).current;

  const fadeAnim = useRef(new Animated.Value(1)).current; // fade in/out for transition
  const scaleAnim = useRef(new Animated.Value(0.5)).current; // scale for new images

  const animateToComp2 = () => {
    Animated.parallel([
      Animated.timing(img1Pos, {
        toValue: {x: 60, y: 300},
        duration: 450,
        useNativeDriver: false,
      }),
      Animated.timing(img2Pos, {
        toValue: {x: -100, y: 150},
        duration: 450,
        useNativeDriver: false,
      }),
      Animated.timing(img3Pos, {
        toValue: {x: 100, y: 30},
        duration: 450,
        useNativeDriver: false,
      }),
    ]).start();

    // Midway through movement, fade out old & fade in + scale new
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0.8,
        duration: 230,
        useNativeDriver: false,
      }).start(() => {
        setPhase(2); // switch to new images

        // Fade in + scale up new images
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: false,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 500,
            tension: 10,
            useNativeDriver: false,
          }),
        ]).start();
      });
    }, 0);
  };

  const handleNextPress = () => {
    if (phase === 1) {
      // First phase: animate to second set of images
      animateToComp2();
    } else if (phase === 2) {
      // Second phase: navigate to Onboard2
      navigation.navigate('onboard2');
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.container}>
          {phase === 1 ? (
            <>
              <Animated.Image
                source={require('../../../assets/images/onboard3.png')}
                style={[
                  styles.image,
                  {
                    transform: img1Pos.getTranslateTransform(),
                    opacity: fadeAnim,
                  },
                ]}
              />
              <Animated.Image
                source={require('../../../assets/images/onboard2.png')}
                style={[
                  styles.image2,
                  {
                    transform: img2Pos.getTranslateTransform(),
                    opacity: fadeAnim,
                  },
                ]}
              />
              <Animated.Image
                source={require('../../../assets/images/onboard1.png')}
                style={[
                  styles.image3,
                  {
                    transform: img3Pos.getTranslateTransform(),
                    opacity: fadeAnim,
                  },
                ]}
              />
            </>
          ) : (
            <>
              <Animated.Image
                source={require('../../../assets/images/onboard5.png')}
                style={[
                  styles.image4,
                  {
                    transform: [
                      ...img1Pos.getTranslateTransform(),
                      {scale: scaleAnim},
                    ],
                    opacity: fadeAnim,
                    resizeMode: 'contain',
                  },
                ]}
              />
              <Animated.Image
                source={require('../../../assets/images/onboard6.png')}
                style={[
                  styles.image5,
                  {
                    transform: [
                      ...img2Pos.getTranslateTransform(),
                      {scale: scaleAnim},
                    ],
                    opacity: fadeAnim,
                    resizeMode: 'contain',
                  },
                ]}
              />
              <Animated.Image
                source={require('../../../assets/images/onboard4.png')}
                style={[
                  styles.image6,
                  {
                    transform: [
                      ...img3Pos.getTranslateTransform(),
                      {scale: scaleAnim},
                    ],
                    opacity: fadeAnim,
                    resizeMode: 'contain',
                  },
                ]}
              />
            </>
          )}
        </View>
        <View style={styles.buttonContainer}>
          <View
            style={{
              paddingHorizontal: moderateScale(50),
            }}>
            <Text style={{textAlign: 'center'}}>
              Verified
              <Text color="primary"> Live </Text>
              Rooms
            </Text>
          </View>
          <Text
            fs="S"
            ff="i-medium"
            color="grey400"
            style={{
              textAlign: 'center',
              letterSpacing: 0.14,
              paddingVertical: 13,
            }}>
            Join interest-based live rooms, participate in safe conversations,
            and support hosts with gifts.
          </Text>
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                {backgroundColor: phase === 1 ? colors.primary : colors.white},
              ]}
            />
            <View
              style={[
                styles.progressBar,
                {backgroundColor: phase === 2 ? colors.primary : colors.white},
              ]}
            />
          </View>
          <Button title="Next" onPress={handleNextPress} />
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
};

export default Onboard1;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 20,
  },
  image: {
    position: 'absolute',
    width: 93,
    height: 93,
  },
  image2: {
    position: 'absolute',
    width: 78,
    height: 78,
  },
  image3: {
    position: 'absolute',
    width: 70,
    height: 70,
  },
  image4: {
    position: 'absolute',
    width: 190,
    height: 190,
  },
  image5: {
    position: 'absolute',
    width: 170,
    height: 170,
  },
  image6: {
    position: 'absolute',
    width: 120,
    height: 120,
  },
  buttonContainer: {
    marginHorizontal: moderateScale(20),
    marginBottom: moderateScale(20),
    // flex: 1,
    // justifyContent: 'flex-end',
    // paddingBottom: 50,
    // alignSelf: 'center',
  },
  titleWrap: {
    paddingHorizontal: moderateScale(50),
    justifyContent: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 16,
    marginVertical: 16,
  },
  progressBar: {
    width: 76,
    height: 8,
    borderRadius: 100,
    opacity: 0.95,
  },
});
