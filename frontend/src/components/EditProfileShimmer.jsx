import React from 'react';
import {View, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {createShimmerPlaceholder} from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';
import {ArrowBack} from '../assets/icons';
import {colors, moderateScale} from '../theme';
import {Text} from './base/Text';
import {SHIMMER_COLORS} from '../constants/shimmer';
const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

const EditProfileShimmer = ({onBack}) => {
  const renderInfoRow = (key) => (
    <View key={key} style={styles.infoRow}>
      <ShimmerPlaceholder style={styles.infoLabel} shimmerColors={SHIMMER_COLORS} />
      <ShimmerPlaceholder style={styles.infoValue} shimmerColors={SHIMMER_COLORS} />
    </View>
  );

  const renderDetailRow = (key) => (
    <View key={key} style={styles.detailRow}>
      <ShimmerPlaceholder style={styles.detailIcon} shimmerColors={SHIMMER_COLORS} />
      <View style={styles.detailText}>
        <ShimmerPlaceholder style={styles.detailLabel} shimmerColors={SHIMMER_COLORS} />
        <ShimmerPlaceholder style={styles.detailValue} shimmerColors={SHIMMER_COLORS} />
      </View>
      <ShimmerPlaceholder style={styles.chevron} shimmerColors={SHIMMER_COLORS} />
    </View>
  );

  const renderTagBlock = (key, chips = 3) => (
    <View key={key} style={styles.tagBlock}>
      <View style={styles.tagHeader}>
        <ShimmerPlaceholder style={styles.tagIcon} shimmerColors={SHIMMER_COLORS} />
        <ShimmerPlaceholder style={styles.tagTitle} shimmerColors={SHIMMER_COLORS} />
        <View style={styles.flexSpacer} />
        <ShimmerPlaceholder style={styles.editLink} shimmerColors={SHIMMER_COLORS} />
      </View>
      <View style={styles.tagContainer}>
        {Array.from({length: chips}).map((_, index) => (
          <ShimmerPlaceholder
            key={`${key}-chip-${index}`}
            style={styles.tagChip}
            shimmerColors={SHIMMER_COLORS}
          />
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}>
          <ArrowBack width={24} height={24} stroke={colors.grey800} />
        </TouchableOpacity>
        <Text ff="c-Regular" fs="XXL" color="grey800" style={styles.title}>
          Edit Profile
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.photoSection}>
          <View style={styles.photoContainer}>
            <ShimmerPlaceholder style={styles.photo} shimmerColors={SHIMMER_COLORS} />
          </View>
        </View>

        <View style={styles.infoCard}>
          {[0, 1, 2, 3].map((index) => renderInfoRow(index))}
        </View>

        <View style={styles.aboutWrapper}>
          <View style={styles.sectionHeader}>
            <ShimmerPlaceholder style={styles.sectionTitle} shimmerColors={SHIMMER_COLORS} />
            <ShimmerPlaceholder style={styles.editChip} shimmerColors={SHIMMER_COLORS} />
          </View>
          <View style={styles.aboutCard}>
            {[0, 1, 2].map((line) => (
              <ShimmerPlaceholder
                key={`about-${line}`}
                style={styles.aboutLine}
                shimmerColors={SHIMMER_COLORS}
              />
            ))}
          </View>
        </View>

        <View style={styles.sectionLabelRow}>
          <ShimmerPlaceholder style={styles.sectionTitle} shimmerColors={SHIMMER_COLORS} />
        </View>

        <View style={styles.detailCard}>
          {[0, 1, 2, 3, 4].map((index) => renderDetailRow(`detail-${index}`))}
          {renderTagBlock('interest', 3)}
          {renderTagBlock('hobby', 2)}
        </View>

        <View style={styles.saveWrapper}>
          <ShimmerPlaceholder style={styles.saveShimmer} shimmerColors={SHIMMER_COLORS} />
        </View>
      </ScrollView>
    </View>
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
  backButton: {
    marginRight: moderateScale(12),
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
    flex: 1,
  },
  scrollContent: {
    paddingBottom: moderateScale(40),
  },
  photoSection: {
    paddingHorizontal: moderateScale(20),
    marginBottom: moderateScale(20),
  },
  photoContainer: {
    width: '100%',
    height: moderateScale(280),
    borderRadius: moderateScale(20),
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(20),
  },
  infoCard: {
    backgroundColor: 'rgba(189, 224, 254, 0.2)',
    borderRadius: moderateScale(20),
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(20),
    marginHorizontal: moderateScale(20),
    marginBottom: moderateScale(20),
  },
  infoRow: {
    marginBottom: moderateScale(12),
  },
  infoLabel: {
    width: '40%',
    height: moderateScale(14),
    borderRadius: moderateScale(6),
    marginBottom: moderateScale(6),
  },
  infoValue: {
    width: '70%',
    height: moderateScale(18),
    borderRadius: moderateScale(6),
  },
  sectionTitle: {
    width: moderateScale(100),
    height: moderateScale(18),
    borderRadius: moderateScale(8),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    marginBottom: moderateScale(12),
  },
  editChip: {
    width: moderateScale(46),
    height: moderateScale(20),
    borderRadius: moderateScale(6),
  },
  aboutWrapper: {
    marginBottom: moderateScale(20),
  },
  aboutCard: {
    backgroundColor: 'rgba(189, 224, 254, 0.2)',
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginHorizontal: moderateScale(20),
  },
  aboutLine: {
    width: '100%',
    height: moderateScale(14),
    borderRadius: moderateScale(6),
    marginBottom: moderateScale(10),
  },
  sectionLabelRow: {
    paddingHorizontal: moderateScale(20),
    marginBottom: moderateScale(12),
  },
  detailCard: {
    backgroundColor: 'rgba(189, 224, 254, 0.2)',
    borderRadius: moderateScale(20),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(20),
    marginHorizontal: moderateScale(20),
    marginBottom: moderateScale(20),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  detailIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    marginRight: moderateScale(12),
  },
  detailText: {
    flex: 1,
  },
  detailLabel: {
    width: '60%',
    height: moderateScale(14),
    borderRadius: moderateScale(6),
    marginBottom: moderateScale(6),
  },
  detailValue: {
    width: '80%',
    height: moderateScale(18),
    borderRadius: moderateScale(6),
  },
  chevron: {
    width: moderateScale(14),
    height: moderateScale(14),
    borderRadius: moderateScale(7),
    marginLeft: moderateScale(8),
  },
  tagBlock: {
    marginTop: moderateScale(8),
  },
  tagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(4),
    marginBottom: moderateScale(12),
  },
  tagIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    marginRight: moderateScale(12),
  },
  tagTitle: {
    width: moderateScale(120),
    height: moderateScale(18),
    borderRadius: moderateScale(8),
  },
  flexSpacer: {
    flex: 1,
  },
  editLink: {
    width: moderateScale(40),
    height: moderateScale(16),
    borderRadius: moderateScale(6),
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  tagChip: {
    height: moderateScale(28),
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(16),
    minWidth: moderateScale(80),
  },
  saveWrapper: {
    marginTop: moderateScale(30),
    marginHorizontal: moderateScale(20),
  },
  saveShimmer: {
    height: moderateScale(50),
    borderRadius: moderateScale(25),
  },
});

export default EditProfileShimmer;


