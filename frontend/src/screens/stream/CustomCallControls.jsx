// components/CustomCallControls.jsx
import React from 'react';
import {View, StyleSheet, TouchableOpacity, Platform} from 'react-native';
import {
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
  ToggleCameraFaceButton,
  HangUpCallButton,
} from '@stream-io/video-react-native-sdk';
import {GiftIcon} from '../../assets/icons';
import { colors, moderateScale } from '../../theme';

const CustomCallControls = ({onGiftPress}) => {
  return (
    <View style={styles.container}>
      <ToggleAudioPublishingButton />
      <ToggleVideoPublishingButton />
      <TouchableOpacity
        style={styles.giftButton}
        onPress={onGiftPress}
        activeOpacity={0.7}>
        <GiftIcon width={24} height={24} />
      </TouchableOpacity>
      <ToggleCameraFaceButton />
      <HangUpCallButton />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
   giftButton: {
    width: moderateScale(45),
    height: moderateScale(45),
    borderRadius: moderateScale(50),
    backgroundColor: colors.normal,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
});

export default CustomCallControls;
