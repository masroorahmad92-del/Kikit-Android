import React from 'react';
import {View, StyleSheet, SafeAreaView} from 'react-native';
import {createShimmerPlaceholder} from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';
import {colors, moderateScale} from '../theme';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

const GiftListShimmer = () => {
  // Create 8 shimmer items for the grid
  const shimmerItems = Array(8).fill(0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Shimmer */}
      <View style={styles.header}>
        <ShimmerPlaceholder
          style={styles.backButtonShimmer}
          shimmerColors={[colors.grey50, colors.grey100, colors.grey50]}
        />
        <ShimmerPlaceholder
          style={styles.titleShimmer}
          shimmerColors={[colors.grey50, colors.grey100, colors.grey50]}
        />
        <View style={styles.spacer} />
      </View>

      {/* Gift Grid Shimmer */}
      <View style={styles.gridContainer}>
        {shimmerItems.map((_, index) => (
          <View
            key={index}
            style={[
              styles.giftCardShimmer,
              index % 2 === 0 ? styles.cardLeft : styles.cardRight,
            ]}>
            <ShimmerPlaceholder
              style={styles.giftImageShimmer}
              shimmerColors={[colors.grey50, colors.grey100, colors.grey50]}
            />
            <ShimmerPlaceholder
              style={styles.giftNameShimmer}
              shimmerColors={[colors.grey50, colors.grey100, colors.grey50]}
            />
            <ShimmerPlaceholder
              style={styles.giftPriceShimmer}
              shimmerColors={[colors.grey50, colors.grey100, colors.grey50]}
            />
          </View>
        ))}
      </View>

      {/* Button Shimmer */}
      <View style={styles.buttonContainer}>
        <ShimmerPlaceholder
          style={styles.buttonShimmer}
          shimmerColors={[colors.grey50, colors.grey100, colors.grey50]}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gradientBG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(20),
  },
  backButtonShimmer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    marginRight: moderateScale(12),
  },
  titleShimmer: {
    width: moderateScale(80),
    height: moderateScale(32),
    borderRadius: moderateScale(8),
  },
  spacer: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: moderateScale(16),
  },
  giftCardShimmer: {
    width: '48%',
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    marginBottom: moderateScale(16),
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  cardLeft: {
    marginRight: moderateScale(4),
  },
  cardRight: {
    marginLeft: moderateScale(4),
  },
  giftImageShimmer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    marginBottom: moderateScale(12),
  },
  giftNameShimmer: {
    width: '80%',
    height: moderateScale(18),
    borderRadius: moderateScale(6),
    marginBottom: moderateScale(8),
  },
  giftPriceShimmer: {
    width: '60%',
    height: moderateScale(14),
    borderRadius: moderateScale(6),
  },
  buttonContainer: {
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(16),
    alignItems: 'center',
  },
  buttonShimmer: {
    width: '100%',
    height: moderateScale(52),
    borderRadius: moderateScale(12),
  },
});

export default GiftListShimmer;
