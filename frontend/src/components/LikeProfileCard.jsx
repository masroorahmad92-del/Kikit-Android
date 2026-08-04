import React, {useState} from 'react';
import {View, StyleSheet, TouchableOpacity, ActivityIndicator} from 'react-native';
import FastImage from 'react-native-fast-image';
import {createShimmerPlaceholder} from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';
import {Text} from './base/Text';
import {colors, moderateScale} from '../theme';
import {Close, HeartFilledIcon, LocationIcon} from '../assets/icons';
import {SHIMMER_COLORS} from '../constants/shimmer';
import {getPrimaryPhoto} from '../utils/helpers';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

const LikeProfileCard = ({
  item,
  onPressCard,
  onPressLike,
  onPressReject,
  containerStyle,
  isProcessing = false,
}) => {
  // console.log('Rendering LikeProfileCard for:', item?.originalData?.photos);
  const {name, age, distance, image} = item;
  const primaryPhoto = getPrimaryPhoto(item?.originalData?.photos);
  const profileImage = primaryPhoto ? {uri: primaryPhoto.url} : image;
  const [imageLoading, setImageLoading] = useState(true);

  // Check if image is remote (has uri) or local (require)
  const isRemoteImage = profileImage && typeof profileImage === 'object' && profileImage.uri;

  return (
    <TouchableOpacity
      style={[styles.container, containerStyle]}
      onPress={onPressCard}
      activeOpacity={0.95}>
      {/* Profile Image Container */}
      <View style={styles.imageContainer}>
        <ShimmerPlaceholder
          visible={!imageLoading}
          style={styles.shimmer}
          shimmerColors={SHIMMER_COLORS}>
          {isRemoteImage ? (
            <FastImage
              source={profileImage}
              style={styles.image}
              resizeMode={FastImage.resizeMode.cover}
              priority={FastImage.priority.high}
              cache={FastImage.cacheControl.immutable}
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                console.log('Image load error');
              }}
            />
          ) : (
            <FastImage
              source={profileImage}
              style={styles.image}
              resizeMode={FastImage.resizeMode.cover}
              priority={FastImage.priority.high}
              cache={FastImage.cacheControl.immutable}
              onLoadEnd={() => setImageLoading(false)}
            />
          )}
        </ShimmerPlaceholder>
      </View>

      {/* Gradient Overlay for better text readability */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.7)']}
        locations={[0, 0.6, 1]}
        style={styles.overlay}
      />

      {/* Profile Info - Bottom */}
      <View style={styles.infoContainer}>
        <View style={styles.profileTextContainer}>
          <View style={styles.nameRow}>
            <Text ff="c-Regular" fs="L" color="white" style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            {age && (
              <Text ff="c-Regular" fs="M" color="white" style={styles.age}>
                {age}
              </Text>
            )}
          </View>
          {distance && (
            <View style={styles.distanceContainer}>
              <LocationIcon width={12} height={12} fill={colors.white} />
              <Text ff="c-Regular" fs="XS" color="white" style={styles.distance} numberOfLines={1}>
                {distance}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons - Right side of profile info - Only show if user hasn't liked them back */}
        {item?.originalData?.is_liked === false && (
          <View style={styles.actionContainer}>
            {/* Ignore Button */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                if (!isProcessing) {
                  onPressReject();
                }
              }}
              activeOpacity={0.7}
              disabled={isProcessing}>
              <View style={[styles.rejectButtonInner, isProcessing && styles.buttonDisabled]}>
                <Close width={18} height={18} stroke={colors.white} />
              </View>
            </TouchableOpacity>

            {/* Like Back Button */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                if (!isProcessing) {
                  onPressLike();
                }
              }}
              activeOpacity={0.7}
              disabled={isProcessing}>
              <View style={[styles.likeButtonInner, isProcessing && styles.buttonDisabled]}>
                <HeartFilledIcon width={18} height={18} fill={colors.secondary} />
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Loading Overlay */}
      {isProcessing && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.secondary} />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: moderateScale(240),
    borderRadius: moderateScale(20),
    overflow: 'hidden',
    backgroundColor: colors.grey100,
    shadowColor: colors.grey800,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  shimmer: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  actionContainer: {
    flexDirection: 'column',
    gap: moderateScale(18),
    alignItems: 'center',
  },
  actionButton: {
    width: moderateScale(35),
    height: moderateScale(35),
    borderRadius: moderateScale(24),
    overflow: 'hidden',
  },
  rejectButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(24),
    backgroundColor: '#FF4757',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  likeButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(24),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  likeButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.secondary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: moderateScale(12),
    paddingBottom: moderateScale(12),
    paddingTop: moderateScale(50),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  profileTextContainer: {
    flex: 1,
    marginRight: moderateScale(8),
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'baseline',
    marginBottom: moderateScale(6),
    gap: moderateScale(6),
  },
  name: {
    fontWeight: '700',
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  age: {
    fontWeight: '500',
    opacity: 0.95,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
  },
  distance: {
    fontWeight: '500',
    opacity: 0.95,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    borderRadius: moderateScale(20),
  },
  loadingContainer: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    shadowColor: colors.grey800,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default LikeProfileCard;

