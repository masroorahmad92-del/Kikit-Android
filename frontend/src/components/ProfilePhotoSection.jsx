import React, {useState} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import FastImage from 'react-native-fast-image';
import {createShimmerPlaceholder} from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';
import {Text} from './base/Text';
import {colors, moderateScale} from '../theme';
import {EditPencil} from '../assets/icons';
import {SHIMMER_COLORS} from '../constants/shimmer';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

const ProfilePhotoSection = ({photo, onEditPress, containerStyle}) => {
  const [imageLoading, setImageLoading] = useState(true);

  const isRemoteImage = photo && typeof photo === 'object' && photo.uri;

  return (
    <View style={[styles.container, containerStyle]}>
      {/* <View style={styles.header}>
        <Text ff="c-Regular" fs="L" color="grey800" style={styles.title}>
          Photos
        </Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={onEditPress}
          activeOpacity={0.8}>
          <EditPencil width={20} height={20} stroke={colors.secondary} />
        </TouchableOpacity>
      </View> */}
      
      <View style={styles.imageContainer}>
        {/* Shimmer Placeholder */}
        <ShimmerPlaceholder
          visible={!imageLoading}
          style={styles.photo}
          shimmerColors={SHIMMER_COLORS}>
          {isRemoteImage ? (
            <FastImage
              source={photo}
              style={styles.photo}
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
              resizeMode={FastImage.resizeMode.cover}
            />
          ) : (
            <FastImage
              source={photo}
              style={styles.photo}
              onLoadEnd={() => setImageLoading(false)}
              resizeMode={FastImage.resizeMode.cover}
            />
          )}
        </ShimmerPlaceholder>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: moderateScale(20),
    marginBottom: moderateScale(20),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  title: {
    fontWeight: '700',
  },
  editButton: {
    padding: moderateScale(4),
  },
  imageContainer: {
    width: '100%',
    height: moderateScale(280),
    borderRadius: moderateScale(20),
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: moderateScale(280),
    borderRadius: moderateScale(20),
  },
});

export default ProfilePhotoSection;

