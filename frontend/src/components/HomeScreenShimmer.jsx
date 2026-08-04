import React from 'react';
import {View, StyleSheet, SafeAreaView} from 'react-native';
import {createShimmerPlaceholder} from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';
import {colors, moderateScale} from '../theme';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

const HomeScreenShimmer = () => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header Shimmer */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {/* Logo/Title shimmer */}
          <View style={styles.headerLeft}>
            <ShimmerPlaceholder
              style={styles.titleShimmer}
              shimmerColors={[colors.grey50, colors.grey100, colors.grey50]}
            />
            <ShimmerPlaceholder
              style={styles.subtitleShimmer}
              shimmerColors={[colors.grey50, colors.grey100, colors.grey50]}
            />
          </View>

          {/* Right icons shimmer */}
          <View style={styles.headerRight}>
            <ShimmerPlaceholder
              style={styles.iconShimmer}
              shimmerColors={[colors.grey50, colors.grey100, colors.grey50]}
            />
            <ShimmerPlaceholder
              style={styles.iconShimmer}
              shimmerColors={[colors.grey50, colors.grey100, colors.grey50]}
            />
            <ShimmerPlaceholder
              style={styles.iconShimmer}
              shimmerColors={[colors.grey50, colors.grey100, colors.grey50]}
            />
          </View>
        </View>
      </View>

      <View style={{height: moderateScale(10)}} />

      {/* Banner Shimmer */}
      <View style={styles.bannerContainer}>
        <ShimmerPlaceholder
          style={styles.bannerShimmer}
          shimmerColors={[colors.grey50, colors.grey100, colors.grey50]}
        />
      </View>

      <View style={{height: moderateScale(130)}} />

      {/* Cards Shimmer */}
      <View style={styles.cardContainer}>
        {/* Main card */}
        <View style={styles.card}>
          <ShimmerPlaceholder
            style={styles.cardImageShimmer}
            shimmerColors={[colors.grey50, colors.grey100, colors.grey50]}
          />
          <View style={styles.cardContent}>
            <ShimmerPlaceholder
              style={styles.cardNameShimmer}
              shimmerColors={[colors.grey50, colors.grey100, colors.grey50]}
            />
            
            <View style={styles.cardInfoRow}>
              <ShimmerPlaceholder
                style={styles.cardInfoShimmer}
                shimmerColors={[colors.grey50, colors.grey100, colors.grey50]}
              />
              <View style={{width: moderateScale(12)}} />
              <ShimmerPlaceholder
                style={styles.cardInfoShimmer}
                shimmerColors={[colors.grey50, colors.grey100, colors.grey50]}
              />
            </View>
            
            <ShimmerPlaceholder
              style={styles.cardLocationShimmer}
              shimmerColors={[colors.grey50, colors.grey100, colors.grey50]}
            />
          </View>
        </View>

        {/* Second card (slightly scaled down) */}
        <View style={[styles.card, styles.card2]}>
          <ShimmerPlaceholder
            style={styles.cardImageShimmer}
            shimmerColors={[colors.grey50, colors.grey100, colors.grey50]}
          />
          <View style={styles.cardContent}>
            <ShimmerPlaceholder
              style={styles.cardNameShimmer}
              shimmerColors={[colors.grey50, colors.grey100, colors.grey50]}
            />
          </View>
        </View>

        {/* Third card (more scaled down) */}
        <View style={[styles.card, styles.card3]}>
          <ShimmerPlaceholder
            style={styles.cardImageShimmer}
            shimmerColors={[colors.grey50, colors.grey100, colors.grey50]}
          />
        </View>
      </View>

      {/* Action Buttons Shimmer */}
      <View style={styles.actionButtons}>
        <ShimmerPlaceholder
          style={styles.actionButtonShimmer}
          shimmerColors={[colors.grey50, colors.grey100, colors.grey50]}
        />
        <ShimmerPlaceholder
          style={[styles.actionButtonShimmer, styles.mainButtonShimmer]}
          shimmerColors={[colors.grey50, colors.grey100, colors.grey50]}
        />
        <ShimmerPlaceholder
          style={styles.actionButtonShimmer}
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

  // Header Styles
  header: {
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(10),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  titleShimmer: {
    width: moderateScale(80),
    height: moderateScale(28),
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(6),
  },
  subtitleShimmer: {
    width: moderateScale(180),
    height: moderateScale(16),
    borderRadius: moderateScale(6),
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
  },
  iconShimmer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
  },

  // Banner Styles
  bannerContainer: {
    paddingHorizontal: moderateScale(20),
  },
  bannerShimmer: {
    width: '100%',
    height: moderateScale(120),
    borderRadius: moderateScale(16),
  },

  // Card Styles
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    position: 'absolute',
    width: moderateScale(340),
    height: moderateScale(500),
    borderRadius: moderateScale(24),
    backgroundColor: colors.white,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  card2: {
    transform: [{scale: 0.95}],
    opacity: 0.6,
  },
  card3: {
    transform: [{scale: 0.9}],
    opacity: 0.3,
  },
  cardImageShimmer: {
    width: '100%',
    height: moderateScale(320),
  },
  cardContent: {
    padding: moderateScale(16),
  },
  cardNameShimmer: {
    width: '60%',
    height: moderateScale(28),
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(12),
  },
  cardInfoRow: {
    flexDirection: 'row',
    marginBottom: moderateScale(12),
  },
  cardInfoShimmer: {
    width: moderateScale(80),
    height: moderateScale(18),
    borderRadius: moderateScale(6),
  },
  cardLocationShimmer: {
    width: '70%',
    height: 20,
    borderRadius: moderateScale(6),
  },

  // Action Buttons Styles
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(30),
    paddingHorizontal: moderateScale(20),
    gap: moderateScale(20),
  },
  actionButtonShimmer: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
  },
  mainButtonShimmer: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(35),
  },
});

export default HomeScreenShimmer;

